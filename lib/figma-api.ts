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
import { createAssetProcessorWorker } from "@/lib/asset-processor.worker"

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
  try {
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
      throw new Error(error.message || "Failed to fetch Figma nodes")
    }

    const nodesData = await nodesResponse.json()

    // Process nodes in parallel using workers
    const workerPromises = pageIds.map(pageId => {
      return new Promise((resolve, reject) => {
        const worker = createAssetProcessorWorker()
        
        worker.onmessage = (e) => {
          worker.terminate()
          resolve(e.data)
        }

        worker.onerror = (error) => {
          worker.terminate()
          reject(error)
        }

        // Send the nodes for this page to the worker
        worker.postMessage({
          nodes: { [pageId]: nodesData.nodes[pageId] },
          requestedAssetTypes: assetTypes,
          pageName: nodesData.nodes[pageId]?.document?.name || "",
          pageId
        })
      })
    })

    // Wait for all workers to complete
    const results = await Promise.all(workerPromises) as WorkerResult[]

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
  try {
    // Filter assets based on text export option
    let assetsToDownload = [...assets]

    if (settings.textExportOption === "FONT") {
      // Only include text assets with fonts
      assetsToDownload = assets.filter((asset) => asset.type === "TEXT" && asset.fontFamily)
    } else if (settings.textExportOption === "IMAGE") {
      // Include all assets except font-only ones
      assetsToDownload = assets
    }

    // Apply name prefix filter if specified
    if (settings.namePrefix) {
      assetsToDownload = assetsToDownload.filter((asset) => asset.name.startsWith(settings.namePrefix || ""))
    }

    if (settings.includeInZip) {
      await downloadAsZip(assetsToDownload, format, settings, onProgress)
    } else {
      await downloadIndividually(assetsToDownload, settings, onProgress)
    }
  } catch (error) {
    console.error("Error downloading assets:", error)
    throw error
  }
}

// Download assets as a ZIP file
async function downloadAsZip(
  assets: FigmaAsset[], 
  format: FileFormat, 
  settings: DownloadSettings,
  onProgress?: (progress: number) => void,
): Promise<void> {
  // Create a new worker instance
  const worker = createDownloadWorker()
  if (!worker) throw new Error('Failed to create worker')

  return new Promise((resolve, reject) => {
    if (!worker) {
      reject(new Error('Failed to create worker'))
      return
    }

    worker.onmessage = (e) => {
      if (e.data.type === 'progress') {
        onProgress?.(e.data.progress)
      } else if (e.data.type === 'complete') {
        FileSaver.saveAs(e.data.blob, `figma-assets-${new Date().toISOString().slice(0, 10)}.zip`)
        worker.terminate()
        resolve()
      }
    }

    worker.onerror = (error) => {
      console.error('Worker error:', error)
      worker.terminate()
      reject(error)
    }

    // Start the worker with our assets
    worker.postMessage({
      assets: assets.map(asset => ({
        id: asset.id,
        url: asset.url,
        name: asset.name,
        type: asset.type,
        format: asset.format,
        fontFamily: asset.fontFamily,
        fontStyle: asset.fontStyle,
        fontWeight: asset.fontWeight,
        fontSize: asset.fontSize
      })),
      prefix: settings.prefix || "",
      format: format,
      batchSize: 10 // Process 10 assets in parallel
    })
  })
}

// Download assets individually
async function downloadIndividually(
  assets: FigmaAsset[], 
  settings: DownloadSettings,
  onProgress?: (progress: number) => void,
): Promise<void> {
  const prefix = settings.prefix || ""
  const processedFonts = new Set<string>()
  let completedAssets = 0
  const totalAssets = assets.length

  for (const asset of assets) {
    try {
      // Handle font information for text assets
      if (asset.type === "TEXT" && asset.fontFamily && settings.textExportOption !== "IMAGE") {
        const fontId = `${asset.fontFamily}-${asset.fontStyle}-${asset.fontWeight}`
        if (!processedFonts.has(fontId)) {
          processedFonts.add(fontId)
          
          // Create font information file
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
   - MyFonts: https://www.myfonts.com/

2. Once you have the font file, you can use this CSS:

@font-face {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  src: url('path-to-your-font-file.ttf') format('truetype');
}

.${asset.fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')} {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  font-size: ${asset.fontSize || "inherit"}px;
}
*/
`
          const infoBlob = new Blob([fontInfo], { type: "text/plain" })
          FileSaver.saveAs(infoBlob, `${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}-info.txt`)
        }
      }

      // For assets with URLs, fetch and download
      if (asset.url && (settings.textExportOption !== "FONT" || asset.type !== "TEXT")) {
        const response = await fetch(asset.url)
        const blob = await response.blob()
        const fileName = `${prefix}${asset.name}.${asset.format.toLowerCase()}`
        FileSaver.saveAs(blob, fileName)
      }

      completedAssets++
      onProgress?.(Math.round((completedAssets / totalAssets) * 100))
    } catch (error) {
      console.error(`Error downloading ${asset.name}:`, error)
    }
  }
}

