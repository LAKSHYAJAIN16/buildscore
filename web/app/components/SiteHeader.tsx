import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubIcon } from "./icons";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-md bg-foreground text-xs font-bold text-background">
            B
          </span>
          <span className="font-condensed text-base font-semibold tracking-tight">
            Buildscore
          </span>
          <span className="ml-0.5 flex items-center gap-1" aria-hidden>
            <span className="size-1.5 rounded-full bg-sector-purple" />
            <span className="size-1.5 rounded-full bg-sector-green" />
            <span className="size-1.5 rounded-full bg-sector-amber" />
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full"
            nativeButton={false}
            render={
              <a
                href="https://github.com/LAKSHYAJAIN16/buildscore"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View Buildscore on GitHub"
              />
            }
          >
            <GithubIcon className="size-4" />
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
