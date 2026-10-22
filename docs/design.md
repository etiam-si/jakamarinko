# Jaka Marinko — Design System

How screens are built. The brand (logo, colours, fonts, photos, tone) is in [brand.md](brand.md); this file is the system on top of it: proportions, components and page patterns. Live examples: `/en/styleguide`.

Fonts: Archivo (headings use `font-heading font-stretch-expanded`), Martian Mono for eyebrows and units only. Colours: the tokens in `apps/web/src/styles/theme.css`, never raw hex. Radius `0.75rem` (`rounded-lg`), cards `rounded-xl`.

---

## Typography

| Element | Classes |
|---|---|
| Public hero title | `font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05] font-stretch-expanded text-balance` |
| Public section title (h2) | `font-heading text-2xl md:text-4xl font-bold tracking-tight font-stretch-expanded` (`SectionHeading`) |
| App page title | `font-heading text-2xl md:text-3xl font-bold tracking-tight font-stretch-expanded` (`PageHeader`) |
| Page subtitle | `text-sm md:text-base text-muted-foreground`, one line |
| Card title | `font-heading text-lg font-bold font-stretch-expanded` (public) / `text-base font-semibold` (app) |
| Eyebrow / block label | `font-mono text-xs tracking-wider uppercase text-muted-foreground` |
| Body secondary | `text-sm text-muted-foreground` |
| Helper/meta | `text-xs text-muted-foreground` |
| Numbers that get compared | add `tabular-nums` |

## Spacing

| Context | Classes |
|---|---|
| Public section | `Section`: `max-w-6xl px-4 md:px-8 py-14 md:py-20` |
| App page | `AppShell` main: `max-w-5xl`, `flex flex-col gap-8` between header, stats and content |
| Stat grid | `grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4` |
| Card internal | `p-5 md:p-6` |
| Form fields | `gap-5` between fields, `gap-2` inside a field (label, control, hint, error) |
| Side-by-side fields | `grid gap-5 sm:grid-cols-2` |
| Inline buttons | `gap-2` (app), `gap-3` (public CTAs) |

## Cards & Containers

| Element | Classes |
|---|---|
| Standard card | `rounded-xl border bg-card shadow-sm` (`Card`, `OverviewBlock`, `PriceCard`) |
| Featured card | add `border-primary ring-1 ring-primary shadow-md` |
| Table / list container | `rounded-xl border bg-card overflow-hidden`, rows `divide-y` |
| Closing CTA band | `CtaBand`: `rounded-2xl bg-primary text-primary-foreground` with a white button |
| Soft panel (notes, summaries) | `rounded-lg bg-muted px-4 py-3` |
| Warning note | `rounded-lg border border-warning/30 bg-warning/10 p-4` |

## Buttons

`components/ui/button.tsx`. Every screen has **one** `default` button: the thing we want the person to do.

| Variant | Usage |
|---|---|
| `default` | Primary CTA. Spruce gradient (`from-primary to-primary-deep`), soft shadow, lifts 1 px on hover |
| `outline` | Secondary actions next to a primary (Back, See packages) |
| `secondary` | Quiet actions in lists and cards (Call, Email) |
| `ghost` | Tertiary actions, toggles, menu triggers |
| `destructive` | Confirming a cancel or delete (inside the confirm step, never the first click) |
| `destructive-outline` | The first click towards a cancel or delete |
| `link` | Inline text actions (Change, Edit) |

| Size | Height | Usage |
|---|---|---|
| `lg` | 48 px | Hero and form submit on public pages, sticky Book bar |
| `default` | 40 px | Everything else |
| `sm` | 36 px | Actions inside cards and toolbars |
| `xs` | 32 px | Dense tables only |
| `icon`, `icon-sm` | 40 / 36 px | Icon-only, always with `aria-label` |

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
| Checkboxes | 20 px box, label next to it with `font-normal leading-snug`; the whole row is the tap target |
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

- **Hero:** short headline (≤ 7 words), one-line subline, primary CTA ("Book a test" → `/booking`, or `/booking?service=<id>` where the page is about one test), secondary `outline` CTA. Nothing else above the fold.
- **Every section ends in an action** (a button or a link with an arrow). The page ends in a `CtaBand`.
- **Scannable, not paragraphs:** bullets, numbers (`StatBlock`), cards. A card's text is one or two short sentences; anything longer goes in a list. No walls of text, no em dashes in body copy.
- **Facts stay:** prices, what a test includes, how to prepare, where. Shorten words, never facts.
- **Sticky Book bar** (`StickyBook`) on phones on the public pages (not on booking, legal or landing pages).
- Copy rules from `CLAUDE.md` and [brand.md](brand.md) apply: no mention of AI, no promise of personal work a package doesn't include, EN and SL for every string.
