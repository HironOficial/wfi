/// <reference lib="webworker" />

import JSZip from 'jszip'
import type { DownloadWorkerMessage } from '../types/worker'

const worker = self as unknown as Worker

worker.onmessage = async (e: MessageEvent<DownloadWorkerMessage>) => {
  const { assets, prefix, format, batchSize = 10 } = e.data
  const zip = new JSZip()
  
  // Create folders
  const folders = {
    images: zip.folder("images"),
    vectors: zip.folder("vectors"),
    text: zip.folder("text"),
    fonts: zip.folder("fonts"),
    components: zip.folder("components"),
    frames: zip.folder("frames")
  }

  let completed = 0
  const total = assets.length
  const processedFonts = new Set<string>()

  // Process assets in batches
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize)
    
    await Promise.all(batch.map(async (asset) => {
      try {
        if (asset.type === "TEXT" && asset.fontFamily && asset.url) {
          const fontId = `${asset.fontFamily}-${asset.fontStyle}-${asset.fontWeight}`
          if (!processedFonts.has(fontId)) {
            processedFonts.add(fontId)
            
            // Download font file
            const response = await fetch(asset.url)
            const blob = await response.blob()
            const fontFileName = `${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}.ttf`
            folders.fonts?.file(fontFileName, blob)
            
            // Create font CSS
            const fontInfo = `
/* Font Information
Family: ${asset.fontFamily}
Style: ${asset.fontStyle || "Regular"}
Weight: ${asset.fontWeight || "Normal"}
*/

@font-face {
  font-family: '${asset.fontFamily}';
  font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
  font-weight: ${asset.fontWeight || 400};
  src: url('./${fontFileName}') format('truetype');
}
`
            folders.fonts?.file(`${prefix}${asset.fontFamily}-${asset.fontStyle || "Regular"}.css`, fontInfo)
          }
        }

        if (asset.url) {
          const response = await fetch(asset.url)
          const blob = await response.blob()
          const fileName = `${prefix}${asset.name}.${format.toLowerCase()}`
          
          // Add to appropriate folder
          switch (asset.type) {
            case "IMAGES":
              folders.images?.file(fileName, blob)
              break
            case "VECTORS":
              folders.vectors?.file(fileName, blob)
              break
            case "TEXT":
              folders.text?.file(fileName, blob)
              break
            case "COMPONENTS":
              folders.components?.file(fileName, blob)
              break
            case "FRAMES":
              folders.frames?.file(fileName, blob)
              break
            default:
              zip.file(fileName, blob)
          }
        }
      } catch (error) {
        console.error(`Error processing asset ${asset.name}:`, error)
      }
    }))

    completed += batch.length
    worker.postMessage({
      type: 'progress',
      progress: Math.round((completed / total) * 100)
    })
  }

  // Generate final ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" })
  worker.postMessage({
    type: 'complete',
    blob: zipBlob
  })
}

export default null as any 