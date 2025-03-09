/// <reference lib="webworker" />

import type { ProcessNodesMessage } from '../types/worker'

const worker = self as unknown as Worker

worker.onmessage = (e: MessageEvent<ProcessNodesMessage>) => {
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

  function processNode(node: any) {
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
            fontSize,
            fontWeight,
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
  Object.values(nodes).forEach(nodeData => {
    if (nodeData && nodeData.document) {
      processNode(nodeData.document)
    }
  })

  // Send back the results
  worker.postMessage({
    assetIds,
    assetNames,
    assetTypesRecord,
    assetFonts,
    uniqueFonts: Array.from(uniqueFonts),
    pageId,
    pageName
  })
}

export default null as any 