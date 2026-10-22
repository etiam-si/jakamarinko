import { Archivo, Martian_Mono } from "next/font/google";

// Archivo carries everything: expanded width for display, normal for text, condensed for tight labels.
// Martian Mono is only for small data labels and units. Both self-hosted by next/font, with metric-matched fallbacks.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
  // No preload: it held back the first paint on mobile (Lighthouse, T08); the metric-matched fallback keeps CLS at 0.
  preload: false,
});

const martian = Martian_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-martian",
  display: "swap",
  preload: false,
});

export const fontVariables = `${archivo.variable} ${martian.variable}`;
