"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"

interface PrefixFilterProps {
  prefix: string
  enabled: boolean
  onPrefixChange: (prefix: string) => void
  onEnabledChange: (enabled: boolean) => void
}

export default function PrefixFilter({ prefix, enabled, onPrefixChange, onEnabledChange }: PrefixFilterProps) {
  const [inputValue, setInputValue] = useState(prefix)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onPrefixChange(inputValue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch id="prefix-enabled" checked={enabled} onCheckedChange={onEnabledChange} />
        <Label htmlFor="prefix-enabled">Filter by name prefix</Label>
      </div>

      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          placeholder="e.g., FN_, icon_, export_"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={!enabled}
          className="flex-1"
        />
        <Button type="submit" variant="secondary" disabled={!enabled}>
          Apply
        </Button>
      </form>

      {enabled && prefix && (
        <p className="text-sm text-muted-foreground">
          Only assets with names starting with "{prefix}" will be included.
        </p>
      )}
    </div>
  )
}

