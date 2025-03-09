/// <reference lib="webworker" />

import type { ProcessNodesMessage } from '../types/worker'

declare const self: DedicatedWorkerGlobalScope

interface FigmaNode {
  id: string
  name: string
  type: string
  geometryType?: string
  vectorPaths?: any[]
  vectorNetwork?: Record<string, any>
  style?: {
    fontFamily?: string
    italic?: boolean
    fontSize?: number
    fontWeight?: number
  }
  children?: FigmaNode[]
}

interface NodeData {
  document: FigmaNode
}

addEventListener('message', (e: MessageEvent<ProcessNodesMessage>) => {
  const { nodes, requestedAssetTypes, pageName, pageId } = e.data
  const assetIds: string[] = []
  const assetNames: Record<string, string> = {}
  const assetTypesRecord: Record<string, string> = {}
  const assetFonts: Record<string, {
    fontFamily: string
    fontStyle: string
    fontSize: number
    fontWeight: number
  }> = {}
  const uniqueFonts = new Set<string>()

  function mapNodeTypeToAssetType(nodeType: string): string {
    if (nodeType === "IMAGE") return "IMAGES"
    if (["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(nodeType))
      return "VECTORS"
    if (nodeType === "TEXT") return "TEXT"
    if (["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(nodeType)) return "COMPONENTS"
    if (["FRAME", "GROUP", "SECTION"].includes(nodeType)) return "FRAMES"
    return "VECTORS"
  }

  function processNode(node: FigmaNode) {
    let isMatch = false

    if (requestedAssetTypes.includes("VECTORS")) {
      isMatch = isMatch || ["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(node.type)
      isMatch = isMatch || 
        node.geometryType === "VECTOR" ||
        (node.vectorPaths !== undefined && node.vectorPaths.length > 0) ||
        (node.vectorNetwork !== undefined && Object.keys(node.vectorNetwork).length > 0)
    }

    if (requestedAssetTypes.includes("IMAGES") && node.type === "IMAGE") isMatch = true

    if (requestedAssetTypes.includes("TEXT") && node.type === "TEXT") {
      isMatch = true
      if (node.style) {
        const fontFamily = node.style.fontFamily
        const fontStyle = node.style.italic ? "Italic" : "Regular"
        const fontSize = node.style.fontSize
        const fontWeight = node.style.fontWeight

        if (fontFamily) {
          assetFonts[node.id] = {
            fontFamily,
            fontStyle,
            fontSize: fontSize || 0,
            fontWeight: fontWeight || 400,
          }
          uniqueFonts.add(`${fontFamily}-${fontStyle}-${fontWeight}`)
        }
      }
    }

    if (requestedAssetTypes.includes("COMPONENTS") && 
        (node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE"))
      isMatch = true

    if (requestedAssetTypes.includes("FRAMES") && 
        (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION"))
      isMatch = true

    if (isMatch && node.id) {
      assetIds.push(node.id)
      assetNames[node.id] = node.name || `Asset ${node.id}`
      assetTypesRecord[node.id] = mapNodeTypeToAssetType(node.type)
    }

    if (node.children) {
      node.children.forEach(processNode)
    }
  }

  // Process all nodes in this chunk
  Object.values(nodes).forEach((nodeData: NodeData) => {
    if (nodeData && nodeData.document) {
      processNode(nodeData.document)
    }
  })

  // Send back the results
  postMessage({
    assetIds,
    assetNames,
    assetTypesRecord,
    assetFonts,
    uniqueFonts: Array.from(uniqueFonts),
    pageId,
    pageName
  })
})

// Export an empty object to satisfy TypeScript
export default {} as typeof Worker 