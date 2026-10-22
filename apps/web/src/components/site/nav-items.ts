// The header and footer nav. Its own file, so the client nav does not pull in site.ts.
export const navItems = [
  { href: "/about", key: "about" },
  { href: "/coaching", key: "coaching" },
  { href: "/lab", key: "lab" },
  { href: "/contact", key: "contact" },
] as const;
