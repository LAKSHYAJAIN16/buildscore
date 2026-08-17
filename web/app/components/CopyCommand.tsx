"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Copy } from "lucide-react";

export function CopyCommand({ command }: { command: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable — fail silently, command is still selectable.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full max-w-sm items-center justify-between gap-3 rounded-full border border-border bg-muted/50 px-5 py-2.5 text-left font-mono text-xs text-foreground transition-colors hover:bg-muted"
    >
      <span className="truncate">
        <span className="select-none text-muted-foreground">$ </span>
        {command}
      </span>
      <span className="relative flex size-3.5 shrink-0 items-center justify-center text-muted-foreground group-hover:text-foreground">
        <AnimatePresence mode="wait" initial={false}>
          {copied ? (
            <motion.span
              key="check"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center text-dim-consistency"
            >
              <Check className="size-3.5" />
            </motion.span>
          ) : (
            <motion.span
              key="copy"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Copy className="size-3.5" />
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  );
}
