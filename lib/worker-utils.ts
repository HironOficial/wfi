import type { DownloadWorkerMessage } from "../types/worker"

export async function createDownloadWorker() {
  if (typeof window === 'undefined') return null
  const DownloadWorker = (await import('../workers/download.worker')).default
  return new DownloadWorker()
}

export async function createAssetProcessorWorker() {
  if (typeof window === 'undefined') return null
  const ProcessNodesWorker = (await import('../workers/process-nodes.worker')).default
  return new ProcessNodesWorker()
} 