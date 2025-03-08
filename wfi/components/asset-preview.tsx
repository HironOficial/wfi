"use client"

import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { FigmaAsset } from "@/types/figma"

interface AssetPreviewProps {
  asset: FigmaAsset
  isSelected: boolean
  onSelect: (checked: boolean) => void
}

export default function AssetPreview({ asset, isSelected, onSelect }: AssetPreviewProps) {
  return (
    <Card className={`overflow-hidden ${isSelected ? "ring-2 ring-primary" : ""}`}>
      <CardContent className="p-2">
        <div className="relative aspect-square bg-slate-100 rounded-md overflow-hidden">
          {asset.thumbnailUrl ? (
            <Image src={asset.thumbnailUrl || "/placeholder.svg"} alt={asset.name} fill className="object-contain" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">No preview</div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-2 pt-0">
        <div className="flex items-center space-x-2 w-full">
          <Checkbox id={`asset-${asset.id}`} checked={isSelected} onCheckedChange={(checked) => onSelect(!!checked)} />
          <Label htmlFor={`asset-${asset.id}`} className="text-xs truncate flex-1" title={asset.name}>
            {asset.name}
          </Label>
        </div>
      </CardFooter>
    </Card>
  )
}

