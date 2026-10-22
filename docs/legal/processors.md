# Processors and cookies (T17)

The source list behind the privacy policy and the cookie policy (`apps/web/messages/{en,sl}/legal.json`). **Draft**: reviewed by the user or a lawyer before launch, and the pages show a "Draft, not yet in force" banner until the server sets `LEGAL_APPROVED=true`.

When you add a service that receives personal data, or a cookie, add it here **and** to both message files in the same PR.

## Processors
| Processor | Entity, location | What it gets | Why | Where in the code | Contract / transfer |
|---|---|---|---|---|---|
| Hosting | Hetzner Online GmbH, Germany | Everything (servers t4a, Postgres) | Runs the app | `infra/` | Hetzner DPA (art. 28) ❓ sign |
| Backups | Hetzner Storage Box, Germany | Encrypted dumps of every database, `/srv` | Disaster recovery, 7 daily / 4 weekly / 6 monthly | `infra/backup/` | Same Hetzner DPA |
| Proxy / CDN | Cloudflare, Inc., USA (global) | IP addresses, every request (TLS ends at Cloudflare) | Delivery, DDoS protection | `infra/README.md` | Cloudflare DPA (in its self-serve terms), DPF + SCCs |
| Payments | Stripe Payments Europe, Ltd., Ireland | Name, email, amount, card (on Stripe's page) | Checkout, invoices, refunds, subscriptions | T13 | Stripe DPA (in its terms) |
| Email | ❓ not chosen (`EMAIL_TRANSPORT=smtp`) | Name, email, booking details | Transactional emails | T06 `packages/email` | ❓ depends on the provider |
| AI service provider | Anthropic, PBC, USA (through claude-pool) | Lab results, training data, check-ins, goals (health data) | Plans, analyses, lab reports | T22 worker | ❓ see open items |
| Sign-in | Google Ireland Limited | Google returns name and email (only if the user picks Google) | Sign-in | T03 | Google is an independent controller for the sign-in |
| Coach calendar | Google Ireland Limited | Booking time, type, customer name | Calendar sync for coaches | T16 | Google Workspace / Cloud DPA ❓ depends on the coach's account type |
| Ads (consent only) | Meta Platforms Ireland Ltd. | Pixel events, `_fbp`/`_fbc`, hashed email for Conversions API | Ad measurement | T05 pixel, T14 CAPI | Meta terms; joint controller for the pixel (CJEU C-40/17) |
| Ads (consent only) | Google Ireland Limited | Google tag events, `_gcl_au` | Ad measurement | T05, T14 | Google Ads data processing terms |

Not a processor: **Umami**, self-hosted on t4a (`analytics.jakamarinko.com`), cookieless, no third party gets the data. Not listed because no personal data goes there: GitHub (code and images only).

## Cookies (first-party, on jakamarinko.com)
Categories follow T05 exactly: necessary (always on), analytics, marketing.

| Cookie | Category | Set by | Purpose | Lifetime |
|---|---|---|---|---|
| `NEXT_LOCALE` | necessary | next-intl (`apps/web/src/i18n/routing.ts`) | Language | 1 year |
| `jm_consent` (name proposed to T05) | necessary | T05 `lib/consent.ts` | Cookie choice + version | 12 months |
| `better-auth.session_token` (`__Secure-` on https) | necessary | T03 Better Auth | Session | 7 days (Better Auth default) |
| `jm_attribution` (name proposed to T05) | marketing | T05 `lib/utm.ts` | `utm_*`, `fbclid`, `gclid`, last touch | 30 days |
| `_fbp`, `_fbc` | marketing | Meta pixel (T05) | Ad measurement | 90 days |
| `_gcl_au` | marketing | Google tag (T05) | Ad measurement | 90 days |
| none | analytics | Umami is cookieless | | |

Third-party pages (not our cookies): Stripe Checkout, Google sign-in.

## Open items before `LEGAL_APPROVED=true`
1. **TODO(insurance).** There is no professional or business liability insurance yet. The terms describe the safety measures (PAR-Q+, written consent before maximal tests, stop criteria, 112 and first aid) and exclude no liability for harm to health, as consumer law requires. Get insurance that explicitly covers physiological testing, lactate sampling and maximal-effort tests before tests are sold.
2. **AI provider contract.** claude-pool runs on Claude subscription accounts. Before health data goes through it, confirm those terms allow processing customers' data commercially, don't use it for training, and come with a DPA and SCCs. If not, the engine needs the Anthropic API under its commercial terms (which include a DPA).
3. **Email provider**: name it in the privacy policy once chosen (product.md open question 1).
4. **Server logs**: `infra/compose.yml` sets no log options, so check the Docker daemon log rotation on t4a matches the 30 days in the policy.
5. **T05 cookie names**: the policy uses `jm_consent` and `jm_attribution`; T05 uses these names or the policy changes with it. The ad source cookie is listed under marketing, so T05 should set it only after marketing consent.
6. The policy describes the data of phases 1–4 (check-ins, training files) as the task asks; drop what isn't live at launch, or keep it if the policy should cover the roadmap.

Everything else that was undecided has a standard default in the texts; the list of those defaults is in the T17 PR description.
