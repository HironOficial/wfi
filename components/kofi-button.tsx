"use client"

import { Coffee } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface KofiButtonProps {
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  showText?: boolean
}

export function KofiButton({ variant = "default", size = "default", showText = true }: KofiButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            onClick={() => window.open("https://ko-fi.com/opennexus", "_blank")}
            className="gap-2"
          >
            <Coffee className={size === "icon" ? "h-4 w-4" : "h-4 w-4 mr-1"} />
            {showText && "Support Us"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Help keep our tools free by buying us a coffee!</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 