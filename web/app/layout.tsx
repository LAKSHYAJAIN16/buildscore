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
          rebuilt in a genuine seven-hue rainbow (no purple) after the first pass's
          neutral-ground-plus-accents read as black and white.
          OWN-WORLD: Warm charcoal ground (warm paper in light mode), never neutral
          gray; each of the seven dimensions owns a real hue filling real surface
          area — chips, bars, gradient washes — not thin accent lines. Barlow
          Condensed instrument caps + tabular mono splits.
          STORY: A visitor sees their build behavior clocked like race sectors in
          full color and believes the score is measured, not vibes — then runs the
          CLI to get theirs.
          FIRST VIEWPORT: Gradient-washed headline + CTA above a live split board;
          seven rainbow sector rows clock in in sequence, the gold overall tile
          leading them.
          FORM: Live Timing Tower, rainbow-splits palette revision — user-directed
          rebuild of direction round key 1417e296 ("no purple", "not black and white").
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
