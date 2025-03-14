"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import ProjectUrlForm from "@/components/project-url-form"
import AssetExplorer from "@/components/asset-explorer"
import type { FigmaProject } from "@/types/figma"

export default function FigmaExtractor() {
  const [project, setProject] = useState<FigmaProject | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleProjectLoaded = (loadedProject: FigmaProject) => {
    setProject(loadedProject)
    setError(null)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setProject(null)
  }

  return (
    <div className="w-full max-w-4xl">
      {!project ? (
        <Card>
          <CardContent className="pt-6">
            <ProjectUrlForm
              onProjectLoaded={handleProjectLoaded}
              onError={handleError}
              setIsLoading={setIsLoading}
            />

            {error && <div className="bg-destructive/15 text-destructive p-3 rounded-md mt-4">{error}</div>}

            {isLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <AssetExplorer project={project} onReset={() => setProject(null)} />
      )}
    </div>
  )
}

