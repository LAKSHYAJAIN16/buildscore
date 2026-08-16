"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

import { Toggle } from "@/components/ui/toggle";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Deferring to an effect (rather than reading resolvedTheme on first render)
  // avoids a hydration mismatch between the server render and the client's
  // actual theme.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Toggle
      aria-label="Toggle dark mode"
      pressed={isDark}
      onPressedChange={(pressed) => setTheme(pressed ? "dark" : "light")}
      size="sm"
      className="size-8 min-w-0 rounded-full p-0"
    >
      {mounted && (isDark ? <Sun className="size-4" /> : <Moon className="size-4" />)}
    </Toggle>
  );
}
