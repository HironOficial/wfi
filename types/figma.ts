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

// New types to fix the 'any' errors
export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  [key: string]: unknown
}

export interface FigmaDocument {
  name: string
  children: FigmaNode[]
  [key: string]: unknown
}

export interface FigmaFileResponse {
  name: string
  lastModified: string
  document: FigmaDocument
  [key: string]: unknown
}

export interface FigmaNodesResponse {
  nodes: {
    [key: string]: {
      document?: FigmaNode
      [key: string]: unknown
    }
  }
}

export interface FigmaImagesResponse {
  images: {
    [key: string]: string
  }
  [key: string]: unknown
}

