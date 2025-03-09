interface ProcessNodesMessage {
  nodes: Record<string, any>
  requestedAssetTypes: string[]
  pageName: string
  pageId: string
}

const workerCode = `
self.onmessage = (e) => {
  const { nodes, requestedAssetTypes, pageName, pageId } = e.data;
  const assetIds = [];
  const assetNames = {};
  const assetTypesRecord = {};
  const assetFonts = {};
  const uniqueFonts = new Set();

  function mapNodeTypeToAssetType(nodeType) {
    if (nodeType === "IMAGE") return "IMAGES";
    if (["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(nodeType))
      return "VECTORS";
    if (nodeType === "TEXT") return "TEXT";
    if (["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(nodeType)) return "COMPONENTS";
    if (["FRAME", "GROUP", "SECTION"].includes(nodeType)) return "FRAMES";
    return "VECTORS";
  }

  function processNode(node) {
    let isMatch = false;

    if (requestedAssetTypes.includes("VECTORS")) {
      isMatch = isMatch || ["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(node.type);
      isMatch = isMatch || 
        node.geometryType === "VECTOR" ||
        (node.vectorPaths !== undefined && node.vectorPaths.length > 0) ||
        (node.vectorNetwork !== undefined && Object.keys(node.vectorNetwork).length > 0);
    }

    if (requestedAssetTypes.includes("IMAGES") && node.type === "IMAGE") isMatch = true;

    if (requestedAssetTypes.includes("TEXT") && node.type === "TEXT") {
      isMatch = true;
      if (node.style) {
        const fontFamily = node.style.fontFamily;
        const fontStyle = node.style.italic ? "Italic" : "Regular";
        const fontSize = node.style.fontSize;
        const fontWeight = node.style.fontWeight;

        if (fontFamily) {
          assetFonts[node.id] = {
            fontFamily,
            fontStyle,
            fontSize,
            fontWeight,
          };
          uniqueFonts.add(\`\${fontFamily}-\${fontStyle}-\${fontWeight}\`);
        }
      }
    }

    if (requestedAssetTypes.includes("COMPONENTS") && 
        (node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE"))
      isMatch = true;

    if (requestedAssetTypes.includes("FRAMES") && 
        (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION"))
      isMatch = true;

    if (isMatch && node.id) {
      assetIds.push(node.id);
      assetNames[node.id] = node.name || \`Asset \${node.id}\`;
      assetTypesRecord[node.id] = mapNodeTypeToAssetType(node.type);
    }

    if (node.children) {
      node.children.forEach(processNode);
    }
  }

  // Process all nodes in this chunk
  Object.values(nodes).forEach(nodeData => {
    if (nodeData && nodeData.document) {
      processNode(nodeData.document);
    }
  });

  // Send back the results
  self.postMessage({
    assetIds,
    assetNames,
    assetTypesRecord,
    assetFonts,
    uniqueFonts: Array.from(uniqueFonts),
    pageId,
    pageName
  });
};
`

export function createAssetProcessorWorker() {
  const blob = new Blob([workerCode], { type: 'text/javascript' })
  const workerUrl = URL.createObjectURL(blob)
  const worker = new Worker(workerUrl)
  
  // Clean up the URL when the worker is terminated
  worker.addEventListener('terminate', () => {
    URL.revokeObjectURL(workerUrl)
  })
  
  return worker
} 