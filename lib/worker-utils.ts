import type { DownloadWorkerMessage } from "../types/worker"

export function createDownloadWorker(): Worker | null {
  if (typeof window === 'undefined') return null
  
  return new Worker(new URL('../workers/download.worker.ts', import.meta.url))
}

export function createAssetProcessorWorker(): Worker | null {
  if (typeof window === 'undefined') return null
  
  try {
    // Use our asset processor worker
    return new Worker(new URL('../workers/asset-processor.worker.ts', import.meta.url))
  } catch (error) {
    console.warn('Failed to create asset processor worker, falling back to main thread:', error)
    return null
  }
} 