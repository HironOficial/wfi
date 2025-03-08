export type AssetType = "IMAGES" | "VECTORS" | "TEXT" | "COMPONENTS" | "FRAMES"
export type FileFormat = "PNG" | "SVG" | "JPEG" | "PDF" | "WEBP"

export interface FigmaProject {
  id: string
  apiKey: string
  name: string
  lastModified: string
  pages: FigmaPage[]
}

export interface FigmaPage {
  id: string
  name: string
}

export interface FigmaAsset {
  id: string
  name: string
  type: AssetType
  url: string
  thumbnailUrl?: string
  format: FileFormat
  pageId: string
  pageName: string
}

export interface DownloadSettings {
  scale: number
  quality: number
  preserveLayers: boolean
  includeInZip: boolean
  prefix?: string
}

