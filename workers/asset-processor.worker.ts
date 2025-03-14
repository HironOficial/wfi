/// <reference lib="webworker" />
import type { AssetType } from "@/types/figma"

declare const self: DedicatedWorkerGlobalScope;

interface WorkerMessage {
  nodes: Record<string, {
    document?: {
      id?: string;
      name?: string;
      type?: string;
      style?: {
        fontFamily?: string;
        italic?: boolean;
        fontSize?: number;
        fontWeight?: number;
      };
      geometryType?: string;
      vectorPaths?: any[];
      vectorNetwork?: Record<string, any>;
      children?: any[];
    };
  }>;
  requestedAssetTypes: string[];
  pageName: string;
  pageId: string;
}

self.addEventListener('message', (e: MessageEvent) => {
  console.log("[Worker] Starting node processing...");
  const { nodes, requestedAssetTypes, pageName, pageId } = e.data;
  
  const assetIds: string[] = [];
  const assetNames: Record<string, string> = {};
  const assetTypesRecord: Record<string, AssetType> = {};
  const assetFonts: Record<string, any> = {};
  const uniqueFonts = new Set<string>();

  function mapNodeTypeToAssetType(nodeType: string): AssetType {
    if (nodeType === "IMAGE") return "IMAGES";
    if (["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(nodeType))
      return "VECTORS";
    if (nodeType === "TEXT") return "TEXT";
    if (["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(nodeType)) return "COMPONENTS";
    if (["FRAME", "GROUP", "SECTION"].includes(nodeType)) return "FRAMES";
    return "VECTORS";
  }

  function processNode(node: any) {
    if (!node) return;
    
    let isMatch = false;

    if (requestedAssetTypes.includes("VECTORS")) {
      const vectorTypes = ["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"];
      const hasVectorPaths = Array.isArray(node.vectorPaths) && node.vectorPaths.length > 0;
      
      isMatch = Boolean(
        (node.type && vectorTypes.includes(node.type)) ||
        node.geometryType === "VECTOR" ||
        hasVectorPaths ||
        (node.vectorNetwork && Object.keys(node.vectorNetwork).length > 0)
      );
    }

    if (requestedAssetTypes.includes("IMAGES") && node.type === "IMAGE") isMatch = true;

    if (requestedAssetTypes.includes("TEXT") && node.type === "TEXT") {
      isMatch = true;
      if (node.style?.fontFamily) {
        const fontFamily = node.style.fontFamily;
        const fontStyle = node.style.italic ? "Italic" : "Regular";
        const fontSize = node.style.fontSize;
        const fontWeight = node.style.fontWeight;

        assetFonts[node.id] = {
          fontFamily,
          fontStyle,
          fontSize,
          fontWeight,
        };
        uniqueFonts.add(`${fontFamily}-${fontStyle}-${fontWeight}`);
      }
    }

    if (requestedAssetTypes.includes("COMPONENTS") && node.type && 
        ["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(node.type))
      isMatch = true;

    if (requestedAssetTypes.includes("FRAMES") && node.type &&
        ["FRAME", "GROUP", "SECTION"].includes(node.type))
      isMatch = true;

    if (isMatch && node.id) {
      assetIds.push(node.id);
      assetNames[node.id] = node.name || `Asset ${node.id}`;
      assetTypesRecord[node.id] = node.type ? mapNodeTypeToAssetType(node.type) : "VECTORS";
    }

    if (node.children) {
      node.children.forEach((child: any) => processNode(child));
    }
  }

  console.log("[Worker] Processing nodes for page:", pageName);
  // Process all nodes in this chunk
  Object.values(nodes).forEach((nodeData: any) => {
    if (nodeData?.document) {
      processNode(nodeData.document);
    }
  });

  console.log(`[Worker] Found ${assetIds.length} assets in page ${pageName}`);
  console.log("[Worker] Sending results back to main thread...");
  
  self.postMessage({
    assetIds,
    assetNames,
    assetTypesRecord,
    assetFonts,
    uniqueFonts: Array.from(uniqueFonts),
    pageId,
    pageName
  });
});

// Export empty object to make it a module
export {}; 