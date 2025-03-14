interface ProcessNodesMessage {
  nodes: Record<string, any>
  requestedAssetTypes: string[]
  pageName: string
  pageId: string
}

export function createAssetProcessorWorker() {
  if (typeof window === 'undefined') {
    throw new Error('Workers can only be created in browser environment')
  }

  try {
    // In development, use the direct worker file
    // In production, webpack will handle this correctly through asset modules
    const workerPath = process.env.NODE_ENV === 'development' 
      ? new URL('../workers/asset-processor.worker.ts', import.meta.url)
      : '/_next/static/workers/asset-processor.worker.js'

    const worker = new Worker(workerPath)

    // Clean up when the worker is terminated
    worker.addEventListener('terminate', () => {
      worker.terminate()
    })

    return worker
  } catch (error) {
    console.error('Failed to create worker:', error)
    throw new Error('Failed to create asset processor worker')
  }
} 