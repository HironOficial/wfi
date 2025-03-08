import type { Metadata } from "next"
import FigmaExtractor from "@/components/figma-extractor"

export const metadata: Metadata = {
  title: "Figma Asset Extractor | Open Nexus",
  description: "Extract and download assets from your Figma designs",
}

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-10">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">Figma Asset Extractor</h1>
        <p className="text-muted-foreground text-center max-w-2xl mb-8">
          Extract assets from your Figma designs. Connect with your API key or project URL, select formats, filter by
          type, and download assets in bulk.
        </p>
        <FigmaExtractor />
      </div>
    </main>
  )
}

