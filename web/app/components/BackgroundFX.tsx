import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <AnimatedGridPattern
        numSquares={22}
        maxOpacity={0.15}
        duration={3.5}
        className={cn(
          "text-foreground/60 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
        )}
      />
      <div
        className="absolute left-[8%] top-[-14%] h-[34rem] w-[34rem] rounded-full bg-sector-purple/[0.12] blur-3xl dark:bg-sector-purple/[0.14]"
        style={{ animation: "blob-float 19s ease-in-out infinite" }}
      />
      <div
        className="absolute right-[-6%] top-[22%] h-[26rem] w-[26rem] rounded-full bg-sector-green/[0.08] blur-3xl dark:bg-sector-green/[0.1]"
        style={{ animation: "blob-float 23s ease-in-out infinite reverse" }}
      />
      <div
        className="absolute left-[38%] top-[55%] h-[22rem] w-[22rem] rounded-full bg-sector-amber/[0.06] blur-3xl dark:bg-sector-amber/[0.08]"
        style={{ animation: "blob-float 27s ease-in-out infinite" }}
      />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sector-purple/40 to-transparent opacity-60"
        style={{ animation: "sweep-line 7s linear infinite" }}
      />
    </div>
  );
}
