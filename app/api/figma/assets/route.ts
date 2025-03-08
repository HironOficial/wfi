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

    // Get nodes from the file with more details
    const nodesResponse = await fetch(
      `https://api.figma.com/v1/files/${fileId}/nodes?ids=${pageIds.join(",")}&geometry=paths`,
      {
        headers: {
          "X-Figma-Token": apiKey,
        },
      },
    )

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
    const assetTypesRecord: Record<string, AssetType> = {}
    const assetPages: Record<string, { id: string; name: string }> = {}
    const assetFonts: Record<
      string,
      {
        fontFamily?: string
        fontStyle?: string
        fontSize?: number
        fontWeight?: number
      }
    > = {}

    // Track unique fonts
    const uniqueFonts = new Set<string>()

    for (const pageId of pageIds) {
      const page = nodesData.nodes[pageId]
      if (!page || !page.document) continue

      const pageName = page.document.name

      // Function to recursively extract assets
      function extractAssets(node: FigmaNode) {
        // Check if this node matches the requested asset types
        let isMatch = false

        if (requestedAssetTypes.includes("VECTORS")) {
          // Check for vector-type elements
          isMatch =
            isMatch ||
            ["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(node.type)

          // Also check if the node has vector properties
          isMatch =
            isMatch ||
            node.geometryType === "VECTOR" ||
            (node.vectorPaths && node.vectorPaths.length > 0) ||
            (node.vectorNetwork && Object.keys(node.vectorNetwork).length > 0)
        }

        if (requestedAssetTypes.includes("IMAGES") && node.type === "IMAGE") isMatch = true

        if (requestedAssetTypes.includes("TEXT") && node.type === "TEXT") {
          isMatch = true

          // Extract font information if available
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

              // Add to unique fonts set
              uniqueFonts.add(`${fontFamily}-${fontStyle}-${fontWeight}`)
            }
          }
        }

        if (requestedAssetTypes.includes("FONTS") && node.type === "TEXT" && node.style?.fontFamily) {
          // Add font as a separate asset
          const fontFamily = node.style.fontFamily
          const fontStyle = node.style.italic ? "Italic" : "Regular"
          const fontWeight = node.style.fontWeight

          // Create a unique ID for this font
          const fontId = `font-${fontFamily}-${fontStyle}-${fontWeight}`.replace(/\s+/g, "-").toLowerCase()

          // Only add if we haven't already added this font
          if (!assetIds.includes(fontId) && uniqueFonts.has(`${fontFamily}-${fontStyle}-${fontWeight}`)) {
            assetIds.push(fontId)
            assetNames[fontId] = `${fontFamily} ${fontStyle} ${fontWeight || ""}`
            assetTypesRecord[fontId] = "FONTS"
            assetPages[fontId] = { id: pageId, name: pageName }
            assetFonts[fontId] = {
              fontFamily,
              fontStyle,
              fontSize: node.style.fontSize,
              fontWeight,
            }
          }
        }

        if (
          requestedAssetTypes.includes("COMPONENTS") &&
          (node.type === "COMPONENT" || node.type === "COMPONENT_SET" || node.type === "INSTANCE")
        )
          isMatch = true
        if (
          requestedAssetTypes.includes("FRAMES") &&
          (node.type === "FRAME" || node.type === "GROUP" || node.type === "SECTION")
        )
          isMatch = true

        if (isMatch && node.id) {
          assetIds.push(node.id)
          assetNames[node.id] = node.name || `Asset ${node.id}`
          assetTypesRecord[node.id] = mapNodeTypeToAssetType(node.type)
          assetPages[node.id] = { id: pageId, name: pageName }
        }

        // Recursively process children
        if (node.children) {
          for (const child of node.children) {
            extractAssets(child)
          }
        }
      }

      // Helper function to map Figma node types to our AssetType enum
      function mapNodeTypeToAssetType(nodeType: string): AssetType {
        if (nodeType === "IMAGE") return "IMAGES"
        if (["VECTOR", "LINE", "REGULAR_POLYGON", "POLYGON", "STAR", "ELLIPSE", "RECTANGLE"].includes(nodeType))
          return "VECTORS"
        if (nodeType === "TEXT") return "TEXT"
        if (["COMPONENT", "COMPONENT_SET", "INSTANCE"].includes(nodeType)) return "COMPONENTS"
        if (["FRAME", "GROUP", "SECTION"].includes(nodeType)) return "FRAMES"
        return "VECTORS" // Default to VECTORS for unknown types
      }

      extractAssets(page.document)
    }

    if (assetIds.length === 0) {
      return NextResponse.json([])
    }

    // Filter out font assets which don't need image URLs
    const imageAssetIds = assetIds.filter((id) => !id.startsWith("font-"))

    // Get image URLs for the assets (excluding fonts)
    const imagesResponse = await fetch(
      `https://api.figma.com/v1/images/${fileId}?ids=${imageAssetIds.join(",")}&format=${format.toLowerCase()}&svg_include_id=true`,
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
      // For font assets, we don't need image URLs
      if (assetId.startsWith("font-")) {
        assets.push({
          id: assetId,
          name: assetNames[assetId],
          type: assetTypesRecord[assetId],
          url: "", // No URL for fonts
          format: format as FileFormat,
          pageId: assetPages[assetId].id,
          pageName: assetPages[assetId].name,
          fontFamily: assetFonts[assetId]?.fontFamily,
          fontStyle: assetFonts[assetId]?.fontStyle,
          fontWeight: assetFonts[assetId]?.fontWeight,
          fontSize: assetFonts[assetId]?.fontSize,
        })
      } else if (imagesData.images[assetId]) {
        assets.push({
          id: assetId,
          name: assetNames[assetId],
          type: assetTypesRecord[assetId],
          url: imagesData.images[assetId],
          thumbnailUrl: imagesData.images[assetId],
          format: format as FileFormat,
          pageId: assetPages[assetId].id,
          pageName: assetPages[assetId].name,
          fontFamily: assetFonts[assetId]?.fontFamily,
          fontStyle: assetFonts[assetId]?.fontStyle,
          fontWeight: assetFonts[assetId]?.fontWeight,
          fontSize: assetFonts[assetId]?.fontSize,
        })
      }
    }

    return NextResponse.json(assets)
  } catch (error) {
    console.error("Error fetching Figma assets:", error)
    return NextResponse.json({ message: "Failed to fetch Figma assets" }, { status: 500 })
  }
}

