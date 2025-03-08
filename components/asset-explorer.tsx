"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Download, Eye, FileDown, Layers, Filter } from "lucide-react"
import PageSelector from "@/components/page-selector"
import AssetTypeFilter from "@/components/asset-type-filter"
import AssetPreview from "@/components/asset-preview"
import DownloadOptions from "@/components/download-options"
import PrefixFilter from "@/components/prefix-filter"
import type { FigmaProject, FigmaAsset, AssetType, FileFormat, DownloadSettings } from "@/types/figma"
import { fetchAssets, downloadAssets } from "@/lib/figma-api"

interface AssetExplorerProps {
  project: FigmaProject
  onReset: () => void
}

export default function AssetExplorer({ project, onReset }: AssetExplorerProps) {
  const [selectedPages, setSelectedPages] = useState<string[]>([])
  const [selectedAssetTypes, setSelectedAssetTypes] = useState<AssetType[]>([
    "IMAGES",
    "VECTORS",
    "TEXT",
    "COMPONENTS",
    "FRAMES",
    "FONTS",
  ])
  const [fileFormat, setFileFormat] = useState<FileFormat>("PNG")
  const [assets, setAssets] = useState<FigmaAsset[]>([])
  const [filteredAssets, setFilteredAssets] = useState<FigmaAsset[]>([])
  const [selectedAssets, setSelectedAssets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("select")
  const [prefixFilter, setPrefixFilter] = useState("")
  const [prefixFilterEnabled, setPrefixFilterEnabled] = useState(false)
  const [downloadSettings, setDownloadSettings] = useState<DownloadSettings>({
    scale: 1,
    quality: 80,
    preserveLayers: true,
    includeInZip: true,
    textExportOption: "IMAGE",
  })

  useEffect(() => {
    if (project && project.pages.length > 0) {
      setSelectedPages([project.pages[0].id])
    }
  }, [project])

  useEffect(() => {
    if (prefixFilterEnabled && prefixFilter) {
      const filtered = assets.filter((asset) => asset.name.startsWith(prefixFilter))
      setFilteredAssets(filtered)
      // Update selected assets to only include filtered ones
      setSelectedAssets((prev) => prev.filter((id) => filtered.some((asset) => asset.id === id)))
    } else {
      setFilteredAssets(assets)
    }
  }, [assets, prefixFilter, prefixFilterEnabled])

  const handleLoadAssets = async () => {
    if (selectedPages.length === 0) {
      return
    }

    setIsLoading(true)
    try {
      console.log("Loading assets with:", {
        projectId: project.id,
        selectedPages,
        selectedAssetTypes,
        fileFormat,
      })

      const loadedAssets = await fetchAssets(project.id, project.apiKey, selectedPages, selectedAssetTypes, fileFormat)

      console.log("Loaded assets:", loadedAssets)

      if (loadedAssets.length === 0) {
        console.warn("No assets found. Make sure you have the correct asset types selected.")
      }

      setAssets(loadedAssets)

      // Apply prefix filter if enabled
      if (prefixFilterEnabled && prefixFilter) {
        const filtered = loadedAssets.filter((asset) => asset.name.startsWith(prefixFilter))
        setFilteredAssets(filtered)
        setSelectedAssets(filtered.map((asset) => asset.id))
      } else {
        setFilteredAssets(loadedAssets)
        setSelectedAssets(loadedAssets.map((asset) => asset.id))
      }

      setActiveTab("preview")
    } catch (error) {
      console.error("Failed to load assets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (selectedAssets.length === 0) return

    const assetsToDownload = assets.filter((asset) => selectedAssets.includes(asset.id))

    try {
      await downloadAssets(assetsToDownload, fileFormat, downloadSettings)
    } catch (error) {
      console.error("Failed to download assets:", error)
    }
  }

  const handleSelectAllAssets = (checked: boolean) => {
    if (checked) {
      setSelectedAssets(filteredAssets.map((asset) => asset.id))
    } else {
      setSelectedAssets([])
    }
  }

  const handleAssetSelection = (assetId: string, checked: boolean) => {
    if (checked) {
      setSelectedAssets([...selectedAssets, assetId])
    } else {
      setSelectedAssets(selectedAssets.filter((id) => id !== assetId))
    }
  }

  const hasTextAssets = assets.some((asset) => asset.type === "TEXT")
  const hasFontAssets = assets.some((asset) => asset.fontFamily)

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>
              {project.pages.length} pages • {project.lastModified}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onReset}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="select">
              <Layers className="mr-2 h-4 w-4" />
              Select
            </TabsTrigger>
            <TabsTrigger value="preview" disabled={assets.length === 0}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="download" disabled={selectedAssets.length === 0}>
              <FileDown className="mr-2 h-4 w-4" />
              Download
            </TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="mt-4 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="text-lg font-medium mb-2">Pages</h3>
                <PageSelector pages={project.pages} selectedPages={selectedPages} onChange={setSelectedPages} />
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Asset Types</h3>
                <AssetTypeFilter selectedTypes={selectedAssetTypes} onChange={setSelectedAssetTypes} />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">
                <Filter className="inline-block mr-2 h-4 w-4" />
                Filtering Options
              </h3>
              <PrefixFilter
                prefix={prefixFilter}
                enabled={prefixFilterEnabled}
                onPrefixChange={setPrefixFilter}
                onEnabledChange={setPrefixFilterEnabled}
              />
            </div>

            <Separator />

            <div>
              <h3 className="text-lg font-medium mb-2">File Format</h3>
              <RadioGroup
                value={fileFormat}
                onValueChange={(value) => setFileFormat(value as FileFormat)}
                className="flex flex-wrap gap-4"
              >
                {["PNG", "SVG", "JPEG", "PDF", "WEBP"].map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <RadioGroupItem value={format} id={`format-${format}`} />
                    <Label htmlFor={`format-${format}`}>{format}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <Button onClick={handleLoadAssets} disabled={selectedPages.length === 0 || isLoading} className="w-full">
              {isLoading ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Loading Assets...
                </>
              ) : (
                <>Load Assets</>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">
                Assets Preview ({selectedAssets.length}/{filteredAssets.length})
                {prefixFilterEnabled && prefixFilter && (
                  <span className="ml-2 text-sm text-muted-foreground">Filtered by prefix: "{prefixFilter}"</span>
                )}
              </h3>
              {filteredAssets.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedAssets.length === filteredAssets.length && filteredAssets.length > 0}
                    onCheckedChange={handleSelectAllAssets}
                  />
                  <Label htmlFor="select-all">Select All</Label>
                </div>
              )}
            </div>

            {filteredAssets.length > 0 ? (
              <ScrollArea className="h-[400px] rounded-md border p-4">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredAssets.map((asset) => (
                    <AssetPreview
                      key={asset.id}
                      asset={asset}
                      isSelected={selectedAssets.includes(asset.id)}
                      onSelect={(checked) => handleAssetSelection(asset.id, checked)}
                    />
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center p-8 border rounded-md bg-muted/20">
                <div className="text-muted-foreground mb-4 text-center">
                  {prefixFilterEnabled && prefixFilter ? (
                    <>
                      No assets found with prefix "{prefixFilter}". Try a different prefix or disable prefix filtering.
                    </>
                  ) : (
                    <>
                      No assets found. This could be due to:
                      <ul className="list-disc pl-6 mt-2 text-left">
                        <li>The selected asset types don't match what's in your Figma file</li>
                        <li>The selected pages don't contain exportable elements</li>
                        <li>Your API key doesn't have access to this file</li>
                      </ul>
                    </>
                  )}
                </div>
                <Button variant="outline" onClick={() => setActiveTab("select")}>
                  Go Back to Selection
                </Button>
              </div>
            )}

            {filteredAssets.length > 0 && (
              <div className="flex justify-end mt-4">
                <Button onClick={() => setActiveTab("download")} disabled={selectedAssets.length === 0}>
                  Continue to Download
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="download" className="mt-4">
            <DownloadOptions
              fileFormat={fileFormat}
              settings={downloadSettings}
              onChange={setDownloadSettings}
              selectedCount={selectedAssets.length}
              totalCount={filteredAssets.length}
              hasTextAssets={hasTextAssets}
              hasFontAssets={hasFontAssets}
            />

            <Button onClick={handleDownload} className="w-full mt-4" disabled={selectedAssets.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Download {selectedAssets.length} Assets
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

