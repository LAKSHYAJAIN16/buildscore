"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { GithubIcon } from "./icons";

const NAV_LINKS = [
  { href: "/", label: "home" },
  { href: "/thesis", label: "thesis" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-background">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            B
          </span>
          <span className="font-condensed text-lg font-semibold tracking-tight">buildscore</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.03] sm:inline-flex"
          >
            get your score
          </Link>
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
