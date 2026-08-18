import Link from "next/link";

import { BuildscoreMark, GithubIcon } from "./icons";

const EXPLORE_LINKS = [
  { href: "/", label: "home" },
  { href: "/thesis", label: "thesis" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-5xl gap-10 px-6 py-14 sm:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <BuildscoreMark className="size-4" />
            </span>
            <span className="font-condensed text-lg font-semibold tracking-tight">
              buildscore
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Not commits. Not code output. A measure of your demonstrated ability to make software
            exist.
          </p>
        </div>

        <div>
          <p className="font-condensed text-sm font-semibold uppercase tracking-wide">Explore</p>
          <ul className="mt-3 space-y-2.5">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="font-condensed text-sm font-semibold uppercase tracking-wide">Project</p>
          <ul className="mt-3 space-y-2.5">
            <li>
              <a
                href="https://github.com/LAKSHYAJAIN16/buildscore"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <GithubIcon className="size-3.5" />
                source on github
              </a>
            </li>
            <li>
              <a
                href="https://github.com/LAKSHYAJAIN16/buildscore/blob/main/README.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                cli setup
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-6 py-5 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between sm:text-left">
          <span>buildscore — open source, CLI-first.</span>
          <span>free · no signup required</span>
        </div>
      </div>
    </footer>
  );
}
