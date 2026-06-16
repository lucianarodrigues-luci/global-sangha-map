import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";

/**
 * Brand typography (specs.md Typography):
 *   - Nunito Sans (body / UI)
 *   - Source Serif Pro → Source Serif 4 (headings)
 * Both fall back to system fonts.
 */
const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito-sans",
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Global Sangha Map",
  description:
    "Discover meditation practice groups, community gatherings, and events happening around the world today.",
  openGraph: {
    title: "Global Sangha Map",
    description:
      "Discover meditation practice groups, community gatherings, and events happening around the world today.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B4087",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. LanguageTool,
    // Grammarly) inject attributes onto <html> before React hydrates, which
    // would otherwise trigger a benign hydration mismatch warning. This only
    // suppresses the warning for <html>'s own attributes, not its subtree.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${nunitoSans.variable} ${sourceSerif.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
