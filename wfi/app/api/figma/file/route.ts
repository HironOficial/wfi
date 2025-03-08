import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get("fileId")
  const apiKey = request.headers.get("X-Figma-Token")

  if (!fileId) {
    return NextResponse.json({ message: "File ID is required" }, { status: 400 })
  }

  if (!apiKey) {
    return NextResponse.json({ message: "Figma API key is required" }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        "X-Figma-Token": apiKey,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json({ message: error.message || "Failed to fetch Figma file" }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching Figma file:", error)
    return NextResponse.json({ message: "Failed to fetch Figma file" }, { status: 500 })
  }
}

