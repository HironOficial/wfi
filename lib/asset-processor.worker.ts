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
    const worker = new Worker(new URL('../workers/asset-processor.ts', import.meta.url))
    
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