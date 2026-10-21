# T01 Brand + design system

**Goal:** a brand for "Jaka Marinko — Endurance Performance" and the visual system every page uses. It should feel like serious endurance sport and lab science: precise, calm, fast, credible. **Nothing from the old Lovable site.** Load the `frontend-design` skill before starting.

**Depends on:** T00. **Blocks:** T08, T10 (they use the tokens and components).

**Owns:** `apps/web/src/styles/`, `apps/web/src/components/brand/`, `apps/web/public/brand/`, `apps/web/src/app/[locale]/(site)/styleguide/`, the theme in `apps/web/src/components/ui/` (shadcn overrides), `docs/brand.md`.

## Build
1. **Logo:** a wordmark ("JAKA MARINKO", sub-line "Endurance Performance") and a mark that works alone (favicon, app icon, watch-sized at 16 px). SVG, light and dark versions. Export favicon set, apple-touch-icon, PWA icons, and an Open Graph base image (1200×630).
2. **Colours** as CSS variables (Tailwind v4 theme). Light and dark, plus colours for data (5 training zones, chart series) checked for colour-blind safety and contrast (WCAG AA for text).
3. **Type:** a pairing via `next/font` (self-hosted, no layout shift), with a tabular-figure setting for times, paces and lab values.
4. **Components:** apply the brand to the shadcn primitives. Add brand components the site needs: `Logo`, `SectionHeading`, `StatBlock` (big number + unit + label, e.g. "80 ml/kg/min"), `ZoneBar`, `PriceCard`, `PhotoFrame` (how athlete photos are cropped and shown).
5. **Photo use:** rules for the existing small photos in `docs/content/photos/` (they are low resolution: use them small or with treatments, never as full-bleed heroes).
6. **Styleguide page** at `/[locale]/styleguide` (hidden from robots): every token and component in light and dark.
7. `docs/brand.md`: the rules in one page (logo use, colours, type, photos, tone of voice in EN and SL).

## Acceptance criteria
- [ ] The styleguide page renders every component in light and dark with no console errors.
- [ ] The mark is legible at 16×16 (favicon) and 512×512, checked by screenshot.
- [ ] All text/background pairs in the tokens meet WCAG AA, checked with a script or test that computes contrast.
- [ ] The zone colours are distinguishable under deuteranopia (simulated screenshot in the PR).
- [ ] Lighthouse on the styleguide: no layout shift from fonts (CLS < 0.05).
- [ ] The PR shows screenshots of the logo, palette and components.

## Out of scope
Page layouts and copy (T08).

## Needs from the user
Approval of the logo direction. Post 2–3 options as screenshots in the PR first, then finish the chosen one.
