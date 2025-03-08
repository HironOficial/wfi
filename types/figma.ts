export type AssetType = "IMAGES" | "VECTORS" | "TEXT" | "COMPONENTS" | "FRAMES" | "FONTS"
export type FileFormat = "PNG" | "SVG" | "JPEG" | "PDF" | "WEBP"
export type TextExportOption = "IMAGE" | "FONT" | "BOTH"

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
  fontFamily?: string
  fontStyle?: string
  fontSize?: number
  fontWeight?: number
  metadata?: Record<string, any>
}

export interface DownloadSettings {
  scale: number
  quality: number
  preserveLayers: boolean
  includeInZip: boolean
  prefix?: string
  textExportOption: TextExportOption
  namePrefix?: string
}

// New types to fix the 'any' errors
export interface FigmaNode {
  id: string
  name: string
  type: string
  children?: FigmaNode[]
  geometryType?: string
  vectorPaths?: Array<{
    windingRule: string
    data: string
  }>
  vectorNetwork?: {
    vertices: Array<{ x: number; y: number; [key: string]: unknown }>
    segments: Array<{ start: number; end: number; [key: string]: unknown }>
    [key: string]: unknown
  }
  style?: {
    fontFamily?: string
    fontPostScriptName?: string
    fontWeight?: number
    fontSize?: number
    italic?: boolean
    [key: string]: unknown
  }
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

export interface FigmaFont {
  family: string
  style: string
  url?: string
}

