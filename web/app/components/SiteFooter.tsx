import { GithubIcon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex size-5 items-center justify-center rounded-md bg-foreground text-[10px] font-bold text-background">
            B
          </span>
          Buildscore — open source, CLI-first.
        </div>
        <a
          href="https://github.com/LAKSHYAJAIN16/buildscore"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <GithubIcon className="size-3.5" />
          github.com/LAKSHYAJAIN16/buildscore
        </a>
      </div>
    </footer>
  );
}
