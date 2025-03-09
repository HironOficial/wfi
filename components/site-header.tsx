import Link from "next/link"
import { Github } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { KofiButton } from "@/components/kofi-button"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">Open Nexus</span>
          </Link>
          <span className="text-sm text-muted-foreground">Free Developer Tools</span>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/about">About</Link>
            </Button>
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <KofiButton variant="ghost" size="sm" />
          <ThemeToggle />
          <Button variant="ghost" size="icon" asChild>
            <Link href="https://github.com/hiron" target="_blank" rel="noopener noreferrer">
              <Github className="h-5 w-5" />
              <span className="sr-only">GitHub</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

