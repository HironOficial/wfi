/// <reference lib="webworker" />

import JSZip from 'jszip'
import type { DownloadWorkerMessage } from '../types/worker'

declare const self: DedicatedWorkerGlobalScope

interface Asset {
  id: string
  url: string
  name: string
  type: string
  format: string
  fontFamily?: string
  fontStyle?: string
  fontWeight?: number
  fontSize?: number
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
}

async function checkFontAvailability(fontFamily: string, fontWeight: number = 400): Promise<{ 
  url: string | null, 
  fontUrls: { woff2?: string; otf?: string } | null 
}> {
  try {
    // Convert font family name to npm package format (lowercase, hyphenated)
    const packageName = `@fontsource/${fontFamily.toLowerCase().replace(/\s+/g, '-')}`
    const fontFileName = `${fontWeight}${fontWeight === 400 ? '' : '-'}${fontWeight >= 700 ? 'bold' : ''}`
    
    // Try to fetch font files from jsDelivr (which serves npm packages)
    const baseUrl = `https://cdn.jsdelivr.net/npm/${packageName}`
    
    // First check if the package exists by trying to fetch the package.json
    const packageResponse = await fetch(`${baseUrl}/package.json`)
    if (!packageResponse.ok) {
      return { url: null, fontUrls: null }
    }

    // Construct font file URLs
    const woff2Url = `${baseUrl}/files/${fontFamily.toLowerCase().replace(/\s+/g, '-')}-${fontWeight}.woff2`
    const otfUrl = `${baseUrl}/files/${fontFamily.toLowerCase().replace(/\s+/g, '-')}-${fontWeight}.otf`

    // Try to get font files
    const fontUrls: { woff2?: string; otf?: string } = {}

    // Verify the files exist
    const [woff2Response, otfResponse] = await Promise.all([
      fetch(woff2Url, { method: 'HEAD' }),
      fetch(otfUrl, { method: 'HEAD' })
    ])

    // Only include URLs for files that exist
    if (woff2Response.ok) fontUrls.woff2 = woff2Url
    if (otfResponse.ok) fontUrls.otf = otfUrl

    if (Object.keys(fontUrls).length > 0) {
      return {
        url: `https://fontsource.org/fonts/${fontFamily.toLowerCase().replace(/\s+/g, '-')}`,
        fontUrls
      }
    }
    
    return { url: null, fontUrls: null }
  } catch (error) {
    console.error('Error checking font availability:', error)
    return { url: null, fontUrls: null }
  }
}

function getFontFormat(buffer: ArrayBuffer): string {
  // Check for OpenType font magic number
  const view = new DataView(buffer)
  
  // Check for TTF (0x00010000) or OpenType (0x4F54544F 'OTTO')
  const magicNumber = view.getUint32(0)
  if (magicNumber === 0x4F54544F) { // 'OTTO'
    return 'otf'
  } else if (magicNumber === 0x00010000) { // TTF
    return 'ttf'
  }
  
  // Default to TTF if we can't determine
  return 'ttf'
}

async function checkGoogleFontAvailability(fontFamily: string): Promise<string | null> {
  try {
    // Convert font family name to Google Fonts format
    const googleFontName = fontFamily.replace(/\s+/g, '+')
    const url = `https://fonts.google.com/specimen/${googleFontName}`
    
    // Check if the font exists on Google Fonts with a simple HEAD request
    const response = await fetch(url, { method: 'HEAD' })
    return response.ok ? url : null
  } catch (error) {
    console.error('Error checking Google Fonts:', error)
    return null
  }
}

addEventListener('message', async (e: MessageEvent<DownloadWorkerMessage>) => {
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
    
    await Promise.all(batch.map(async (asset: Asset) => {
      try {
        if (asset.type === "TEXT" && asset.fontFamily) {
          const fontId = `${asset.fontFamily}-${asset.fontStyle}-${asset.fontWeight}`
          if (!processedFonts.has(fontId)) {
            processedFonts.add(fontId)
            
            // Create font information file
            const fontInfo = `
/*
Font Information
---------------
Family: ${asset.fontFamily}
Style: ${asset.fontStyle || "Regular"}
Weight: ${asset.fontWeight || "Normal"}
Size: ${asset.fontSize || "Default"}px

Download Instructions:
1. Google Fonts (Recommended):
   - Visit: https://fonts.google.com/specimen/${asset.fontFamily.replace(/\s+/g, '+')}
   - Click the "Download family" button in the top right
   - Install the font files (.ttf) by double-clicking them

   Quick Web Setup:
   Add this to your HTML <head>:
   <link href="https://fonts.googleapis.com/css2?family=${asset.fontFamily.replace(/\s+/g, '+')}:wght@${asset.fontWeight || 400}&display=swap" rel="stylesheet">

2. Adobe Fonts: https://fonts.adobe.com/fonts
   - Professional font service (requires subscription)
   - High-quality fonts with extended character sets
   - Search for: "${asset.fontFamily}"

3. Font Squirrel: https://www.fontsquirrel.com/
   - Free font repository
   - Search for: "${asset.fontFamily}"

4. MyFonts: https://www.myfonts.com/
   - Large commercial font marketplace
   - Search for: "${asset.fontFamily}"

Once you have the font file:
1. Install it by double-clicking the font file
2. Use this CSS in your web projects:

   @font-face {
     font-family: '${asset.fontFamily}';
     font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
     font-weight: ${asset.fontWeight || 400};
     src: local('${asset.fontFamily}');
   }

   .${asset.fontFamily.toLowerCase().replace(/[^a-z0-9]/g, '-')} {
     font-family: '${asset.fontFamily}';
     font-style: ${asset.fontStyle?.toLowerCase() || "normal"};
     font-weight: ${asset.fontWeight || 400};
     font-size: ${asset.fontSize || "inherit"}px;
   }
*/`
            const sanitizedFontFamily = sanitizeFileName(asset.fontFamily)
            const sanitizedStyle = sanitizeFileName(asset.fontStyle || "Regular")
            
            // Save the font info file
            folders.fonts?.file(`${prefix}${sanitizedFontFamily}-${sanitizedStyle}-info.txt`, fontInfo)
          }
        }

        if (asset.url && asset.type !== "TEXT") {
          const response = await fetch(asset.url)
          if (!response.ok) throw new Error(`Failed to fetch asset: ${response.statusText}`)
          
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
    postMessage({
      type: 'progress',
      progress: Math.round((completed / total) * 100)
    })
  }

  // Generate final ZIP
  const zipBlob = await zip.generateAsync({ type: "blob" })
  postMessage({
    type: 'complete',
    blob: zipBlob
  })
})

// Export an empty object to satisfy TypeScript
export default {} as typeof Worker 