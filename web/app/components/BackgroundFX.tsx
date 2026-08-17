import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

const BLOBS = [
  { color: "bg-dim-velocity", opacity: "opacity-[0.16] dark:opacity-[0.22]", size: "h-[32rem] w-[32rem]", pos: "left-[2%] top-[-16%]", duration: "18s", reverse: false },
  { color: "bg-dim-quality", opacity: "opacity-[0.13] dark:opacity-[0.18]", size: "h-[28rem] w-[28rem]", pos: "right-[-8%] top-[8%]", duration: "24s", reverse: true },
  { color: "bg-dim-finishing", opacity: "opacity-[0.14] dark:opacity-[0.2]", size: "h-[24rem] w-[24rem]", pos: "left-[32%] top-[2%]", duration: "21s", reverse: false },
  { color: "bg-dim-ambition", opacity: "opacity-[0.1] dark:opacity-[0.16]", size: "h-[22rem] w-[22rem]", pos: "right-[18%] top-[42%]", duration: "26s", reverse: true },
  { color: "bg-dim-efficiency", opacity: "opacity-[0.1] dark:opacity-[0.15]", size: "h-[20rem] w-[20rem]", pos: "left-[10%] top-[50%]", duration: "29s", reverse: false },
] as const;

export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {BLOBS.map((b, i) => (
        <div
          key={i}
          className={cn("absolute rounded-full blur-3xl", b.color, b.opacity, b.size, b.pos)}
          style={{
            animation: `blob-float ${b.duration} ease-in-out infinite${b.reverse ? " reverse" : ""}`,
          }}
        />
      ))}
      <AnimatedGridPattern
        numSquares={22}
        maxOpacity={0.12}
        duration={3.5}
        className={cn(
          "text-foreground/50 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
        )}
      />
      <div
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-dim-velocity/50 to-transparent opacity-70"
        style={{ animation: "sweep-line 7s linear infinite" }}
      />
    </div>
  );
}
