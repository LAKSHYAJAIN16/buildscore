import type { Metadata } from "next";
import { Geist, Geist_Mono, Fredoka } from "next/font/google";
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

const fredoka = Fredoka({
  variable: "--font-condensed",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${geistSans.variable} ${geistMono.variable} ${fredoka.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          THESIS: Buildscore as a friend texting you your own stats back — warm,
          confident, a little chaotic — refusing every dashboard/instrument
          register the last two passes tried (timing tower, blueprint) as the
          category default. Direct reference: folk.com.
          OWN-WORLD: Warm cream daylight (cozy dusk-brown at night), a painterly
          soft-gradient hero, chunky rounded Fredoka display type, and scattered
          rotated "sticker" notes with real soft-shadow paper depth. Seven
          Builder Vector dimensions stay seven distinct warm crayon inks — no
          purple — now filling soft rounded pills instead of hairline ink.
          STORY: A visitor feels the product's personality in one glance, laughs
          at a sticker, and believes shipping stats can actually be fun — then
          runs the CLI to get their own.
          FIRST VIEWPORT: Big rounded headline over a soft painterly gradient,
          stat-stickers scattered and rotated around it, CTA as a bold pill.
          FORM: folk.com-referenced rebuild — user-pinned brief, no direction
          roll (a named reference overrides the roll per the brief-wins rule).
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, DESIGN.md, and every shipping
          raster carrying its provenance.
        */}
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <BackgroundFX />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
