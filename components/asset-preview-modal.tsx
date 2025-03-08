"use client"

import { useState } from "react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, X, Maximize2, FileText, Type } from "lucide-react"
import type { FigmaAsset } from "@/types/figma"
import FileSaver from "file-saver"

interface AssetPreviewModalProps {
  asset: FigmaAsset
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssetPreviewModal({ asset, open, onOpenChange }: AssetPreviewModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDownload = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(asset.url)
      const blob = await response.blob()
      FileSaver.saveAs(blob, `${asset.name}.${asset.format.toLowerCase()}`)
    } catch (error) {
      console.error("Error downloading asset:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getAssetTypeIcon = () => {
    switch (asset.type) {
      case "IMAGES":
        return <FileText className="h-4 w-4" />
      case "VECTORS":
        return <Maximize2 className="h-4 w-4" />
      case "TEXT":
        return <Type className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getAssetTypeIcon()}
            {asset.name}
          </DialogTitle>
          <DialogDescription>
            {asset.type} • {asset.format} • {asset.pageName}
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-video bg-slate-100 rounded-md overflow-hidden">
          {asset.thumbnailUrl ? (
            <Image src={asset.thumbnailUrl || "/placeholder.svg"} alt={asset.name} fill className="object-contain" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No preview available</div>
          )}
        </div>

        {asset.fontFamily && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Font Family:</span> {asset.fontFamily}
            </div>
            {asset.fontStyle && (
              <div>
                <span className="font-medium">Font Style:</span> {asset.fontStyle}
              </div>
            )}
            {asset.fontSize && (
              <div>
                <span className="font-medium">Font Size:</span> {asset.fontSize}px
              </div>
            )}
            {asset.fontWeight && (
              <div>
                <span className="font-medium">Font Weight:</span> {asset.fontWeight}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handleDownload} disabled={isLoading}>
            <Download className="h-4 w-4 mr-2" />
            {isLoading ? "Downloading..." : "Download"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

