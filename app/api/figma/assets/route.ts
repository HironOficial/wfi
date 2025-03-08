import { type NextRequest, NextResponse } from "next/server"
import type { AssetType, FileFormat, FigmaAsset, FigmaNode, FigmaNodesResponse } from "@/types/figma"

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("X-Figma-Token")

  if (!apiKey) {
    return NextResponse.json({ message: "Figma API key is required" }, { status: 400 })
  }

  try {
    const { fileId, pageIds, assetTypes: requestedAssetTypes, format } = await request.json()

    if (!fileId || !pageIds || !requestedAssetTypes || !format) {
      return NextResponse.json({ message: "Missing required parameters" }, { status: 400 })
    }

    // Get nodes from the file
    const nodesResponse = await fetch(`https://api.figma.com/v1/files/${fileId}/nodes?ids=${pageIds.join(",")}`, {
      headers: {
        "X-Figma-Token": apiKey,
      },
    })

    if (!nodesResponse.ok) {
      const error = await nodesResponse.json()
      return NextResponse.json(
        { message: error.message || "Failed to fetch Figma nodes" },
        { status: nodesResponse.status },
      )
    }

    const nodesData = (await nodesResponse.json()) as FigmaNodesResponse

    // Extract asset IDs based on asset types
    const assetIds: string[] = []
    const assetNames: Record<string, string> = {}
    const assetTypesRecord: Record<string, AssetType> = {} // Renamed to avoid conflict
    const assetPages: Record<string, { id: string; name: string }> = {}

    for (const pageId of pageIds) {
      const page = nodesData.nodes[pageId]
      if (!page || !page.document) continue

      const pageName = page.document.name

      // Function to recursively extract assets
      function extractAssets(node: FigmaNode) {
        // Check if this node matches the requested asset types
        let isMatch = false

        if (requestedAssetTypes.includes("IMAGES") && node.type === "IMAGE") isMatch = true
        if (
          requestedAssetTypes.includes("VECTORS") &&
          (node.type === "VECTOR" || node.type === "LINE" || node.type === "POLYGON")
        )
          isMatch = true
        if (requestedAssetTypes.includes("TEXT") && node.type === "TEXT") isMatch = true
        if (requestedAssetTypes.includes("COMPONENTS") && node.type === "COMPONENT") isMatch = true
        if (requestedAssetTypes.includes("FRAMES") && node.type === "FRAME") isMatch = true

        if (isMatch && node.id) {
          assetIds.push(node.id)
          assetNames[node.id] = node.name || `Asset ${node.id}`
          assetTypesRecord[node.id] = node.type as AssetType
          assetPages[node.id] = { id: pageId, name: pageName }
        }

        // Recursively process children
        if (node.children) {
          for (const child of node.children) {
            extractAssets(child)
          }
        }
      }

      extractAssets(page.document)
    }

    if (assetIds.length === 0) {
      return NextResponse.json([])
    }

    // Get image URLs for the assets
    const imagesResponse = await fetch(
      `https://api.figma.com/v1/images/${fileId}?ids=${assetIds.join(",")}&format=${format.toLowerCase()}`,
      {
        headers: {
          "X-Figma-Token": apiKey,
        },
      },
    )

    if (!imagesResponse.ok) {
      const error = await imagesResponse.json()
      return NextResponse.json(
        { message: error.message || "Failed to fetch Figma images" },
        { status: imagesResponse.status },
      )
    }

    const imagesData = await imagesResponse.json()

    // Construct the final assets array
    const assets: FigmaAsset[] = []

    for (const assetId of assetIds) {
      if (imagesData.images[assetId]) {
        assets.push({
          id: assetId,
          name: assetNames[assetId],
          type: assetTypesRecord[assetId],
          url: imagesData.images[assetId],
          thumbnailUrl: imagesData.images[assetId],
          format: format as FileFormat,
          pageId: assetPages[assetId].id,
          pageName: assetPages[assetId].name,
        })
      }
    }

    return NextResponse.json(assets)
  } catch (error) {
    console.error("Error fetching Figma assets:", error)
    return NextResponse.json({ message: "Failed to fetch Figma assets" }, { status: 500 })
  }
}

