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
import { cn } from "@/lib/utils"

interface AssetPreviewProps {
  asset: FigmaAsset
  isSelected: boolean
  onSelect: (checked: boolean) => void
  previewBackground?: "white" | "black"
}

export default function AssetPreview({ 
  asset, 
  isSelected, 
  onSelect,
  previewBackground = "white"
}: AssetPreviewProps) {
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
    <div className="relative">
      <div className={cn(
        "relative aspect-square rounded-lg border overflow-hidden",
        "group hover:border-primary transition-colors",
        isSelected && "border-primary",
        previewBackground === "black" ? "bg-black" : "bg-white"
      )}>
        {asset.thumbnailUrl ? (
          <Image
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="object-contain p-2"
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            priority={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-muted-foreground">
            No preview available
          </div>
        )}
        <div className="absolute left-2 top-2">
          <Checkbox
            id={`select-${asset.id}`}
            checked={isSelected}
            onCheckedChange={onSelect}
          />
        </div>
      </div>
      <Label
        htmlFor={`select-${asset.id}`}
        className="mt-2 block truncate text-sm"
        title={asset.name}
      >
        {asset.name}
      </Label>
      {asset.type === "TEXT" && asset.fontFamily && (
        <div className="text-xs text-muted-foreground truncate" title={`${asset.fontFamily} ${asset.fontStyle || ""}`}>
          {asset.fontFamily} {asset.fontStyle || ""}
        </div>
      )}
    </div>
  )
}

