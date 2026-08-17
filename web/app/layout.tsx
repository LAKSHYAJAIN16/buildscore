import type { Metadata } from "next";
import { Geist, Geist_Mono, Barlow_Condensed } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import BackgroundFX from "./components/BackgroundFX";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Buildscore",
  description: "How good are you at making things exist?",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${barlowCondensed.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          THESIS: The Builder Vector reads live, like a motorsport timing tower —
          not another monochrome SaaS card — refusing the neutral dashboard default.
          OWN-WORLD: Near-black control-room ground (paper-white in light mode);
          purple/green/amber sector lights are the only color, named per delta tier,
          never decorative. Barlow Condensed instrument caps + tabular mono splits.
          STORY: A visitor sees their build behavior clocked like race sectors and
          believes the score is measured, not vibes — then runs the CLI to get theirs.
          FIRST VIEWPORT: Headline + CTA above a live split board; seven sector rows
          clock in in sequence, colored by delta, the overall grade tile leading them.
          FORM: Live Timing Tower — Impeccable's Pick, direction round key 1417e296.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the
          finish review, the verdict, DESIGN.md, and every shipping raster carrying
          its provenance.
        */}
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <BackgroundFX />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
