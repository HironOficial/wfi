import type { DownloadWorkerMessage } from "../types/worker"

export function createDownloadWorker() {
  if (typeof window === 'undefined') return null
  
  return new Worker(new URL('../workers/download.worker.ts', import.meta.url))
}

export function createAssetProcessorWorker() {
  if (typeof window === 'undefined') return null
  
  return new Worker(new URL('../workers/process-nodes.worker.ts', import.meta.url))
} 