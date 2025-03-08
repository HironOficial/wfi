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
): Promise<void> {
  try {
    // Filter assets based on text export option
    let assetsToDownload = [...assets]

    if (settings.textExportOption === "FONT") {
      // Only include font assets
      assetsToDownload = assets.filter((asset) => asset.type === "FONTS" || (asset.type === "TEXT" && asset.fontFamily))
    } else if (settings.textExportOption === "IMAGE") {
      // Exclude font-only assets
      assetsToDownload = assets.filter((asset) => asset.type !== "FONTS")
    }

    // Apply name prefix filter if specified
    if (settings.namePrefix) {
      assetsToDownload = assetsToDownload.filter((asset) => asset.name.startsWith(settings.namePrefix || ""))
    }

    if (settings.includeInZip) {
      await downloadAsZip(assetsToDownload, format, settings)
    } else {
      await downloadIndividually(assetsToDownload, settings)
    }
  } catch (error) {
    console.error("Error downloading assets:", error)
    throw error
  }
}

// Download assets as a ZIP file
async function downloadAsZip(assets: FigmaAsset[], format: FileFormat, settings: DownloadSettings): Promise<void> {
  const zip = new JSZip()
  const prefix = settings.prefix || ""

  // Create folders for different asset types
  const imagesFolder = zip.folder("images")
  const vectorsFolder = zip.folder("vectors")
  const textFolder = zip.folder("text")
  const fontsFolder = zip.folder("fonts")
  const componentsFolder = zip.folder("components")
  const framesFolder = zip.folder("frames")

  // Add each asset to the ZIP
  for (const asset of assets) {
    try {
      // Skip font assets that don't have URLs
      if (asset.type === "FONTS" && !asset.url) {
        // Create a CSS file for the font information instead
        if (asset.fontFamily) {
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
  /* src: url('path-to-font-file') format('woff2'); */
}
`
          fontsFolder?.file(`${prefix}${asset.name}.css`, fontInfo)
        }
        continue
      }

      // For assets with URLs, fetch and add to ZIP
      if (asset.url) {
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
    } catch (error) {
      console.error(`Error adding ${asset.name} to ZIP:`, error)
    }
  }

  // Generate and save the ZIP file
  const zipBlob = await zip.generateAsync({ type: "blob" })
  FileSaver.saveAs(zipBlob, `figma-assets-${new Date().toISOString().slice(0, 10)}.zip`)
}

// Download assets individually
async function downloadIndividually(assets: FigmaAsset[], settings: DownloadSettings): Promise<void> {
  const prefix = settings.prefix || ""

  for (const asset of assets) {
    try {
      // Skip font assets that don't have URLs
      if (asset.type === "FONTS" && !asset.url) {
        // Create a CSS file for the font information instead
        if (asset.fontFamily) {
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
  /* src: url('path-to-font-file') format('woff2'); */
}
`
          const blob = new Blob([fontInfo], { type: "text/css" })
          FileSaver.saveAs(blob, `${prefix}${asset.name}.css`)
        }
        continue
      }

      // For assets with URLs, fetch and download
      if (asset.url) {
        const response = await fetch(asset.url)
        const blob = await response.blob()
        const fileName = `${prefix}${asset.name}.${asset.format.toLowerCase()}`
        FileSaver.saveAs(blob, fileName)
      }
    } catch (error) {
      console.error(`Error downloading ${asset.name}:`, error)
    }
  }
}

