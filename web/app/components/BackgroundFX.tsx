export default function BackgroundFX() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* Soft painterly wash — warm dawn light bleeding through, never a flat fill. */}
      <div
        className="absolute inset-0 opacity-90 dark:opacity-70"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 20% 0%, oklch(0.82 0.09 45 / 0.55), transparent 60%),
            radial-gradient(ellipse 60% 45% at 85% 10%, oklch(0.78 0.07 210 / 0.4), transparent 60%),
            radial-gradient(ellipse 65% 55% at 50% 100%, oklch(0.75 0.08 60 / 0.35), transparent 65%)
          `,
        }}
      />
      <div
        className="absolute inset-0 opacity-60 dark:opacity-40"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% -10%, oklch(0.88 0.06 85 / 0.5), transparent 70%)`,
        }}
      />
    </div>
  );
}
