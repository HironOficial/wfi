export interface DownloadWorkerMessage {
  assets: Array<{
    id: string
    url: string
    name: string
    type: string
    format: string
    fontFamily?: string
    fontStyle?: string
    fontWeight?: number
  }>
  prefix: string
  format: string
  batchSize?: number
}

export interface ProcessNodesMessage {
  nodes: Record<string, any>
  requestedAssetTypes: string[]
  pageName: string
  pageId: string
}

export interface WorkerResult {
  assetIds: string[]
  assetNames: Record<string, string>
  assetTypesRecord: Record<string, string>
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