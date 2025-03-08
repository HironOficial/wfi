import type { FigmaProject, FigmaPage, FigmaAsset, AssetType, FileFormat, DownloadSettings } from "@/types/figma"
import JSZip from "jszip"
import FileSaver from "file-saver"

// Extract file ID from Figma URL
export function extractFileIdFromUrl(url: string): string | null {
  const regex = /file\/([a-zA-Z0-9]+)/
  const match = url.match(regex)
  return match ? match[1] : null
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

    const data = await response.json()

    // Extract pages from the document
    const pages: FigmaPage[] = data.document.children.map((page: any) => ({
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
    if (settings.includeInZip) {
      await downloadAsZip(assets, format, settings)
    } else {
      await downloadIndividually(assets, settings)
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

  // Add each asset to the ZIP
  for (const asset of assets) {
    try {
      const response = await fetch(asset.url)
      const blob = await response.blob()
      const fileName = `${prefix}${asset.name}.${format.toLowerCase()}`
      zip.file(fileName, blob)
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
      const response = await fetch(asset.url)
      const blob = await response.blob()
      const fileName = `${prefix}${asset.name}.${asset.format.toLowerCase()}`
      FileSaver.saveAs(blob, fileName)
    } catch (error) {
      console.error(`Error downloading ${asset.name}:`, error)
    }
  }
}

