import { Archivo, Martian_Mono } from "next/font/google";

// Archivo carries everything: expanded width for display, normal for text, condensed for tight labels.
// Martian Mono is only for small data labels and units. Both self-hosted by next/font, with metric-matched fallbacks.
const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const martian = Martian_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-martian",
  display: "swap",
});

export const fontVariables = `${archivo.variable} ${martian.variable}`;
