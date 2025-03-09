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
    const response = await fetch(`/api/figma/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Figma-Token": apiKey,
      },
      body: JSON.stringify({
        fileId,
        pageIds,
        assetTypes,
        format,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to fetch assets")
    }

    return await response.json()
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
  const zip = new JSZip()
  const prefix = settings.prefix || ""

  // Create folders for different asset types
  const imagesFolder = zip.folder("images")
  const vectorsFolder = zip.folder("vectors")
  const textFolder = zip.folder("text")
  const fontsFolder = zip.folder("fonts")
  const componentsFolder = zip.folder("components")
  const framesFolder = zip.folder("frames")

  // Track unique fonts to avoid duplicates
  const processedFonts = new Set<string>()
  let completedAssets = 0
  const totalAssets = assets.length

  // Add each asset to the ZIP
  for (const asset of assets) {
    try {
      // Handle font files for text assets
      if (asset.type === "TEXT" && asset.fontFamily && settings.textExportOption !== "IMAGE") {
        const fontId = `${asset.fontFamily}-${asset.fontStyle}-${asset.fontWeight}`
        if (!processedFonts.has(fontId) && asset.url) {
          processedFonts.add(fontId)
          
          // Download the font file
          const response = await fetch(asset.url)
          const blob = await response.blob()
          const fontFileName = `${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}.ttf`
          fontsFolder?.file(fontFileName, blob)
          
          // Create font CSS file
          const fontInfo = `
/* Font Information
Family: ${asset.fontFamily}
Style: ${asset.fontStyle || "Regular"}
Weight: ${asset.fontWeight || "Normal"}
*/

@font-face {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  src: url('./${fontFileName}') format('truetype');
}
`
          fontsFolder?.file(`${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}.css`, fontInfo)
        }
      }

      // For assets with URLs, fetch and add to ZIP
      if (asset.url && (settings.textExportOption !== "FONT" || asset.type !== "TEXT")) {
        const response = await fetch(asset.url)
        const blob = await response.blob()
        const fileName = `${prefix}${asset.name}.${format.toLowerCase()}`

        // Add to appropriate folder based on asset type
        switch (asset.type) {
          case "IMAGES":
            imagesFolder?.file(fileName, blob)
            break
          case "VECTORS":
            vectorsFolder?.file(fileName, blob)
            break
          case "TEXT":
            textFolder?.file(fileName, blob)
            break
          case "COMPONENTS":
            componentsFolder?.file(fileName, blob)
            break
          case "FRAMES":
            framesFolder?.file(fileName, blob)
            break
          default:
            zip.file(fileName, blob)
        }
      }

      completedAssets++
      onProgress?.(Math.round((completedAssets / totalAssets) * 100))
    } catch (error) {
      console.error(`Error adding ${asset.name} to ZIP:`, error)
    }
  }

  // Generate and save the ZIP file
  const zipBlob = await zip.generateAsync({ type: "blob" })
  FileSaver.saveAs(zipBlob, `figma-assets-${new Date().toISOString().slice(0, 10)}.zip`)
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
      // Handle font files for text assets
      if (asset.type === "TEXT" && asset.fontFamily && settings.textExportOption !== "IMAGE") {
        const fontId = `${asset.fontFamily}-${asset.fontStyle}-${asset.fontWeight}`
        if (!processedFonts.has(fontId) && asset.url) {
          processedFonts.add(fontId)
          
          // Download the font file
          const response = await fetch(asset.url)
          const blob = await response.blob()
          const fontFileName = `${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}.ttf`
          FileSaver.saveAs(blob, fontFileName)
          
          // Create font CSS file
          const fontInfo = `
/* Font Information
Family: ${asset.fontFamily}
Style: ${asset.fontStyle || "Regular"}
Weight: ${asset.fontWeight || "Normal"}
*/

@font-face {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  src: url('./${fontFileName}') format('truetype');
}
`
          const cssBlob = new Blob([fontInfo], { type: "text/css" })
          FileSaver.saveAs(cssBlob, `${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}.css`)
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

