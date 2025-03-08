"use client"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import type { FigmaPage } from "@/types/figma"

interface PageSelectorProps {
  pages: FigmaPage[]
  selectedPages: string[]
  onChange: (selectedPages: string[]) => void
}

export default function PageSelector({ pages, selectedPages, onChange }: PageSelectorProps) {
  const handlePageToggle = (pageId: string, checked: boolean) => {
    if (checked) {
      onChange([...selectedPages, pageId])
    } else {
      onChange(selectedPages.filter((id) => id !== pageId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onChange(pages.map((page) => page.id))
    } else {
      onChange([])
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 mb-2">
        <Checkbox
          id="select-all-pages"
          checked={selectedPages.length === pages.length && pages.length > 0}
          onCheckedChange={handleSelectAll}
        />
        <Label htmlFor="select-all-pages">Select All Pages</Label>
      </div>

      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="space-y-2">
          {pages.map((page) => (
            <div key={page.id} className="flex items-center space-x-2">
              <Checkbox
                id={`page-${page.id}`}
                checked={selectedPages.includes(page.id)}
                onCheckedChange={(checked) => handlePageToggle(page.id, !!checked)}
              />
              <Label htmlFor={`page-${page.id}`}>{page.name}</Label>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

