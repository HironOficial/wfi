import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Open Nexus. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Privacy
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  )
}

