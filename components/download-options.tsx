"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import type { FileFormat, DownloadSettings, TextExportOption } from "@/types/figma"
import { Checkbox } from "@/components/ui/checkbox"

interface DownloadOptionsProps {
  fileFormat: FileFormat
  settings: DownloadSettings
  onChange: (settings: DownloadSettings) => void
  selectedCount: number
  totalCount: number
  hasTextAssets: boolean
  hasFontAssets: boolean
  hideOptions?: boolean
}

export default function DownloadOptions({
  fileFormat,
  settings,
  onChange,
  selectedCount,
  totalCount,
  hasTextAssets,
  hasFontAssets,
  hideOptions = false
}: DownloadOptionsProps) {
  if (hideOptions) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Selected Assets</Label>
            <div className="text-sm text-muted-foreground">
              {selectedCount} of {totalCount} assets selected
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Selected Assets</Label>
          <div className="text-sm text-muted-foreground">
            {selectedCount} of {totalCount} assets selected
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col space-y-2">
          <Label>Scale</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[settings.scale]}
              onValueChange={([scale]) =>
                onChange({ ...settings, scale })
              }
              min={0.1}
              max={4}
              step={0.1}
              className="flex-1"
            />
            <span className="w-12 text-sm">{settings.scale}x</span>
          </div>
        </div>

        {fileFormat === "JPEG" && (
          <div className="flex flex-col space-y-2">
            <Label>Quality</Label>
            <div className="flex items-center space-x-2">
              <Slider
                value={[settings.quality]}
                onValueChange={([quality]) =>
                  onChange({ ...settings, quality })
                }
                min={1}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="w-12 text-sm">{settings.quality}%</span>
            </div>
          </div>
        )}

        {fileFormat === "SVG" && (
          <div className="flex items-center space-x-2">
            <Checkbox
              id="preserveLayers"
              checked={settings.preserveLayers}
              onCheckedChange={(preserveLayers) =>
                onChange({ ...settings, preserveLayers: !!preserveLayers })
              }
            />
            <Label htmlFor="preserveLayers">Preserve layer structure</Label>
          </div>
        )}
      </div>
    </div>
  )
}

