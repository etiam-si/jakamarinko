# Jaka Marinko — Design System

How screens are built. The brand (logo, colours, fonts, photos, tone) is in [brand.md](brand.md); this file is the system on top of it: proportions, components and page patterns. Live examples: `/en/styleguide`.

Fonts: Archivo (headings use `font-heading font-stretch-expanded`), Martian Mono for eyebrows and units only. Colours: the tokens in `apps/web/src/styles/theme.css`, never raw hex. Radius `0.75rem` (`rounded-lg`), cards `rounded-xl`.

---

## Typography

| Element | Classes |
|---|---|
| Public hero title | `HeroTitle` (`components/brand/hero-title.tsx`, also what `SectionHeading as="h1"` renders): 36 → 40 → 48 → 60 px, extra-bold, expanded. A two-sentence hook breaks after the first sentence and sets the second in spruce |
| Public section title (h2) | `SectionHeading`: `text-3xl md:text-[2.75rem] font-bold leading-[1.08]`, expanded |
| App page title | `font-heading text-2xl md:text-3xl font-bold tracking-tight font-stretch-expanded` (`PageHeader`) |
| Page subtitle | `text-sm md:text-base text-muted-foreground`, one line |
| Card title | `font-heading text-lg font-bold font-stretch-expanded` (public) / `text-base font-semibold` (app) |
| Eyebrow / block label | `font-mono text-xs tracking-wider uppercase text-muted-foreground` |
| Body secondary | `text-sm text-muted-foreground` |
| Helper/meta | `text-xs text-muted-foreground` |
| Numbers that get compared | add `tabular-nums` |
| Prices | `euro(format, cents)` from `components/site/site.ts`: "90 €" in both languages, with a no-break space. Messages that write the € themselves get the plain number. Never `€90` next to `90 €` |

`h1`–`h3` get `text-wrap: balance` and paragraphs `text-wrap: pretty` globally (`globals.css`). Prices, percentages and units in the messages use a no-break space (`90\u00a0€`, `−50\u00a0%`).

## Spacing

| Context | Classes |
|---|---|
| Public section | `Section`: `max-w-6xl px-4 sm:px-6 md:px-8 py-16 md:py-24`; `tone="tinted"` (light band with rules) or `tone="dark"` (graphite band, one per page); fades in on scroll unless `reveal={false}` (heroes, forms) |
| App page | `AppShell` main: `max-w-5xl`, `flex flex-col gap-8` between header, stats and content |
| Stat grid | `grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4` |
| Card internal | `p-5 md:p-6` |
| Form fields | `gap-5` between fields, `gap-2` inside a field (label, control, hint, error) |
| Side-by-side fields | `grid gap-5 sm:grid-cols-2` |
| Inline buttons | `gap-2` (app), `gap-3` (public CTAs) |

## Cards & Containers

| Element | Classes |
|---|---|
| Standard card | `rounded-xl border bg-card shadow-sm` (`Card`, `OverviewBlock`); public cards `rounded-2xl` |
| Card that lifts | add `lift` (a `globals.css` utility): rises 3 px with `shadow-lg` on mouse hover only, presses to 99 % on touch. `Card interactive` does the same. For cards with an action (price, test, chooser rows, contact lines); never for plain text |
| Product card | `PriceCard` (packages, landing offer) and `TestCard` (`components/site/test-card.tsx`): badge, name, chips (duration, preparation), a 48 px price, the saving line for bundles, one ticked list, the Book button at the bottom |
| Featured card | `featured` on `PriceCard` / `TestCard`: the card gets the graphite surface (`dark` scope) with a spruce glow, so the button inside turns mint. One per list |
| Table / list container | `rounded-xl border bg-card overflow-hidden`, rows `divide-y` |
| Closing CTA band | `CtaBand`: `rounded-3xl` spruce gradient, light from the top right, the zone strip along the bottom edge, a light `secondary` button |
| Soft panel (notes, summaries) | `rounded-lg bg-muted px-4 py-3` |
| Warning note | `rounded-lg border border-warning/30 bg-warning/10 p-4` |

## Buttons

`components/ui/button.tsx`. Every screen has **one** `default` button: the thing we want the person to do.

| Variant | Usage |
|---|---|
| `default` | Primary CTA. Spruce gradient top to bottom with a 1 px inner highlight, lifts 1 px and brightens on hover |
| `outline` | Secondary actions next to a primary (Back, See packages) |
| `secondary` | Quiet actions in lists and cards (Call, Email) |
| `ghost` | Tertiary actions, toggles, menu triggers |
| `destructive` | Confirming a cancel or delete (inside the confirm step, never the first click) |
| `destructive-outline` | The first click towards a cancel or delete |
| `link` | Inline text actions (Change, Edit) |

| Size | Height | Usage |
|---|---|---|
| `lg` | 48 px | Hero and form submit on public pages, sticky Book bar |
| `default` | 40 px (44 below `md`) | Everything else |
| `sm` | 36 px (44 below `md`) | Actions inside cards and toolbars |
| `xs` | 32 px | Dense tables only |
| `icon`, `icon-sm` | 40 / 36 px (44 below `md`) | Icon-only, always with `aria-label` |

Every button presses to 98 % on `:active`; an `ArrowRight` inside nudges 2 px on hover. Focus is a 2 px `ring` outline 2 px off the button, never only a colour change.

- Labels are verbs that say what happens: "Book a test", "Send message", "Save changes". Never "Submit" / "Pošlji".
- Arrow icon (`ArrowRight`) only on the primary CTA that leaves the page.
- **Loading:** `<Button loading={pending}>`. It disables the button and puts a spinner before the label; keep the label (or switch to the "-ing" form: "Sending…").

## Forms

`components/ui/field.tsx`.

| Aspect | Pattern |
|---|---|
| Field | `<Field>` = label above, control, `<FieldHint>`, `<FieldError>` |
| Controls | `Input`, `Textarea`, `SelectTrigger className="w-full"`: 44 px tall, `text-base` (no zoom on iOS), focus = primary border + 3 px soft ring |
| Optional fields | label + `(optional)` in `text-muted-foreground font-normal`; required is the default |
| Errors | `<FieldError id="x-error">` under the field, control gets `aria-invalid` and `aria-describedby`. After a failed submit, focus the first invalid field. Never only a toast |
| Form-level failure | `<p role="alert">` with `FieldError` styling above the actions |
| Actions | `<FormActions>`: full width and stacked on phones (primary on top), right-aligned from `sm` up. Back/Cancel left of the primary |
| Checkboxes | 20 px box inside a 44 px tap target (negative margins keep the 20 px footprint), label next to it with `font-normal leading-snug`. The tick pops in |
| Choice tiles | `Choice` (booking): native radio, 44 px min height, selected = primary fill |
| Success | replace the form with a short `role="status"` panel: what happened, what happens next, one action |

## Badges

`StatusBadge` (`components/ui/status-badge.tsx`): `rounded-full border px-2.5 h-6 text-xs font-semibold`, text on its own 10 % tint.

| Tone | Use |
|---|---|
| `success` | Confirmed, done, answered |
| `warning` | Pending, rescheduled, needs a look |
| `error` | Cancelled, failed, no-show |
| `info` | New, in progress |
| `primary` | Recommended, featured |
| `neutral` | Past, draft, inactive |

`dot` for live states, `loading` while something runs. Health flags stay their own badge (`HealthFlag`, signal tint).

## Stat cards

`StatCard` (`components/ui/stat-card.tsx`): label, big tabular value, optional hint, optional icon in a 32 px circle. Two per row on phones, four from `md`. Only numbers someone acts on (today's bookings, open requests), never vanity counts.

## Empty States

`EmptyState` (`components/app-shell/empty-state.tsx`). An empty screen is an invitation to act: always pass the action as `children`.

| Variant | Usage |
|---|---|
| `card` (default) | `rounded-xl border border-dashed py-12 text-center`, icon in a 56 px muted circle, title `text-lg font-semibold`, one line of body |
| `inline` | `flex rounded-xl border border-dashed p-4`, inside a card or list |

## Loading States

| Context | Pattern |
|---|---|
| Button | `loading` prop (spinner + disabled) |
| Overview block / card | `OverviewBlock state="loading"`: pulse bars matching the content |
| List or page data | one muted line "Loading…" with `role="status"`; never a blank screen |
| Live job | `ProcessingStatus` (signal dot + bar) |

## Feedback

| Context | Pattern |
|---|---|
| After a form save | inline `role="status"` "Saved." next to the actions, no toast |
| After an action in a list | `useNotice()` (coach) / sonner toast: short past tense matching the button ("Booking moved.") |
| Validation | `FieldError` under the field |

## App page layout

```tsx
<PageHeader title="Bookings" lead="One line." action={<Button>…</Button>} />
<div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">{/* StatCard × n */}</div>
<div className="rounded-xl border bg-card">{/* toolbar, then list or table */}</div>
```

## Public page layout

- **Hook first** (`docs/content/conversion-playbook.md`): `h1` ≤ 10 words, subline ≤ 20 words, then **one** primary CTA with `data-cta="primary"` (the entry test: "Book a lactate test" → `/booking?service=lactate-profile`; on coaching the lead "Tell me your goal" → `/contact?package=coaching`), a secondary `outline` CTA, and one line of reassurance (price, VAT, free cancellation, where). All of it inside the first screen at 390 × 844.
- **Proof right after the hero** (`ProofBand`, `data-proof`): Jaka's numbers on the graphite band, counting up.
- **Every section ends in an action** with `data-cta="secondary"`. The page ends in a `CtaBand`.
- **Price before the FAQ**, and on lab and test landing pages an objection FAQ (fit, preparation, duration, what you get, cancellation; answers in `landing.faq`).
- **Scannable, not paragraphs:** bullets, numbers (`StatBlock`), cards. A card's text is one or two short sentences; anything longer goes in a list. No walls of text, no em dashes in body copy.
- **Facts stay:** prices, what a test includes, how to prepare, where. Shorten words, never facts.
- **Sticky bar** (`StickyBook`) on phones: the entry offer ("Lactate profile 90 € · Book"), or the landing page's offer. It slides in only once the hero's primary CTA has scrolled away, steps aside while a field has focus, and is not shown on booking, contact or legal pages.
- Copy rules from `CLAUDE.md` and [brand.md](brand.md) apply: no mention of AI, no promise of personal work a package doesn't include, EN and SL for every string.

## Depth

Light from above: shadows are graphite-tinted and layered (a hairline contact shadow plus a soft ambient one), defined
once in `theme.css` (`shadow-xs` … `shadow-xl`). Cards rest (`sm`), things that lift or float get `lg`/`xl` (a hovered
card, the hero photo, popovers, the closing band). Three surfaces give the page its rhythm: firn (`bg-background`),
tinted bands (`Section tone="tinted"`) and one graphite band per page (`Section tone="dark"`, the dark theme's tokens
scoped to the band, so every component works on it unchanged). The footer is graphite too, under a zone strip.

## Motion

Motion explains where something came from or that it responded. Never bouncy, never slow, nothing on a loop.

| Token (`theme.css`) | Value | Use |
|---|---|---|
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | things arriving (reveals, sheets, the hero) |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | state changes (hover, colour, opacity) |
| `--duration-fast` / `base` / `slow` | 150 / 250 / 400 ms | press and colour / hover lift / panels |
| `animate-rise` | 600 ms, fade + 14 px up | hero eyebrow, subline, CTAs (staggered 80 ms), the race bib |
| `animate-nudge` | 700 ms, 10 px up, **no fade** | the hero `h1`: it paints at once |
| `animate-settle` | 1.4 s, scale 1.06 → 1, **no fade** | the hero photo (`PhotoFrame hero`): never delays the LCP |
| `animate-fill-x` | 900 ms | the zone strip under the hero photo |
| `.draw-path` | 1.6 s | chart lines (lactate curve, Šmarna gora) draw themselves in |

- **Scroll reveal:** `Section` carries `data-reveal`; `components/ui/reveal.tsx` (one small IntersectionObserver per
  layout) marks only what is below the fold as pending and reveals it when it comes into view (fade + 24 px). Children
  with `data-reveal-item` and `style={{ "--i": n }}` follow in a 70 ms stagger. What is on screen at load is never
  hidden, and without JavaScript everything is simply there.
- **Count-ups:** `StatBlock` values that are plain integers count up once, over 1.1 s (`components/ui/count-up.tsx`).
  The server renders the final number; "5th" or "U20" stay as they are.
- **Hover has a touch twin:** `lift` hovers only with a fine pointer and presses on `:active`; tinted photos warm to
  natural colour on hover only; nothing is reachable by hover alone.
- **FAQ:** native `<details>`; the answer slides open where the browser can animate to auto height.
- **Reduced motion** (`prefers-reduced-motion: reduce`): every animation and transition ends at once (`globals.css`),
  reveals and count-ups don't run. e2e checks that nothing is running 500 ms after load.
- No animation library; it's CSS plus ~1 kB of observers. `animation-timeline` was not used: a triggered reveal reads
  better than one scrubbed to the scroll position.

## Photos and signatures

- `PhotoFrame` (`components/brand/photo-frame.tsx`): `hero` (eager, high priority, settles in), `depth` (spruce slab
  offset behind, `shadow-xl`), `strip` (zone colours along the bottom), `overlay` (the race bib), `flush` (top of a
  card), `treatment="tinted"` for groups. Pass `sizes` that match the layout.
- **Sharpness rule:** on a phone a photo is never shown wider than half its file's width (e2e checks it at 3×). The
  files we have are 460–1920 px wide; `docs/content/shot-list.md` lists what to shoot.
- **Race bib** (`RaceBib`): one measured number printed like a bib (four pin holes), laid over the hero photo. The
  logo's idea as data; once per page.
- **Zone strip** (`zone-strip` utility): the five zone colours as one strip, under the hero photo, the closing band,
  the footer and the landing points. Decoration with a meaning: it is the scale every test ends in.
- **Lactate curve** (`LactateCurve`): an illustration (no numbers, no one's result) of the curve over the zones.

## Placeholders and samples

`NEXT_PUBLIC_SHOW_PLACEHOLDERS=true` (dev, e2e, screenshot builds) shows:
- `PhotoSlot`: a designed frame in the slot's ratio with a camera icon and exactly which photo goes there;
- sample testimonials, always named "Sample athlete" with a "Sample" badge.

In production (flag unset) every slot falls back to the best photo we have or disappears, and testimonials show only
real quotes from `components/site/testimonials.ts` (name, sport, quote EN/SL, `consent: true`). Until there is one,
the section shows Jaka's own results. Invented quotes presented as real customers are never published.
## Error pages, link previews and emails (T18, US-011)
- **404 and error pages** (`components/errors/`): the race bib (`Bib`) carries the code (`404`, `DNF`), tilted −3°, next to an `h1`, one sentence and one primary action: Book a test on the 404, Try again on the error page, then outline buttons to Home, Lab tests and Contact. Public pages keep the header and footer around them (`(site)/not-found.tsx`, `(site)/error.tsx`).
- **Link previews** (`app/og/[locale]/[page].png`, `components/site/og-image.tsx`): 1200×630, spruce panel with the light logo, a signal-orange eyebrow, the page title in Archivo Expanded 800, Jaka's photo on the right and the zone stripe along the bottom. Titles come from the page's messages; a new page adds one line to `ogPages`.
- **Emails** (`packages/email/src/layout.tsx`): spruce header with `email-logo.png`, the zone stripe, a white card whose heading is the preview line, at most one spruce button (`Action`), booking details in a firn box with a spruce left rule, and the contact footer under the card. Tables and inline styles only; colours in `packages/email/src/theme.ts` mirror `theme.css`.
- **Fonts** (`styles/fonts.ts`): self-hosted subsets of Archivo (wght 400–800, wdth 100–125) and Martian Mono (400–700). A weight or width outside those ranges, or a character outside the list there, needs a new subset.
