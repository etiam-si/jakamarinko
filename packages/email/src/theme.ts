// The brand from apps/web/src/styles/theme.css, as hex: emails can't read CSS variables.
export const theme = {
  ink: "#121a18",
  muted: "#4f5d59",
  line: "#d3dcd8",
  surface: "#ffffff",
  // Firn (snow): the page behind the card, and the box around booking details.
  background: "#f4f6f5",
  tint: "#eef2f0",
  // Spruce: the header band and the one button.
  accent: "#15493f",
  accentText: "#f4f6f5",
  signal: "#e8542a",
  // Training zones, cool to hot: the stripe under the header, like on the site.
  zones: ["#9cc3e6", "#2f6fb3", "#f2c14e", "#e8742a", "#b8232f"],
  // Archivo where the reader has it; clients that load no web fonts get the system sans.
  font: "Archivo, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

// From docs/content/jaka-marinko.md.
export const site = {
  url: "https://jakamarinko.com",
  name: "Jaka Marinko",
  tagline: "Endurance Performance",
  phone: "+386 64 146 508",
  email: "jaka.marinko06@gmail.com",
  instagram: "https://www.instagram.com/marinkojaka",
  // apps/web/public/brand/email-logo.png: the light logo for the spruce header, 2× for sharp screens.
  logo: { src: "https://jakamarinko.com/brand/email-logo.png", width: 152, height: 48 },
};
