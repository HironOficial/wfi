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
    console.log("[createWorker] Attempting to create worker...");
    
    let worker: Worker;
    
    // In development, use the direct worker file
    if (process.env.NODE_ENV === 'development') {
      console.log("[createWorker] Development mode - using direct worker file");
      worker = new Worker(new URL('../workers/asset-processor.worker.ts', import.meta.url));
    } else {
      // In production, use the bundled worker file
      console.log("[createWorker] Production mode - using bundled worker file");
      worker = new Worker('/_next/static/workers/asset-processor.worker.js');
    }

    // Add error handler
    worker.addEventListener('error', (error) => {
      console.error("[createWorker] Worker error:", error);
    });

    // Add unhandled rejection handler
    worker.addEventListener('unhandledrejection', (event) => {
      console.error("[createWorker] Unhandled rejection in worker:", event);
    });

    // Clean up when the worker is terminated
    worker.addEventListener('terminate', () => {
      console.log("[createWorker] Worker terminated");
      worker.terminate();
    });

    console.log("[createWorker] Worker created successfully");
    return worker;
  } catch (error) {
    console.error('[createWorker] Failed to create worker:', error);
    throw new Error('Failed to create asset processor worker: ' + (error as Error).message);
  }
} 