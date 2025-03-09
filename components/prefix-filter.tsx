"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"

interface PrefixFilterProps {
  prefix: string
  enabled: boolean
  onPrefixChange: (prefix: string) => void
  onEnabledChange: (enabled: boolean) => void
  blacklistPrefix: string
  onBlacklistPrefixChange: (prefix: string) => void
  filterMode: "whitelist" | "blacklist"
  onFilterModeChange: (mode: "whitelist" | "blacklist") => void
}

export default function PrefixFilter({
  prefix,
  enabled,
  onPrefixChange,
  onEnabledChange,
  blacklistPrefix,
  onBlacklistPrefixChange,
  filterMode,
  onFilterModeChange,
}: PrefixFilterProps) {
  const [inputValue, setInputValue] = useState("")
  const [prefixes, setPrefixes] = useState<string[]>([])
  const [blacklistPrefixes, setBlacklistPrefixes] = useState<string[]>([])

  const handleAddPrefix = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputValue.trim()) return

    if (filterMode === "whitelist") {
      const newPrefixes = [...prefixes, inputValue.trim()]
      setPrefixes(newPrefixes)
      onPrefixChange(newPrefixes.join("|"))
    } else {
      const newBlacklistPrefixes = [...blacklistPrefixes, inputValue.trim()]
      setBlacklistPrefixes(newBlacklistPrefixes)
      onBlacklistPrefixChange(newBlacklistPrefixes.join("|"))
    }
    setInputValue("")
  }

  const handleRemovePrefix = (prefixToRemove: string) => {
    if (filterMode === "whitelist") {
      const newPrefixes = prefixes.filter(p => p !== prefixToRemove)
      setPrefixes(newPrefixes)
      onPrefixChange(newPrefixes.join("|"))
    } else {
      const newBlacklistPrefixes = blacklistPrefixes.filter(p => p !== prefixToRemove)
      setBlacklistPrefixes(newBlacklistPrefixes)
      onBlacklistPrefixChange(newBlacklistPrefixes.join("|"))
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Switch
          id="prefix-filter"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
        <Label htmlFor="prefix-filter">Enable prefix filtering</Label>
      </div>

      {enabled && (
        <div className="space-y-4">
          <Tabs value={filterMode} onValueChange={(v) => onFilterModeChange(v as "whitelist" | "blacklist")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="whitelist">Include Prefix</TabsTrigger>
              <TabsTrigger value="blacklist">Exclude Prefix</TabsTrigger>
            </TabsList>
          </Tabs>

          <form onSubmit={handleAddPrefix} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prefix">
                {filterMode === "whitelist" 
                  ? "Add prefix to include assets that start with:"
                  : "Add prefix to exclude assets that start with:"
                }
              </Label>
              <div className="flex gap-2">
                <Input
                  id="prefix"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Enter prefix..."
                />
                <Button type="submit" size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Active {filterMode === "whitelist" ? "include" : "exclude"} rules:</Label>
              <div className="flex flex-wrap gap-2">
                {(filterMode === "whitelist" ? prefixes : blacklistPrefixes).length > 0 ? (
                  (filterMode === "whitelist" ? prefixes : blacklistPrefixes).map((p) => (
                    <Badge key={p} variant="secondary" className="gap-1">
                      {p}
                      <button
                        type="button"
                        onClick={() => handleRemovePrefix(p)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">
                    No {filterMode === "whitelist" ? "include" : "exclude"} rules added yet
                  </span>
                )}
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

