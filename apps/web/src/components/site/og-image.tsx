import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { BRAND_LINE, BRAND_NAME } from "@/components/brand/logo";

export const ogSize = { width: 1200, height: 630 };
export const ogAlt = `${BRAND_NAME} — ${BRAND_LINE}`;

// A page's Open Graph image: T01's base (logo top left, zones along the bottom) with the page title in the free space.
// Rendered at build time for every locale, so reading from public/ is fine.
export async function ogImage(locale: string, namespace: string) {
  const t = await getTranslations({ locale, namespace });
  const base = await readFile(path.join(process.cwd(), "public/brand/og-base.png"));
  const src = `data:image/png;base64,${base.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ position: "relative", display: "flex", width: "100%", height: "100%" }}>
        <img src={src} width={ogSize.width} height={ogSize.height} alt="" style={{ position: "absolute", inset: 0 }} />
        <div
          style={{
            position: "absolute",
            left: 85,
            right: 85,
            top: 300,
            display: "flex",
            fontSize: 60,
            fontWeight: 700,
            lineHeight: 1.1,
            letterSpacing: -1,
            color: "#121A18",
          }}
        >
          {t("meta.title")}
        </div>
      </div>
    ),
    ogSize,
  );
}
