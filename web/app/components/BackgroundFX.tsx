import { AnimatedGridPattern } from "@/components/ui/animated-grid-pattern";
import { cn } from "@/lib/utils";

export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <AnimatedGridPattern
        numSquares={22}
        maxOpacity={0.18}
        duration={3.5}
        className={cn(
          "text-foreground/70 [mask-image:radial-gradient(ellipse_65%_55%_at_50%_0%,black,transparent)]"
        )}
      />
      <div
        className="absolute left-1/2 top-[-12%] h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-foreground/[0.07] blur-3xl dark:bg-foreground/[0.06]"
        style={{ animation: "blob-float 18s ease-in-out infinite" }}
      />
      <div
        className="absolute right-[-8%] top-[26%] h-[28rem] w-[28rem] rounded-full bg-foreground/[0.05] blur-3xl dark:bg-foreground/[0.04]"
        style={{ animation: "blob-float 22s ease-in-out infinite reverse" }}
      />
    </div>
  );
}
