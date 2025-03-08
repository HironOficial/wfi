import type { Metadata } from "next"
import FigmaExtractor from "@/components/figma-extractor"

export const metadata: Metadata = {
  title: "Figma Asset Extractor",
  description: "Extract and download assets from your Figma designs",
}

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-6">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Figma Asset Extractor</h1>
        <p className="text-muted-foreground text-center max-w-2xl mb-8">
          Extract assets from.
        </p>
        <FigmaExtractor />
      </div>
    </main>
  )
}

