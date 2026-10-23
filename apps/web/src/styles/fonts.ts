import localFont from "next/font/local";

// Archivo carries everything: expanded width for display, normal for text. Martian Mono is only for small data labels
// and units. Both are the Google Fonts variable fonts (OFL, licences in fonts/), cut down to what the site uses, which
// halves what a phone downloads before the first paint (US-011):
// - axes: Archivo wght 400–800 and wdth 100–125 (normal to expanded); Martian Mono wght 400–700 at normal width;
// - characters: ASCII, č š ž ć đ and their capitals, the common Western accents (ä ö ü é á à è í ó ú ñ ç ß), « » © ·
//   ° € – — ‘ ’ ‚ “ ” „ … • − → ₂. Anything else falls back to the metric-matched system font.
// Made with subset-font (harfbuzz): subsetFont(ttf, chars, { targetFormat: "woff2", variationAxes }).
const archivo = localFont({
  src: "./fonts/archivo.woff2",
  weight: "400 800",
  declarations: [{ prop: "font-stretch", value: "100% 125%" }],
  variable: "--font-archivo",
  display: "swap",
  // No preload: it held back the first paint on mobile (Lighthouse, T08); the metric-matched fallback keeps CLS at 0.
  preload: false,
  // next/font's own Arial match uses one size for every weight and comes out 3–6 % wider than Archivo in real text,
  // and there's none for systems without Arial (Linux, where the shift measured 0.05 on the legal pages at 768 px).
  // The fallbacks in globals.css are measured per weight instead.
  adjustFontFallback: false,
  fallback: ["Archivo Fallback", "Archivo Fallback Linux", "sans-serif"],
});

const martian = localFont({
  src: "./fonts/martian-mono.woff2",
  weight: "400 700",
  variable: "--font-martian",
  display: "swap",
  preload: false,
  adjustFontFallback: false,
  fallback: ["ui-monospace", "monospace"],
});

export const fontVariables = `${archivo.variable} ${martian.variable}`;
