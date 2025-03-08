"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { AssetType } from "@/types/figma"

interface AssetTypeFilterProps {
  selectedTypes: AssetType[]
  onChange: (selectedTypes: AssetType[]) => void
}

export default function AssetTypeFilter({ selectedTypes, onChange }: AssetTypeFilterProps) {
  const assetTypes: { value: AssetType; label: string }[] = [
    { value: "IMAGES", label: "Images" },
    { value: "VECTORS", label: "Vectors" },
    { value: "TEXT", label: "Text elements" },
    { value: "FONTS", label: "Fonts" },
    { value: "COMPONENTS", label: "Components" },
    { value: "FRAMES", label: "Frames" },
  ]

  const handleTypeToggle = (type: AssetType, checked: boolean) => {
    if (checked) {
      onChange([...selectedTypes, type])
    } else {
      onChange(selectedTypes.filter((t) => t !== type))
    }
  }

  return (
    <div className="space-y-2">
      {assetTypes.map((type) => (
        <div key={type.value} className="flex items-center space-x-2">
          <Checkbox
            id={`type-${type.value}`}
            checked={selectedTypes.includes(type.value)}
            onCheckedChange={(checked) => handleTypeToggle(type.value, !!checked)}
          />
          <Label htmlFor={`type-${type.value}`}>{type.label}</Label>
        </div>
      ))}
    </div>
  )
}

