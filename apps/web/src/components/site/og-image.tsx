import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { BRAND_LINE } from "@/components/brand/logo";
import { landingPages } from "@/components/landing/pages";
import { photos, siteUrl } from "./site";

const ogSize = { width: 1200, height: 630 };

// Satori reads PNG and JPEG, not WebP.
type Photo = Exclude<keyof typeof photos, "europeans">;
type OgPage = { title: string; eyebrow?: string; photo: Photo };

// Every page's link preview: /og/<locale>/<key>.png, keyed by ogKey(path) in site.ts. Titles come from the page's own messages, so the preview follows the copy.
export const ogPages: Record<string, OgPage> = {
  home: { title: "home.hero.title", photo: "redBull" },
  about: { title: "about.meta.title", eyebrow: "common.nav.about", photo: "finish" },
  coaching: { title: "coaching.meta.title", eyebrow: "common.nav.coaching", photo: "xcSki" },
  lab: { title: "lab.meta.title", eyebrow: "common.nav.lab", photo: "redBull" },
  contact: { title: "contact.meta.title", eyebrow: "common.nav.contact", photo: "trail" },
  booking: { title: "booking.meta.title", eyebrow: "common.actions.bookTest", photo: "redBull" },
  privacy: { title: "legal.privacy.title", photo: "trail" },
  terms: { title: "legal.terms.title", photo: "trail" },
  cookies: { title: "legal.cookies.title", photo: "trail" },
  "sign-in": { title: "auth.signIn.title", photo: "skimo" },
  ...Object.fromEntries(
    landingPages.map((p) => [`lp-${p.slug}`, { title: `landing.pages.${p.slug}.meta.title`, photo: p.photo === "europeans" ? "finish" : p.photo }]),
  ),
};

// Build-time reads only: kept out of the server's file tracing.
const read = (file: string) => readFile(path.join(/* turbopackIgnore: true */ process.cwd(), file));
const dataUri = async (file: string, type: string) => `data:${type};base64,${(await read(file)).toString("base64")}`;
const zones = ["#9cc3e6", "#2f6fb3", "#f2c14e", "#e8742a", "#b8232f"];

// Spruce panel with the logo and the page title in Archivo, Jaka's photo on the right, and the zone colours along the
// bottom like on the site. Rendered at build time, so reading from the repo is fine.
export async function ogImage(locale: string, key: string) {
  const page = ogPages[key] ?? ogPages.home!;
  const t = await getTranslations({ locale });
  const photo = `public${photos[page.photo]}`;
  const [display, text, logo, picture] = await Promise.all([
    read("src/assets/og-fonts/archivo-expanded-800.ttf"),
    read("src/assets/og-fonts/archivo-500.ttf"),
    dataUri("public/brand/logo-dark.svg", "image/svg+xml"),
    dataUri(photo, photo.endsWith(".png") ? "image/png" : "image/jpeg"),
  ]);

  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", backgroundColor: "#0c3029", fontFamily: "Archivo" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: 780,
            padding: "60px 64px 76px",
            backgroundImage: "linear-gradient(135deg, #15493f 0%, #0c3029 100%)",
          }}
        >
          <img src={logo} height={92} width={292} alt="" />
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", fontSize: 22, fontWeight: 500, letterSpacing: 4, textTransform: "uppercase", color: "#f0784f" }}>
              {page.eyebrow ? t(page.eyebrow) : BRAND_LINE}
            </div>
            <div style={{ display: "flex", fontSize: 56, fontWeight: 800, lineHeight: 1.08, letterSpacing: -1, color: "#f4f6f5" }}>
              {t(page.title)}
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 22, fontWeight: 500, color: "#9fb8b1" }}>{new URL(siteUrl).host}</div>
        </div>
        <img src={picture} width={420} height={630} alt="" style={{ objectFit: "cover" }} />
        <div style={{ display: "flex", position: "absolute", left: 0, right: 0, bottom: 0, height: 12 }}>
          {zones.map((c) => (
            <div key={c} style={{ display: "flex", flex: 1, backgroundColor: c }} />
          ))}
        </div>
      </div>
    ),
    {
      ...ogSize,
      fonts: [
        { name: "Archivo", data: display, weight: 800, style: "normal" },
        { name: "Archivo", data: text, weight: 500, style: "normal" },
      ],
    },
  );
}
