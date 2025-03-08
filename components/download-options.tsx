"use client"

import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import type { FileFormat, DownloadSettings } from "@/types/figma"

interface DownloadOptionsProps {
  fileFormat: FileFormat
  settings: DownloadSettings
  onChange: (settings: DownloadSettings) => void
  selectedCount: number
  totalCount: number
}

export default function DownloadOptions({
  fileFormat,
  settings,
  onChange,
  selectedCount,
  totalCount,
}: DownloadOptionsProps) {
  const updateSettings = (key: keyof DownloadSettings, value: string | number | boolean) => {
    onChange({
      ...settings,
      [key]: value,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Download Settings</h3>
        <p className="text-sm text-muted-foreground mb-4">
          You are about to download {selectedCount} of {totalCount} assets in {fileFormat} format.
        </p>
      </div>

      {(fileFormat === "PNG" || fileFormat === "JPEG" || fileFormat === "WEBP") && (
        <>
          <div className="space-y-2">
            <Label htmlFor="scale">Scale ({settings.scale}x)</Label>
            <Slider
              id="scale"
              min={0.5}
              max={4}
              step={0.5}
              value={[settings.scale]}
              onValueChange={(value) => updateSettings("scale", value[0])}
            />
          </div>

          {(fileFormat === "JPEG" || fileFormat === "WEBP") && (
            <div className="space-y-2">
              <Label htmlFor="quality">Quality ({settings.quality}%)</Label>
              <Slider
                id="quality"
                min={10}
                max={100}
                step={5}
                value={[settings.quality]}
                onValueChange={(value) => updateSettings("quality", value[0])}
              />
            </div>
          )}
        </>
      )}

      {fileFormat === "SVG" && (
        <div className="flex items-center space-x-2">
          <Switch
            id="preserveLayers"
            checked={settings.preserveLayers}
            onCheckedChange={(checked) => updateSettings("preserveLayers", checked)}
          />
          <Label htmlFor="preserveLayers">Preserve original Figma layers</Label>
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="includeInZip"
          checked={settings.includeInZip}
          onCheckedChange={(checked) => updateSettings("includeInZip", checked)}
        />
        <Label htmlFor="includeInZip">Download as ZIP file</Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prefix">File name prefix (optional)</Label>
        <Input
          id="prefix"
          placeholder="e.g., project-name-"
          value={settings.prefix || ""}
          onChange={(e) => updateSettings("prefix", e.target.value)}
        />
      </div>
    </div>
  )
}

