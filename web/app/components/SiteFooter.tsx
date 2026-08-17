import { GithubIcon } from "./icons";

export function SiteFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-5xl flex-col items-center gap-3 px-6 py-10 text-center sm:flex-row sm:justify-between sm:text-left">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
          B
        </span>
        buildscore — open source, CLI-first.
      </div>
      <a
        href="https://github.com/LAKSHYAJAIN16/buildscore"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <GithubIcon className="size-3.5" />
        github.com/LAKSHYAJAIN16/buildscore
      </a>
    </footer>
  );
}
