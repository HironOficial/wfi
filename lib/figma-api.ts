import type {
  FigmaProject,
  FigmaPage,
  FigmaAsset,
  AssetType,
  FileFormat,
  DownloadSettings,
  FigmaFileResponse,
} from "@/types/figma"
import JSZip from "jszip"
import FileSaver from "file-saver"
import { createDownloadWorker } from "@/lib/worker-utils"
import { createAssetProcessorWorker } from "@/lib/worker-utils"

interface WorkerResult {
  assetIds: string[]
  assetNames: Record<string, string>
  assetTypesRecord: Record<string, AssetType>
  assetFonts: Record<string, {
    fontFamily: string
    fontStyle: string
    fontSize: number
    fontWeight: number
  }>
  uniqueFonts: string[]
  pageId: string
  pageName: string
}

// Process nodes directly in the main thread (fallback implementation)
function processNodesInMainThread(data: any) {
  const { nodes, requestedAssetTypes, pageName, pageId } = data;
  const assetIds: string[] = [];
  const assetNames: Record<string, string> = {};
  const assetTypesRecord: Record<string, AssetType> = {};
  const assetFonts: Record<string, any> = {};
  const uniqueFonts = new Set<string>();

  function mapNodeTypeToAssetType(nodeType: string): AssetType {
    if (nodeType === "IMAGE") return "IMAGES";
    if (["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(nodeType))
      return "VECTORS";
    if (nodeType === "TEXT") return "TEXT";
    if (["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(nodeType)) return "COMPONENTS";
    if (["FRAME", "GROUP", "SECTION"].includes(nodeType)) return "FRAMES";
    return "VECTORS";
  }

  function processNode(node: any) {
    if (!node) return;
    
    let isMatch = false;

    if (requestedAssetTypes.includes("VECTORS")) {
      const vectorTypes = ["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"];
      const hasVectorPaths = Array.isArray(node.vectorPaths) && node.vectorPaths.length > 0;
      
      isMatch = Boolean(
        (node.type && vectorTypes.includes(node.type)) ||
        node.geometryType === "VECTOR" ||
        hasVectorPaths ||
        (node.vectorNetwork && Object.keys(node.vectorNetwork).length > 0)
      );
    }

    if (requestedAssetTypes.includes("IMAGES") && node.type === "IMAGE") isMatch = true;

    if (requestedAssetTypes.includes("TEXT") && node.type === "TEXT") {
      isMatch = true;
      if (node.style?.fontFamily) {
        const fontFamily = node.style.fontFamily;
        const fontStyle = node.style.italic ? "Italic" : "Regular";
        const fontSize = node.style.fontSize;
        const fontWeight = node.style.fontWeight;

        assetFonts[node.id] = {
          fontFamily,
          fontStyle,
          fontSize,
          fontWeight,
        };
        uniqueFonts.add(`${fontFamily}-${fontStyle}-${fontWeight}`);
      }
    }

    if (requestedAssetTypes.includes("COMPONENTS") && node.type && 
        ["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(node.type))
      isMatch = true;

    if (requestedAssetTypes.includes("FRAMES") && node.type &&
        ["FRAME", "GROUP", "SECTION"].includes(node.type))
      isMatch = true;

    if (isMatch && node.id) {
      assetIds.push(node.id);
      assetNames[node.id] = node.name || `Asset ${node.id}`;
      assetTypesRecord[node.id] = node.type ? mapNodeTypeToAssetType(node.type) : "VECTORS";
    }

    if (node.children) {
      node.children.forEach((child: any) => processNode(child));
    }
  }

  // Process all nodes in this chunk
  Object.values(nodes).forEach((nodeData: any) => {
    if (nodeData?.document) {
      processNode(nodeData.document);
    }
  });

  return {
    assetIds,
    assetNames,
    assetTypesRecord,
    assetFonts,
    uniqueFonts: Array.from(uniqueFonts),
    pageId,
    pageName
  };
}

// Extract file ID from Figma URL
export function extractFileIdFromUrl(url: string): string | null {
  // Handle both /file/ and /design/ URL formats
  const regex = /(?:file|design)\/([a-zA-Z0-9]+)/
  const match = url.match(regex)

  if (match && match[1]) {
    return match[1]
  }

  // If the above pattern doesn't match, try extracting from the URL directly
  const urlObj = new URL(url)
  const pathSegments = urlObj.pathname.split("/")

  // Find the segment after 'design' or 'file'
  for (let i = 0; i < pathSegments.length - 1; i++) {
    if (pathSegments[i] === "design" || pathSegments[i] === "file") {
      return pathSegments[i + 1]
    }
  }

  return null
}

// Fetch Figma project data
export async function fetchFigmaProject(fileId: string, apiKey: string): Promise<FigmaProject> {
  try {
    const response = await fetch(`/api/figma/file?fileId=${fileId}`, {
      headers: {
        "X-Figma-Token": apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch Figma project")
    }

    const data = (await response.json()) as FigmaFileResponse

    // Extract pages from the document
    const pages: FigmaPage[] = data.document.children.map((page) => ({
      id: page.id,
      name: page.name,
    }))

    return {
      id: fileId,
      apiKey,
      name: data.name,
      lastModified: new Date(data.lastModified).toLocaleDateString(),
      pages,
    }
  } catch (error) {
    console.error("Error fetching Figma project:", error)
    throw error
  }
}

// Fetch assets from selected pages
export async function fetchAssets(
  fileId: string,
  apiKey: string,
  pageIds: string[],
  assetTypes: AssetType[],
  format: FileFormat,
): Promise<FigmaAsset[]> {
  console.log("[fetchAssets] Starting asset fetch process...", { pageIds, assetTypes, format });
  
  try {
    console.log("[fetchAssets] Fetching nodes from Figma API...");
    // Get nodes from the file with more details
    const nodesResponse = await fetch(
      `https://api.figma.com/v1/files/${fileId}/nodes?ids=${pageIds.join(",")}&geometry=paths`,
      {
      headers: {
        "X-Figma-Token": apiKey,
        },
      },
    )

    if (!nodesResponse.ok) {
      const error = await nodesResponse.json()
      console.error("[fetchAssets] Failed to fetch nodes:", error);
      throw new Error(error.message || "Failed to fetch Figma nodes")
    }

    console.log("[fetchAssets] Successfully fetched nodes, parsing response...");
    const nodesData = await nodesResponse.json()
    console.log("[fetchAssets] Nodes data received, starting worker processing...");

    // Process nodes in parallel using workers
    const workerPromises = pageIds.map(pageId => {
      return new Promise((resolve, reject) => {
        try {
          console.log(`[fetchAssets] Creating worker for page ${pageId}...`);
          const worker = createAssetProcessorWorker()
          
          if (!worker) {
            console.log(`[fetchAssets] No worker available for page ${pageId}, falling back to main thread...`);
            // Process in main thread instead
            const data = {
              nodes: { [pageId]: nodesData.nodes[pageId] },
              requestedAssetTypes: assetTypes,
              pageName: nodesData.nodes[pageId]?.document?.name || "",
              pageId
            };
            resolve(processNodesInMainThread(data));
            return;
          }

          // Set up a timeout
          const timeoutId = setTimeout(() => {
            console.warn(`[fetchAssets] Worker timeout for page ${pageId}, falling back to main thread...`);
            worker.terminate();
            
            // Process in main thread instead
            const data = {
              nodes: { [pageId]: nodesData.nodes[pageId] },
              requestedAssetTypes: assetTypes,
              pageName: nodesData.nodes[pageId]?.document?.name || "",
              pageId
            };
            resolve(processNodesInMainThread(data));
          }, 10000); // 10 second timeout
          
          worker.addEventListener('message', (e: MessageEvent) => {
            clearTimeout(timeoutId);
            console.log(`[fetchAssets] Worker completed for page ${pageId}`);
            worker.terminate();
            resolve(e.data);
          });

          worker.addEventListener('error', (error: ErrorEvent) => {
            clearTimeout(timeoutId);
            console.warn(`[fetchAssets] Worker error for page ${pageId}, falling back to main thread:`, error);
            worker.terminate();
            
            // Process in main thread instead
            const data = {
              nodes: { [pageId]: nodesData.nodes[pageId] },
              requestedAssetTypes: assetTypes,
              pageName: nodesData.nodes[pageId]?.document?.name || "",
              pageId
            };
            resolve(processNodesInMainThread(data));
          });

          console.log(`[fetchAssets] Sending data to worker for page ${pageId}...`);
          // Send the nodes for this page to the worker
          worker.postMessage({
            nodes: { [pageId]: nodesData.nodes[pageId] },
            requestedAssetTypes: assetTypes,
            pageName: nodesData.nodes[pageId]?.document?.name || "",
            pageId
          });
        } catch (error) {
          console.warn(`[fetchAssets] Failed to process page ${pageId} with worker:`, error);
          
          // Process in main thread instead
          const data = {
            nodes: { [pageId]: nodesData.nodes[pageId] },
            requestedAssetTypes: assetTypes,
            pageName: nodesData.nodes[pageId]?.document?.name || "",
            pageId
          };
          resolve(processNodesInMainThread(data));
        }
      });
    })

    console.log("[fetchAssets] Waiting for all workers to complete...");
    // Wait for all workers to complete
    const results = await Promise.all(workerPromises) as WorkerResult[]
    console.log("[fetchAssets] All workers completed, processing results...");

    // Combine results from all workers
    const assetIds: string[] = []
    const assetNames: Record<string, string> = {}
    const assetTypesRecord: Record<string, AssetType> = {}
    const assetFonts: Record<string, any> = {}
    const assetPages: Record<string, { id: string; name: string }> = {}
    const uniqueFonts = new Set<string>()

    results.forEach((result: WorkerResult) => {
      assetIds.push(...result.assetIds)
      Object.assign(assetNames, result.assetNames)
      Object.assign(assetTypesRecord, result.assetTypesRecord)
      Object.assign(assetFonts, result.assetFonts)
      result.uniqueFonts.forEach(font => uniqueFonts.add(font))
      
      // Add page info for each asset
      result.assetIds.forEach(id => {
        assetPages[id] = { id: result.pageId, name: result.pageName }
      })
    })

    if (assetIds.length === 0) {
      return []
    }

    // Get image URLs for the assets
    const imagesResponse = await fetch(
      `https://api.figma.com/v1/images/${fileId}?ids=${assetIds.join(",")}&format=${format.toLowerCase()}&svg_include_id=true`,
      {
        headers: {
          "X-Figma-Token": apiKey,
        },
      },
    )

    if (!imagesResponse.ok) {
      const error = await imagesResponse.json()
      throw new Error(error.message || "Failed to fetch Figma images")
    }

    const imagesData = await imagesResponse.json()

    // Get font files for text elements
    const textAssets = assetIds.filter(id => assetTypesRecord[id] === "TEXT" && assetFonts[id]?.fontFamily)
    const fontUrls: Record<string, string> = {}

    if (textAssets.length > 0) {
      try {
        // First get the file styles to find font references
        const stylesResponse = await fetch(
          `https://api.figma.com/v1/files/${fileId}/styles`,
          {
            headers: {
              "X-Figma-Token": apiKey,
            },
          }
        )

        if (stylesResponse.ok) {
          const stylesData = await stylesResponse.json()
          const textStyles = stylesData.meta.styles.filter((style: any) => style.style_type === "TEXT")

          // For each text asset, try to find its font
          await Promise.all(textAssets.map(async (assetId) => {
            const fontInfo = assetFonts[assetId]
            if (fontInfo?.fontFamily) {
              // Try to find matching style
              const matchingStyle = textStyles.find((style: any) => {
                const styleDescription = style.description || ""
                return styleDescription.includes(fontInfo.fontFamily) &&
                  (!fontInfo.fontStyle || styleDescription.includes(fontInfo.fontStyle)) &&
                  (!fontInfo.fontWeight || styleDescription.includes(fontInfo.fontWeight.toString()))
              })

              if (matchingStyle) {
                // Get the font file URL
                const fontResponse = await fetch(
                  `https://api.figma.com/v1/files/${fileId}/styles/${matchingStyle.key}/font`,
                  {
                    headers: {
                      "X-Figma-Token": apiKey,
                    },
                  }
                )

                if (fontResponse.ok) {
                  const fontData = await fontResponse.json()
                  if (fontData.url) {
                    fontUrls[assetId] = fontData.url
                  }
                }
              }
            }
          }))
        }
      } catch (error) {
        console.error("Error fetching font files:", error)
      }
    }

    // Construct the final assets array
    return assetIds.map(assetId => ({
      id: assetId,
      name: assetNames[assetId],
      type: assetTypesRecord[assetId],
      url: imagesData.images[assetId] || fontUrls[assetId] || "",
      format: format,
      pageId: assetPages[assetId].id,
      pageName: assetPages[assetId].name,
      fontFamily: assetFonts[assetId]?.fontFamily,
      fontStyle: assetFonts[assetId]?.fontStyle,
      fontWeight: assetFonts[assetId]?.fontWeight,
      fontSize: assetFonts[assetId]?.fontSize,
      thumbnailUrl: imagesData.images[assetId] || ""
    }))

  } catch (error) {
    console.error("Error fetching assets:", error)
    throw error
  }
}

// Download assets
export async function downloadAssets(
  assets: FigmaAsset[],
  format: FileFormat,
  settings: DownloadSettings,
  onProgress?: (progress: number) => void,
): Promise<void> {
  console.log("[downloadAssets] Starting download process...", {
    assetCount: assets.length,
    format,
    textExportOption: settings.textExportOption
  });

  try {
    // Filter assets based on text export option
    let assetsToDownload = [...assets];
    console.log("[downloadAssets] Initial assets count:", assetsToDownload.length);

    if (settings.textExportOption === "FONT") {
      // Only include text assets with fonts
      assetsToDownload = assets.filter((asset) => asset.type === "TEXT" && asset.fontFamily);
      console.log("[downloadAssets] Filtered to font-only assets:", assetsToDownload.length);
    } else if (settings.textExportOption === "IMAGE") {
      // Include all assets except font-only ones
      assetsToDownload = assets;
      console.log("[downloadAssets] Using all assets as images:", assetsToDownload.length);
    }

    // Apply name prefix filter if specified
    if (settings.namePrefix) {
      assetsToDownload = assetsToDownload.filter((asset) => asset.name.startsWith(settings.namePrefix || ""));
      console.log("[downloadAssets] Applied prefix filter, remaining assets:", assetsToDownload.length);
    }

    if (settings.includeInZip) {
      console.log("[downloadAssets] Starting ZIP download process...");
      await downloadAsZip(assetsToDownload, format, settings, onProgress);
    } else {
      console.log("[downloadAssets] Starting individual download process...");
      await downloadIndividually(assetsToDownload, settings, onProgress);
    }
    
    console.log("[downloadAssets] Download process completed successfully");
  } catch (error) {
    console.error("[downloadAssets] Error during download:", error);
    throw error;
  }
}

// Download assets as a ZIP file
async function downloadAsZip(
  assets: FigmaAsset[], 
  format: FileFormat, 
  settings: DownloadSettings,
  onProgress?: (progress: number) => void,
): Promise<void> {
  console.log("[downloadAsZip] Initializing ZIP download...", { totalAssets: assets.length });
  const zip = new JSZip();
  const totalAssets = assets.length;
  let completedAssets = 0;
  let failedAssets = 0;

  try {
    // Create folder structure
    const folders = {
      images: zip.folder("images"),
      vectors: zip.folder("vectors"),
      components: zip.folder("components"),
      text: zip.folder("text"),
      frames: zip.folder("frames"),
      fonts: zip.folder("fonts")
    };

    // Process assets in parallel batches
    const batchSize = 10; // Increased batch size for more parallel processing
    const batches = [];
    const processedFonts = new Set<string>();
    
    for (let i = 0; i < assets.length; i += batchSize) {
      batches.push(assets.slice(i, i + batchSize));
    }
    
    console.log(`[downloadAsZip] Processing ${batches.length} batches of ${batchSize} assets each`);

    // First, process all font information
    console.log("[downloadAsZip] Processing font information...");
    const textAssets = assets.filter(asset => asset.type === "TEXT" && asset.fontFamily);
    for (const asset of textAssets) {
      const fontId = `${asset.fontFamily}-${asset.fontStyle || "Regular"}-${asset.fontWeight || "400"}`;
      if (!processedFonts.has(fontId) && folders.fonts) {
        console.log(`[downloadAsZip] Adding font info: ${fontId}`);
        processedFonts.add(fontId);

        const fontInfo = `
/*
Font Information
---------------
Family: ${asset.fontFamily}
Style: ${asset.fontStyle || "Regular"}
Weight: ${asset.fontWeight || "Normal"}
Size: ${asset.fontSize || "Default"}px

To use this font in your project:
1. Download the font from one of these sources:
   - Google Fonts: https://fonts.google.com/
   - Adobe Fonts: https://fonts.adobe.com/
   - Font Squirrel: https://www.fontsquirrel.com/

2. Once you have the font file, you can use this CSS:

@font-face {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  src: url('path-to-your-font-file.ttf') format('truetype');
}

${asset.fontFamily ? `.${asset.fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')} {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  font-size: ${asset.fontSize || "inherit"}px;
}` : '/* No font family specified */'}
*/`;
        folders.fonts.file(`${fontId}.txt`, fontInfo);
      }
    }

    // Process asset downloads in parallel batches
    for (const [batchIndex, batch] of batches.entries()) {
      console.log(`[downloadAsZip] Processing batch ${batchIndex + 1}/${batches.length}`);
      
      // Process all assets in the batch simultaneously
      await Promise.all(batch.map(async (asset) => {
        try {
          console.log(`[downloadAsZip] Processing asset: ${asset.name} (${asset.type})`);
          
          // Get the appropriate folder based on asset type
          const getFolder = (type: string) => {
            switch (type) {
              case "IMAGES": return folders.images;
              case "VECTORS": return folders.vectors;
              case "COMPONENTS": return folders.components;
              case "TEXT": return folders.text;
              case "FRAMES": return folders.frames;
              default: return zip;
            }
          };

          // Create subfolder for the page if it doesn't exist
          const baseFolder = getFolder(asset.type);
          const pageFolder = baseFolder?.folder(asset.pageName.replace(/[^a-z0-9]/gi, '_'));

          if (asset.url && (settings.textExportOption !== "FONT" || asset.type !== "TEXT")) {
            console.log(`[downloadAsZip] Downloading: ${asset.name}`);
            
            // Add retries for failed downloads
            let retries = 3;
            let success = false;
            
            while (retries > 0 && !success) {
              try {
                const response = await fetch(asset.url);
                if (!response.ok) {
                  throw new Error(`Failed to fetch asset: ${response.statusText}`);
                }
                const blob = await response.blob();
                
                // Add file to the appropriate subfolder
                const fileName = `${settings.prefix || ""}${asset.name}.${asset.format.toLowerCase()}`;
                if (pageFolder) {
                  pageFolder.file(fileName, blob);
                  success = true;
                } else {
                  throw new Error("Failed to create page folder");
                }
              } catch (error) {
                retries--;
                if (retries === 0) {
                  throw error;
                }
                console.warn(`[downloadAsZip] Retry ${3 - retries}/3 for ${asset.name}`);
                await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
              }
            }
          }

          completedAssets++;
          const progress = Math.round((completedAssets / totalAssets) * 100);
          console.log(`[downloadAsZip] Progress: ${progress}% (${completedAssets}/${totalAssets})`);
          onProgress?.(progress);
        } catch (error) {
          failedAssets++;
          console.error(`[downloadAsZip] Error processing asset ${asset.name}:`, error);
          // Continue with other assets even if one fails
        }
      }));

      // Add a small delay between batches to prevent rate limiting
      if (batchIndex < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200)); // Reduced delay between batches
      }
    }

    if (failedAssets > 0) {
      console.warn(`[downloadAsZip] Failed to download ${failedAssets} assets`);
    }

    console.log("[downloadAsZip] Generating final ZIP file...");
    const content = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: {
        level: 5
      }
    });
    console.log("[downloadAsZip] ZIP file generated, initiating download...");
    
    FileSaver.saveAs(content, `figma-assets-${new Date().toISOString().slice(0, 10)}.zip`);
    console.log("[downloadAsZip] Download completed successfully");
  } catch (error) {
    console.error("[downloadAsZip] Error during ZIP creation:", error);
    throw error;
  }
}

// Download assets individually
async function downloadIndividually(
  assets: FigmaAsset[], 
  settings: DownloadSettings,
  onProgress?: (progress: number) => void,
): Promise<void> {
  console.log("[downloadIndividually] Starting individual downloads...");
  const prefix = settings.prefix || "";
  const processedFonts = new Set<string>();
  let completedAssets = 0;
  const totalAssets = assets.length;

  try {
    // Process assets in smaller batches
    const batchSize = 3;
    for (let i = 0; i < assets.length; i += batchSize) {
      const batch = assets.slice(i, i + batchSize);
      console.log(`[downloadIndividually] Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(assets.length/batchSize)}`);

      await Promise.all(batch.map(async (asset) => {
        try {
          // Handle font information for text assets
          if (asset.type === "TEXT" && asset.fontFamily && settings.textExportOption !== "IMAGE") {
            const fontId = `${asset.fontFamily}-${asset.fontStyle}-${asset.fontWeight}`;
            if (!processedFonts.has(fontId)) {
              console.log(`[downloadIndividually] Processing font: ${fontId}`);
              processedFonts.add(fontId);
              
              const fontInfo = `
/*
Font Information
---------------
Family: ${asset.fontFamily}
Style: ${asset.fontStyle || "Regular"}
Weight: ${asset.fontWeight || "Normal"}
Size: ${asset.fontSize || "Default"}px
*/`;
              const infoBlob = new Blob([fontInfo], { type: "text/plain" });
              FileSaver.saveAs(infoBlob, `${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}-info.txt`);
            }
          }

          // For assets with URLs, fetch and download
          if (asset.url && (settings.textExportOption !== "FONT" || asset.type !== "TEXT")) {
            console.log(`[downloadIndividually] Downloading asset: ${asset.name}`);
            const response = await fetch(asset.url);
            if (!response.ok) {
              throw new Error(`Failed to fetch asset: ${response.statusText}`);
            }
            const blob = await response.blob();
            const fileName = `${prefix}${asset.name}.${asset.format.toLowerCase()}`;
            FileSaver.saveAs(blob, fileName);
          }

          completedAssets++;
          const progress = Math.round((completedAssets / totalAssets) * 100);
          console.log(`[downloadIndividually] Progress: ${progress}%`);
          onProgress?.(progress);
        } catch (error) {
          console.error(`[downloadIndividually] Error processing ${asset.name}:`, error);
          // Continue with other assets even if one fails
        }
      }));
    }
    
    console.log("[downloadIndividually] All downloads completed");
  } catch (error) {
    console.error("[downloadIndividually] Error during download process:", error);
    throw error;
  }
}

