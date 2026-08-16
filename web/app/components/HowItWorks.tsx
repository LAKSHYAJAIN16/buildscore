"use client";

import { motion } from "motion/react";
import { History, Sparkles, User } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const EASE = [0.16, 1, 0.3, 1] as const;

const STEPS = [
  {
    icon: User,
    step: "01",
    title: "Give us a username",
    description: "No OAuth, no signup. Just a public GitHub handle.",
  },
  {
    icon: History,
    step: "02",
    title: "We read your full history",
    description:
      "Every repo, every release, every week of commit activity — not just the green squares.",
  },
  {
    icon: Sparkles,
    step: "03",
    title: "Get your Builder Vector",
    description:
      "Seven weighted dimensions, one score. How you actually build, not just how much you commit.",
  },
];

export function HowItWorks() {
  return (
    <div className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
      {STEPS.map(({ icon: Icon, step, title, description }, i) => (
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, delay: i * 0.12, ease: EASE }}
        >
          <Card className="h-full ring-foreground/10 transition-colors hover:ring-foreground/20">
            <CardContent className="flex flex-col gap-3 px-5 py-1">
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-foreground">
                  <Icon className="size-4.5" />
                </span>
                <span className="font-mono text-xs text-muted-foreground/60">{step}</span>
              </div>
              <h3 className="text-sm font-semibold">{title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
