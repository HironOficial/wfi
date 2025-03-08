"use client"

import { useState } from "react"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Eye, FileText, Type, Maximize2 } from "lucide-react"
import type { FigmaAsset } from "@/types/figma"
import AssetPreviewModal from "./asset-preview-modal"

interface AssetPreviewProps {
  asset: FigmaAsset
  isSelected: boolean
  onSelect: (checked: boolean) => void
}

export default function AssetPreview({ asset, isSelected, onSelect }: AssetPreviewProps) {
  const [modalOpen, setModalOpen] = useState(false)

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
    <>
      <Card className={`overflow-hidden ${isSelected ? "ring-2 ring-primary" : ""}`}>
        <CardContent className="p-2">
          <div className="relative aspect-square bg-slate-100 rounded-md overflow-hidden group">
            {asset.thumbnailUrl ? (
              <>
                <Image
                  src={asset.thumbnailUrl || "/placeholder.svg"}
                  alt={asset.name}
                  fill
                  className="object-contain"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => setModalOpen(true)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">No preview</div>
            )}
            <div className="absolute top-2 left-2 bg-background/80 rounded-md p-1">{getAssetTypeIcon()}</div>
          </div>
        </CardContent>
        <CardFooter className="p-2 pt-0">
          <div className="flex items-center space-x-2 w-full">
            <Checkbox
              id={`asset-${asset.id}`}
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(!!checked)}
            />
            <Label htmlFor={`asset-${asset.id}`} className="text-xs truncate flex-1" title={asset.name}>
              {asset.name}
            </Label>
          </div>
        </CardFooter>
      </Card>

      <AssetPreviewModal asset={asset} open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}

