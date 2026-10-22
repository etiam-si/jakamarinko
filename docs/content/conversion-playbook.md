# Conversion playbook

What every public page says, in what order, and why, so that a visitor books a lab test or asks about coaching. It is written for the implementers of T18 (US-010) and for the owner. Read time: 15 minutes. Paste-ready EN/SL strings are in [Appendix A](#appendix-a-paste-ready-strings).

**Rules this doc follows** (from `CLAUDE.md` and `docs/product.md`):
- Every hook is provable from `docs/content/`, `docs/product.md` or `packages/types/src/catalog.ts`.
- No AI, and no "handwritten" claim either.
- Personal work from Jaka is promised only where the package includes it.
- No fake urgency, nothing from the old site's design, no Jaka Torkar, no Strava API.

**Status:** draft 2026-10-22. ❓ marks something the owner (Grega) or Jaka must decide. Section 7 lists all of them.

---

## 0. The short version

1. **One entry offer everywhere: the lactate profile, 90 €.** Every hero, the sticky bar and every "book" button lead with it, and go straight to `/booking?service=lactate-profile`. Today the site leads with "from 50 €", which is anthropometry, the test nobody comes for.
2. **Bundles with real anchors (§5.1).**
   - Performance 250 € (360 € separately) is the hero.
   - Two new 180 € bundles (Runner, Long-distance) make it look like the obvious step up.
   - A 70 € lactate retest within 4 months brings customers back.
   - A 350 € season pack turns one visit into three.
3. **Answer the objections before the price is a problem.** Am I fit enough? Does the blood test hurt? How long is it? What do I get? Can I cancel? Today there is no FAQ on `/lab` at all.
4. **Proof that sells the test, not only Jaka.** Show a sample result (Jaka's own lactate curve and zones), then collect testimonials and Google reviews from the first customers.
5. **Coaching is sold after the test, not from cold ads.** The post-test offer plus a short email follow-up is the coaching funnel. Coaching pages ask for the visitor's goal (a lead), with the lab test as the second choice.

---

## 1. Market and competitors (research)

### Slovenia

| Provider | What they sell | Price (as published) | How you book | Proof shown |
|---|---|---|---|---|
| **Human Performance Centre** (human-performance.si) | Lab and field lactate, VO₂max, FuelSync (¹³C carb oxidation), coaching, nutrition, strength | Lactate profile **101.90 €**, about 1.5 h. The combined test takes about 2.5 h. | Form ("Rezerviraj") plus phone, per sport | "1300+ tests, 750+ clients, 10+ years", 2 testimonials |
| **Aleksej Dolinšek** (aleksejdolinsek.com) | Field step test with lactate and muscle oxygenation, LSCT test, bike fitting, coaching | Field test **from 129 €**, LSCT **99 €** (4-test pack), bike fit 160–370 € | Contact form | Association with Pogačar's bike fitter; gift voucher offered |
| **Faculty of Sport, Institute of Sport** (fsp.uni-lj.si) | Measurements for recreational and elite athletes, lab or field | Price list linked; co-financed by the ministry and FŠO | Contact | Institutional authority |
| **ZRS Koper, Ikarus lab** | Multistage lactate test (cycling, running, rowing), lab or field | Not published | Contact | Institutional |

**What this means for us:**
- **We are the cheapest private lactate profile (90 €)** and the **only one with online booking and instant confirmation.** Competitors use forms and phone calls. "Book online in a minute" and the price are real differentiators, so say them.
- Competitors lead with institutional proof (test counts, years). We can't yet, so we lead with Jaka (VO₂max 80, U20 national team, 4 junior titles) and with what the customer gets (a sample result). Don't invent counts. Add "N tests run" only once the database can show a real number.
- Nobody offers a retest discount, and almost nobody offers bundles. Abroad, the GVSU lab (USA) gives $25 off a repeat test, and university labs (Minnesota, Westminster, Newcastle) sell VO₂max + lactate bundles below the single prices. A clear retest offer would be unique locally.

### Market size (reach)
- **Ljubljana Marathon 2024: 15,267 registrations** (2,881 marathon, 6,238 half, 6,148 10 km); 2026 edition 15–18 October.
- **Maraton Franja 2024: about 5,800 riders** (road cycling).
- The **European Mountain and Trail Championships 2026** were held as "Ljubljana–Kamnik": a big local trail scene, and Jaka's own discipline.

### What converts: the evidence, and how strong it is
| Claim | Evidence | Strength | What we do |
|---|---|---|---|
| Fees or the price revealed late cause abandonment | Baymard: 39 % abandon over extra costs; travel: more than half abandon when the total shows late | Strong (e-commerce) | Price and "VAT included" on every card, the LP hero and the review step. No surprises. |
| Forced account creation kills checkouts | Baymard: 19 % abandon | Strong | Booking stays guest. The account is offered **after** booking (already the case). |
| Fewer form fields convert better; the phone field is the worst | Field-removal tests from +12 % to +77 %, one null result (Hillsdale) | Medium (single A/B tests) | Ask whether phone can be optional (❓ Jaka). |
| Fake timers are a dark pattern | EU sweep 2023: 42 of 399 shops used fake countdown timers; enforcement under the UCPD | Strong (legal) | Only real scarcity: free slots from the slots API. |
| Sticky mobile CTA | +6 % to +10 % in several tests, one test negative on revenue | Weak to medium | Keep the sticky bar, with a sharper offer, hidden while an input has focus. |
| One goal per landing page | Unbounce fitness benchmark: median page about 4.2 %, top quartile 26.8 %; click-through goals convert best | Medium | One primary CTA per page (`data-cta="primary"`). |
| First-person CTA ("my") | ContentVerve +90 %, but reversals exist | Weak | Don't bother. Use a verb + object + price. |
| Show the price for services | No clean study; B2B SaaS data even points the other way (hiding the price filters out leads) | Weak | Show it anyway. A 90 € consumer purchase isn't B2B, and price is our advantage. |

---

## 2. Audience segments, ranked by expected ROI

ROI score = reach in Slovenia × willingness to pay × fit with Jaka (each 1–5).

| # | Segment | The job they hire us for | Reach | Pay | Fit | Score | Lead offer |
|---|---|---|---|---|---|---|---|
| 1 | **Ambitious amateur road runners** (10 km to marathon, 25–55, Ljubljana and central Slovenia) | "Stop guessing my paces. My easy runs feel hard and I'm not getting faster. I want a PR at Ljubljana or a spring half." | 5 | 3 | 4 | **60** | Lactate profile 90 € → Coaching / race prep |
| 2 | **Amateur road cyclists and gran fondo riders** (Franja, 30–55) | "My power meter and watch give me numbers, but I don't trust my zones or my FTP." | 4 | 4 | 3 | **48** | Lactate profile or VO₂max + lactate 150 € |
| 3 | **Trail and mountain runners, ski mountaineers** | "I want to climb faster and not blow up on long races." Jaka's own sports: the strongest credibility. | 3 | 3 | 5 | **45** | Performance 250 € (fuel use matters for long races) → Coaching |
| 4 | **Triathletes** | "Three sports, limited hours: I need exact zones and fuelling." | 2 | 5 | 4 | **40** | Performance 250 € |
| 5 | **Cross-country skiers** (pre-season, Sep–Nov) | "Get ready for the snow season." Jaka: 2× U20 Worlds. | 2 | 3 | 5 | **30** | VO₂max + lactate, Elite |
| 6 | **Juniors and their parents** | "My kid is talented. I want them trained safely and properly." Jaka's junior national-team path is the exact proof. | 2 | 4 | 4 | **32** | Coaching, lab tests. ❓ Minors need a parent's consent (T17). |
| 7 | **Clubs** (running, triathlon, ski clubs) | "Test the whole squad in one day." | 2 | 3 | 4 | **24** (but bulk) | Club testing day, sold by Jaka directly ❓ |
| 8 | **Fitness beginners, curious about VO₂max** | "Am I fit? How do I compare?" | 5 | 2 | 2 | **20** | Lactate or VO₂max. Not targeted in ads; served by the FAQ. |

Paid ads go to **1 → 2 → 3**. Segments 4–5 get campaigns at their season. Segment 7 is a direct-sales task for Jaka.

---

## 3. Hooks

★ = top pick, which goes into the page's `h1`. All `h1`s are 10 words or fewer (US-010). The other hooks are for ad headlines, Instagram and A/B rounds. **Test them as Meta ad headlines first (cheap, fast), then move the winner into the LP `h1`, so the ad and the page match.**

### Home
| | EN | SL |
|---|---|---|
| ★1 | **Stop guessing. Train in your own zones.** | **Dovolj ugibanja. Treniraj v svojih conah.** |
| 2 | Train on data, not guesswork. | Treniraj na podlagi podatkov, ne ugibanja. |
| 3 | Your watch estimates. The lab measures. | Ura ocenjuje. Laboratorij meri. |
| 4 | Know your numbers. Then train by them. | Spoznaj svoje številke. Potem treniraj po njih. |
| 5 | Easy days truly easy. Hard days truly hard. | Lahki treningi zares lahki, težki zares težki. |
| 6 | Lab-tested zones and a plan that follows them. | Cone iz laboratorija in načrt, ki jim sledi. |
| 7 | From a drop of blood to your training zones. | Od kapljice krvi do tvojih trening con. |
| 8 | Find out what pace you can really hold. | Izmeri, kakšen tempo res zdržiš. |
| 9 | Your two thresholds for 90 €. Booked in a minute. | Tvoja pragova za 90 €. Rezervacija v minuti. |
| 10 | Train smarter, not just more. | Treniraj pametneje, ne le več. |
| 11 | Coached by a U20 national-team athlete with VO₂max 80.¹ | Trenira te reprezentant U20 z VO₂max 80.¹ |
| 12 | Smarter training. Higher performance. Better results. | Pametnejši trening. Večja zmogljivost. Boljši rezultati. |

¹ Only true for Coaching and Elite, and only while Jaka is the only coach. Use it in ads for coaching, never on the Plan package.

**Why ★1:**
- It names the pain every amateur knows (intensity is a guess) and promises an outcome they own ("your own zones").
- It is true of every test and every package, at 7 words.
- The current line ("data, not guesswork") moves to the subline, so the brand line stays.

### Lab tests (`/lab`)
| | EN | SL |
|---|---|---|
| ★1 | **Your watch estimates. The lab measures.** | **Ura ocenjuje. Laboratorij meri.** |
| 2 | Zones from your blood, not from your age. | Cone iz tvoje krvi, ne iz tvoje starosti. |
| 3 | Where are your thresholds? Measure them. | Kje sta tvoja pragova? Izmeri ju. |
| 4 | Thresholds, VO₂max, zones. Measured, not estimated. | Pragova, VO₂max, cone. Izmerjeno, ne ocenjeno. |
| 5 | Find your thresholds. Leave the grey zone. | Najdi svoja pragova. Zapusti sivo cono. |
| 6 | One visit. Your zones for the next block. | En obisk. Tvoje cone za naslednji blok. |
| 7 | Know the pace you can hold on race day. | Spoznaj tempo, ki ga zdržiš na tekmi. |
| 8 | Lactate profile 90 €. Every result explained. | Laktatni profil 90 €. Vsak rezultat z razlago. |
| 9 | Stop copying zones from an app. Measure yours. | Nehaj prepisovati cone iz aplikacije. Izmeri svoje. |
| 10 | Test now. Retest in 3 months. See what changed. | Izmeri zdaj. Ponovi čez 3 mesece. Poglej, kaj se je spremenilo. |
| 11 | Lab tests: know your numbers. (current) | Laboratorijske meritve: spoznaj svoje številke. |

**Why ★1:**
- Every target customer has a watch showing an *estimated* VO₂max and zones, and half-doubts them.
- It positions the lab against the free thing they already own, and it is literally true. 5 words.

### Coaching (`/coaching`)
| | EN | SL |
|---|---|---|
| ★1 | **Your plan, built on your numbers, adjusted every week.** | **Načrt po tvojih številkah, prilagojen vsak teden.** |
| 2 | Training built around you. (current) | Trening, zgrajen okoli tebe. |
| 3 | Know what to train today. And why. | Veš, kaj trenirati danes. In zakaj. |
| 4 | Coaching that starts in the lab. | Trenerstvo, ki se začne v laboratoriju. |
| 5 | A plan that adapts when your week goes sideways. | Načrt, ki se prilagodi, ko gre teden po svoje. |
| 6 | Stop stitching plans together from the internet. | Nehaj sestavljati trening iz načrtov z interneta. |
| 7 | Your goal, your zones, your week. One plan. | Tvoj cilj, tvoje cone, tvoj teden. En načrt. |
| 8 | Lab zones. Jaka's method. Your week. | Cone iz laboratorija. Jakova metoda. Tvoj teden. |
| 9 | Every workout analysed. Every week adjusted. | Vsak trening analiziran. Vsak teden prilagojen. |
| 10 | Train for your race, not from someone else's plan. | Treniraj za svojo tekmo, ne po tujem načrtu. |
| 11 | From 25 € a month, built on Jaka's method. | Od 25 € na mesec, po Jakovi metodi. |

**Why ★1:**
- It says exactly what all three packages deliver, so it is honest for Plan too.
- It contrasts with static PDF plans and generic apps without naming them.

### Landing page: lactate test (`/lp/lactate-test`)
| | EN | SL |
|---|---|---|
| ★1 | **Your training zones from a drop of blood.** | **Tvoje trening cone iz kapljice krvi.** |
| 2 | Train in your zones, not a formula's. (current) | Treniraj v svojih conah, ne v conah formule. |
| 3 | Know exactly how easy your easy runs should be. *(runners)* | Izveš, kako lahki naj bodo tvoji lahki teki. |
| 4 | Your power zones from lactate, not an estimate. *(cyclists)* | Tvoje cone moči iz laktata, ne iz ocene. |
| 5 | Where are your thresholds? Find out for 90 €. | Kje sta tvoja pragova? Izveš za 90 €. |
| 6 | Before your next block, measure your thresholds. | Pred naslednjim blokom izmeri svoja pragova. |
| 7 | Stop running your easy days too fast. *(runners)* | Nehaj prehitro teči lahkih treningov. |
| 8 | Two thresholds. Every zone. One visit. | Dva pragova. Vse cone. En obisk. |
| 9 | Your watch estimates. The lab measures. 90 €. | Ura ocenjuje. Laboratorij meri. 90 €. |
| 10 | Your thresholds, explained in plain words. | Tvoja pragova, razložena po domače. |

**Why ★1:**
- Concrete and a little surprising, and true: a drop from the fingertip or earlobe (catalog).
- It works for runners and cyclists alike.
- The sport-specific variants (3, 4, 7) are for the ad headline, with the same page behind them.

### Landing page: Performance package (`/lp/performance`)
| | EN | SL |
|---|---|---|
| ★1 | **Four tests, one visit. 250 € instead of 360 €.** | **Štiri meritve, en obisk. 250 € namesto 360 €.** |
| 2 | Your whole endurance profile in one visit. (current) | Celoten profil tvoje vzdržljivosti v enem obisku. |
| 3 | Engine, thresholds, fuel. Measured in one visit. | Motor, pragova, gorivo. Izmerjeno v enem obisku. |
| 4 | Know your engine, your limits and your fuel. | Spoznaj svoj motor, svoje meje in svoje gorivo. |
| 5 | Fat or carbs? Find out at every pace. | Maščobe ali ogljikovi hidrati? Izveš pri vsakem tempu. |
| 6 | The full picture before your biggest season. | Celotna slika pred tvojo najpomembnejšo sezono. |
| 7 | Plan your race fuelling on data. | Prehrano na tekmi načrtuj na podlagi podatkov. |
| 8 | One morning in the lab. A season of better decisions.² | Eno dopoldne v laboratoriju. Sezona boljših odločitev.² |

² Only if Performance is always booked in the morning (it is fasted). ❓ Jaka

**Why ★1:**
- Ad traffic responds to concrete value, and 90 + 90 + 130 + 50 = 360 € is plain arithmetic of published prices.
- It's a bundle comparison, not a "was/now" price, so the EU rule on price reductions (Omnibus, art. 6a) does not apply. Keep "if booked separately" in the subline.

### Landing page: Coaching (`/lp/coaching`)
| | EN | SL |
|---|---|---|
| ★1 | **Coaching with Jaka, retested every 3 months.** | **Coaching z Jakom in meritvijo vsake 3 mesece.** |
| 2 | A plan built on your numbers. (current) | Načrt, zgrajen na tvojih številkah. |
| 3 | Jaka's comments on your weeks. A lab test every quarter. | Jakovi komentarji na tvoje tedne. Meritev vsako četrtletje. |
| 4 | Your plan adapts weekly. Your zones every 3 months. | Načrt se prilagodi vsak teden, cone vsake 3 mesece. |
| 5 | Have a goal? Get a coach and a lab. | Imaš cilj? Dobi trenerja in laboratorij. |
| 6 | 119 € a month, lactate test included. | 119 € na mesec, laktatni test vključen. |
| 7 | Stop guessing whether your training works. | Nehaj ugibati, ali tvoj trening deluje. |
| 8 | Coaching that measures progress, not just kilometres. | Trenerstvo, ki meri napredek, ne le kilometre. |
| 9 | A monthly call, replies within 48 hours, real lab data. | Pogovor vsak mesec, odgovor v 48 urah, pravi laboratorijski podatki. |

**Why ★1:** it names the two things no app gives: a named coach and a real lab retest, both literally in the package.

### Landing page: race preparation (`/lp/race-preparation`)
| | EN | SL |
|---|---|---|
| ★1 | **Pick your race. We plan back from race day.** | **Izberi tekmo. Pripravo načrtujemo od starta nazaj.** |
| 2 | 12–16 weeks to your race, measured. (current) | 12–16 tednov do tekme, izmerjeno. |
| 3 | One race. One block. Tested at both ends. | Ena tekma. En blok. Meritev na začetku in na koncu. |
| 4 | See your progress in numbers before the start line. | Napredek v številkah, še preden stopiš na start. |
| 5 | 490 € once. No subscription. Two lab tests included. | 490 € enkrat. Brez naročnine. Dve meritvi vključeni. |
| 6 | Your marathon deserves more than a downloaded plan. | Tvoj maraton si zasluži več kot preneseni načrt. |
| 7 | Know your race pace before you race. | Spoznaj tekmovalni tempo, preden stopiš na start. |
| 8 | Ljubljana Marathon in October? Start in June. *(seasonal ad)* | Ljubljanski maraton oktobra? Začni junija. |

**Why ★1:** it puts the customer's own race at the centre, and "plan back" is exactly what the block does. The CTA "Send your race date" continues the sentence.

### Contact
★ **Tell me your goal. I'll suggest where to start.** / **Napiši mi svoj cilj. Predlagal ti bom, kje začeti.**

Honest: Jaka answers contact messages. Alternatives:
- "Questions before you book? Ask me." / "Vprašanje pred rezervacijo? Vprašaj me."
- "Let's talk about your goal." (current)

---

## 4. Page-by-page conversion structure

Shared rules for every page:
- **One primary CTA** (`data-cta="primary"`) in the first viewport. Every section ends in a CTA.
- **Trust line** under every primary CTA on lab pages: "VAT included · Free cancellation up to 24 h · Book online in a minute".
- **Price** before the first FAQ, always "VAT included".
- **Short:** `h1` ≤ 10 words, subline ≤ 20 words, no paragraph over 45 words. If a section needs more, it is two sections or a FAQ.

### 4.1 Home `/`
| # | Section | Content | CTA |
|---|---|---|---|
| 0 | **Hero** | h1 ★ "Stop guessing. Train in your own zones." · subline "Lab tests and coaching for runners, cyclists and skiers. Train on data, not guesswork." · note "Lactate profile 90 €, VAT included. Free cancellation up to 24 h before." · photo Red Bull 400 | **Primary:** "Book a lactate test" → `/booking?service=lactate-profile` · **Secondary:** "See all tests" → `/lab` |
| 1 | **Proof** (existing 4 stats) | VO₂max 80 · 5th Red Bull 400, fastest junior · U20 national team · 4 sports with junior titles · "More about Jaka" | "Book a lactate test" |
| 2 | **What you get** *(new)* | A sample result: a lactate curve with LT1/LT2 and a 5-zone table (heart rate and pace). Caption "Jaka's own lactate profile" ❓. Three bullets: "Two thresholds" · "Your zones" · "Explained". | "Book a lactate test" |
| 3 | **How it works** (existing 4 steps) | Test → Zones → Plan → Progress | "Start with a lactate profile" (existing) |
| 4 | **Where to start** (offers) | Lab card: "Best first test: lactate profile 90 €" and "Performance package 250 € (360 € separately)". Coaching card: "from 25 € / month". | "Book a lactate test" / "See coaching" |
| 5 | **FAQ** (4) | fit, whatYouGet, duration, cancel | "Book a lactate test" |
| 6 | **Close** | "Know your zones before your next block." / "Pick a time online in a minute. Free cancellation up to 24 hours before." | "Book a lactate test" + "Write to me" |

Disciplines: move them into the proof section as one line of chips; don't give them a section of their own.

### 4.2 Lab tests `/lab`
| # | Section | Content | CTA |
|---|---|---|---|
| 0 | **Hero** | h1 ★ "Your watch estimates. The lab measures." · subline "Your thresholds, VO₂max and training zones, measured and explained. Lactate profile 90 €." · trust line | **Primary:** "Book a lactate test" → `/booking?service=lactate-profile` · **Secondary:** "Which test is right for me?" (anchor) |
| 1 | **Proof** (compact) | 3 stats (VO₂max 80, U20 national team, Faculty of Sport) + "Tests run by Jaka Marinko" ❓ (true only while he is the only coach) | "Book a lactate test" |
| 2 | **Which test?** (existing chooser, 6 rows) | Each row links to `/booking?service=<id>` | per row |
| 3 | **Tests and prices** | Order as in §5.1: **Performance** (badge "Best value", "360 € separately · save 110 €") → Long-distance → Runner → VO₂max + lactate → **Lactate profile** ("Best first test") → singles → "Come back" row (Season pack, Lactate retest). Each card: price, "about N min", 3 bullets, Book button. | per card |
| 4 | **What happens** (existing 3 steps) | + one line: "Hard for the last few minutes, and you can stop at any time." | "Book a lactate test" |
| 5 | **After the test** | What you get, plus the post-test offer line (only if Plan/Coaching can start now ❓) | "Book a lactate test" |
| 6 | **FAQ** (≥ 5) | fit, blood, duration, whatYouGet, preparation, cancel, payment, where, sport ❓, retest, noCoach | "Book a lactate test" |
| 7 | **Close** | "Your zones are one test away." / "Pick a time online in a minute." | "Book a lactate test" |

Cut the "Why test?" block. Its three ideas live in the hero, the chooser and the FAQ.

### 4.3 Coaching `/coaching`
**Coaching CTA target (for the US-010 test):** packages can't be bought online yet, so the primary CTA is a **lead**, `/contact?package=coaching`. When subscriptions ship (phase 3), it switches to "Choose Coaching" → checkout.

| # | Section | Content | CTA |
|---|---|---|---|
| 0 | **Hero** | h1 ★ "Your plan, built on your numbers, adjusted every week." · subline "Three packages from 25 € a month. Coaching adds Jaka's comments and a lab test every 3 months." | **Primary:** "Tell me your goal" → `/contact?package=coaching` · **Secondary:** "Start with a lactate test" → `/booking?service=lactate-profile` |
| 1 | **Proof** | Jaka's stats + the **Šmarna gora chart** ("progress measured in seconds": 15:11 → 12:33). It's the best proof that he measures progress. | "Tell me your goal" |
| 2 | **Packages** | Plan · **Coaching (Recommended)** · Elite. Under Coaching: "Includes a lactate test every 3 months (90 € each)". Show the yearly price ("2 months free"). | per card → `/contact?package=<id>` |
| 3 | **How it works** | Test → zones → plan → every workout analysed → retest | "Start with a lactate test" |
| 4 | **Who does what** *(new, 3 lines)* | "Your plan is built on Jaka's method and adapts every week." · "On Coaching and Elite, Jaka comments on your weeks and you talk regularly." · "Messages are always answered by a person." | "Tell me your goal" |
| 5 | **FAQ** | whoWrites, coachingFit, coachingTime, labTestFirst, devices, minimumTerm, yearly, messages | "Tell me your goal" |
| 6 | **Close** | "Not sure which package fits?" (existing) | "Tell me your goal" |

The 8-card "services" grid becomes one line of chips under the packages, or is cut. It is a wall.

### 4.4 Contact `/contact`
| # | Section | Content | CTA |
|---|---|---|---|
| 0 | **Hero + form side by side** (form first on mobile) | h1 ★ "Tell me your goal. I'll suggest where to start." · subline "Lab tests, coaching or race preparation. I reply within two working days." | **Primary:** "Send message" (form) · **Secondary:** "Know which test you want? Book it online" → `/booking` |
| 1 | **Form** | Name · Email · Topic (prefilled from `?package=`) · Message, with a placeholder: "Your goal, race date and how many hours a week you can train." · phone optional (already) · consent | |
| 2 | **Direct lines** | Phone, email, Instagram (existing) | |
| 3 | **Proof** (one line) | "VO₂max 80 · U20 national team · Faculty of Sport" | |

### 4.5 Booking `/booking`
h1 "Book your test" / "Rezerviraj meritev". Subline: "Pick a time. Free cancellation up to 24 hours before." / "Izberi termin. Brezplačna odpoved do 24 ur prej." Step-by-step fixes are in §6.

### 4.6 Landing pages `/lp/*`
Block order (set in `components/landing/pages.ts`). Proof sits within the first two sections after the hero on the lab-test pages.

| Slug | Blocks | FAQ keys (≥ 5) | Primary CTA → target | Price presentation |
|---|---|---|---|---|
| `lactate-test` | hero → proof → points → price → faq → cta | landing.faq.fit, .whatYouGetLactate, .duration, .preparation, .cancel, .blood, .noCoach | "Book a lactate test" → `/booking?service=lactate-profile` | "90 €" beside the CTA in the hero; price card with the trust line |
| `performance` | hero → price → points → proof → faq → cta | .fit, .whatYouGetPerformance, .duration, .fasted, .cancel, .where | "Book the Performance package" → `/booking?service=performance` | "250 €" big, "360 € if booked separately" right under it |
| `coaching` | hero → points → proof → price → faq → cta | coaching.faq.coachingFit, .whoWrites, .coachingTime, .coachingStart, .coachingCancel, .labTestFirst | "Tell me your goal" → `/contact?package=coaching` | "119 € / month · lactate test every 3 months included · min. 3 months" |
| `race-preparation` | hero → points → price → proof → faq → cta | landing.faq.raceWhen, .raceWhatYouGet, .raceFit, .raceStart, .raceCancel ❓ | "Send your race date" → `/contact?package=race-preparation` | "490 €, paid once. Two lab tests included." |

Hook, lead and close for each LP are in Appendix A.

### 4.7 Objection FAQ: exact Q&A
Used by the pages above. Keys go into `landing.json` → `faq` (lab ones) and `coaching.json` → `faq` (coaching ones).

| Key | EN | SL |
|---|---|---|
| `fit` | **Am I fit enough for a test?** Yes. The test starts easy and gets a little harder every few minutes, and you can stop at any time. It shows where you are today, at any level. Zones are just as useful for newer athletes: they show how easy your easy days should be. | **Je moja forma dovolj dobra za meritev?** Da. Meritev se začne zlahka in se vsakih nekaj minut malo stopnjuje, ustaviš pa se lahko kadarkoli. Pokaže, kje si danes, na katerikoli ravni. Tudi manj izkušenim cone povedo, kako lahki naj bodo lahki treningi. |
| `blood` | **Does the blood sample hurt?** Hardly. A small prick in your fingertip or earlobe, and a drop of blood after each step. Only the lactate tests need it. | **Ali odvzem krvi boli?** Komaj kaj. Majhen vbod v prst ali ušesno mečico in kapljica krvi po vsaki stopnji. Potreben je samo pri laktatnih meritvah. |
| `duration` | **How long does it take?** The lactate profile takes about an hour, the Performance package about two. Each test's time is shown with its price. | **Koliko časa traja?** Laktatni profil traja približno uro, Performance paket približno dve. Trajanje vsake meritve je navedeno ob ceni. |
| `whatYouGet` | **What do I get?** Your results explained and, from the lactate and VO₂max tests, your personal training zones with heart rate and pace or power for each. | **Kaj dobim?** Razlago rezultatov, pri laktatni meritvi in meritvi VO₂max pa tudi osebne trening cone s srčnim utripom in tempom ali močjo za vsako. |
| `whatYouGetLactate` | **What do I get?** Your aerobic (LT1) and anaerobic (LT2) thresholds with heart rate and pace or power at each, your personal training zones, and your results explained. | **Kaj dobim?** Aerobni (LT1) in anaerobni prag (LT2) s srčnim utripom in tempom ali močjo pri vsakem, osebne trening cone in razlago rezultatov. |
| `whatYouGetPerformance` | **What do I get?** VO₂max, lactate profile, fat and carbohydrate use and body composition, a personal explanation of your results and your training zones. | **Kaj dobim?** VO₂max, laktatni profil, porabo maščob in OH ter telesno sestavo, individualno razlago rezultatov in trening cone. |
| `preparation` | (existing) **How do I prepare?** | (existing) **Kako se pripravim?** |
| `fasted` | (existing) | (existing) |
| `cancel` | **Can I cancel or move my test?** Yes, free up to 24 hours before, with the link in your confirmation email. If you paid by card, you get the full amount back. To move it, cancel and book a new time. | **Lahko meritev odpovem ali prestavim?** Da, brezplačno do 24 ur prej, prek povezave v potrditvenem e-sporočilu. Če je bila plačana s kartico, ti vrnemo celoten znesek. Za prestavitev odpovej termin in rezerviraj novega. |
| `payment` (online on) | **How do I pay?** By card when you book, on Stripe's secure payment page. The price includes VAT. | **Kako plačam?** S kartico ob rezervaciji, na varni plačilni strani Stripe. Cena vključuje DDV. |
| `payment` (online off) | **How do I pay?** On site, on the day. The price includes VAT. | **Kako plačam?** Na kraju samem, na dan meritve. Cena vključuje DDV. |
| `where` | (existing; ❓ add the town once decided) | (existing) |
| `sport` ❓ | **Can I test running or cycling?** Runners test running and cyclists test on the bike. *(Jaka: treadmill? own bike on a trainer? how is it chosen?)* | **Lahko meritev opravim v teku ali na kolesu?** Tekači tečejo, kolesarji kolesarijo. *(Jaka: tekoča preproga? lastno kolo na trenažerju?)* |
| `retest` | **How often should I retest?** Every 2–3 months while you train, or before a new season, so your zones keep up with your fitness. Coaching includes a lactate test every 3 months. | **Kako pogosto naj meritev ponovim?** Vsake 2–3 mesece med treningom ali pred novo sezono, da cone sledijo tvoji formi. Paket Coaching vključuje laktatni test vsake 3 mesece. |
| `noCoach` | **Can I use the results without a coach?** Yes. You get your zones and what they mean for your training, ready to use with any plan or watch. | **Lahko rezultate uporabljam brez trenerja?** Da. Dobiš svoje cone in razlago, kaj pomenijo za trening, pripravljene za katerikoli načrt ali uro. |
| `raceWhatYouGet` | **What's included?** A 12–16-week training block for one race, with a lab test at the start to set your zones and one at the end to measure your progress. Paid once. | **Kaj je vključeno?** 12–16-tedenski trening blok za eno tekmo, z meritvijo na začetku, ki določi tvoje cone, in meritvijo na koncu, ki pokaže napredek. Plačaš enkrat. |
| `raceFit` | **Is it only for fast runners?** No. The block starts from your own test results, so it fits your level and your goal for that race. | **Je samo za hitre?** Ne. Blok izhaja iz tvojih rezultatov meritve, zato je prilagojen tvoji ravni in cilju za to tekmo. |
| `raceStart` | **How do I start?** Send your race date and goal. We reply within two working days and book your first test. | **Kako začnem?** Pošlji datum tekme in cilj. Odgovorimo v dveh delovnih dneh in rezerviramo prvo meritev. |
| `raceCancel` ❓ | **Can I cancel?** *(owner decides: e.g. "Free before your first test; after that, no refund.")* | **Lahko odpovem?** *(odloči lastnik)* |
| `raceWhen` | (existing) | (existing) |
| coaching `whoWrites` | **Is my plan written by Jaka?** Your plan is built on Jaka's method and adjusts to your training every week. On Coaching, Jaka also comments on your weeks and you talk every month; on Elite, every two weeks, with sessions in person. Messages are always answered by a person. | **Ali moj načrt napiše Jaka?** Načrt temelji na Jakovi metodi in se vsak teden prilagodi tvojemu treningu. V paketu Coaching Jaka tvoje tedne tudi osebno komentira, pogovor imata vsak mesec; v paketu Elite vsaka dva tedna, poleg tega so tu še treningi v živo. Na sporočila vedno odgovori človek. |
| coaching `coachingFit` | **Is coaching only for competitors?** No. Plan and Coaching are for anyone with a goal, from a first half marathon to a season of races. Elite is for competitors. | **Je trenerstvo samo za tekmovalce?** Ne. Plan in Coaching sta za vsakogar s ciljem, od prvega polmaratona do sezone tekem. Elite je za tekmovalce. |
| coaching `coachingTime` | **How many hours a week do I need?** As many as you have. Your plan is built on the days and hours you can train, and adapts when a week changes. | **Koliko ur na teden potrebujem?** Toliko, kolikor jih imaš. Načrt je zgrajen na dnevih in urah, ki jih imaš za trening, in se prilagodi, ko se teden spremeni. |
| coaching `coachingStart` | **How do I start?** Send your goal and race date. We reply within two working days with the package that fits and, if you haven't been tested yet, a lactate test to set your zones. | **Kako začnem?** Pošlji svoj cilj in datum tekme. V dveh delovnih dneh ti odgovorimo s predlogom paketa, in če še nimaš meritve, z laktatnim testom za tvoje cone. |
| coaching `coachingCancel` ❓ | **Can I stop?** Plan: any month. Coaching and Elite: after the first 3 months, any month. *(owner: confirm monthly cancellation after the minimum term)* | **Lahko prekinem?** Plan kadarkoli, za naslednji mesec. Coaching in Elite po prvih 3 mesecih, prav tako za naslednji mesec. |

---

## 5. Offers and ROI ideas, ranked by impact ÷ effort

| # | Move | Impact | Effort | Needs a decision |
|---|---|---|---|---|
| 1 | **Lactate profile 90 € as the single entry offer.** Every hero, sticky bar and close CTA → `/booking?service=lactate-profile`. Sticky bar: "Lactate profile 90 € · Book" instead of "from 50 €". | High | XS (copy + links) | no |
| 2 | **Bundle anchoring.** Performance "250 € · 360 € if booked separately", VO₂max + lactate "150 € · 180 € separately", listed in that order (Performance first). | High | XS | no |
| 3 | **Objection FAQ + trust line** on lab, home and every LP (§4.7). | High | S | no (except ❓ items) |
| 4 | **Online card payment on, with Apple Pay and Google Pay** in Stripe Checkout. Prepaid tests cut no-shows; `booking_paid` becomes real revenue that Meta can optimise for. | High | S (env + Stripe dashboard) | ❓ owner: `PAYMENTS_ENABLED=true` |
| 5 | **Sample result as proof.** Jaka's own lactate curve and zone table on home, lab and the lactate LP. | High | S | ❓ Jaka's data and consent |
| 6 | **Customer proof.** After each of the first 20 tests, ask for a one-line quote (with consent) and a Google review. Set up a **Google Business Profile** ("laktatni test", "meritev VO₂max" are low-competition local searches). | High | M (time, not code) | ❓ the lab address appears on GBP |
| 7 | **Post-test follow-up.** The test already ends with an offer (30 days of Plan free / first month of Coaching −50 %). Add an email on day 0 (results + offer), day 3 and day 10 (reminder, offer ends). This is the coaching funnel. | High | M | ❓ Can Plan/Coaching actually start today? If not, don't advertise the offer yet. |
| 8 | **Founding athletes:** the first 20 get −30 % for life (already in `product.md`). Honest scarcity: "N of 20 founding places left", counted from the database. | High (coaching) | M | ❓ owner confirms; counter must be real |
| 9 | **Bundles + retest** as bookable catalog entries (§5.1): Runner 180 €, Long-distance 180 €, Season pack 350 €, Lactate retest 70 €. | High | S–M | owner confirms the prices |
| 10 | **Christmas gift voucher** (Nov–Dec, i.e. now). Dolinšek already sells them. Endurance athletes are hard to buy for. | Medium | M (Stripe payment link + code) | ❓ yes/no, value |
| 11 | **Club testing days:** a squad price for 6+ athletes on one day, sold by Jaka to running, triathlon and ski clubs. | Medium | S (sales, not code) | ❓ group price |
| 12 | **Referral:** "Test with a training partner: both −10 €". | Low–medium | M | ❓ |
| 13 | Lead magnet (zone calculator, race-prep checklist) | Low now | M | later, once the funnel above works |

### 5.1 Bundles and the retest offer: spec to build (owner to confirm the prices)
The owner wants bundles. The prices below are final enough to build as bookable catalog entries (`packages/types/src/catalog.ts`, same shape as `vo2max-lactate` and `performance`, with `contains`). They use round prices like the current catalog. "Sum" is the sum of the current single prices.

| ID | EN name | SL name | Contains | Duration (estimate ❓ Jaka) | Prep | Sum | **Price** | Saving | Role |
|---|---|---|---|---|---|---|---|---|---|
| `lactate-profile` (exists) | Lactate profile | Laktatni profil | lactate | 60 min | rested + fed | — | **90 €** | — | **Entry offer** |
| `vo2max-lactate` (exists) | VO₂max + lactate | VO₂max + laktat | vo2max, lactate | 75 min | rested + fed | 180 € | **150 €** | 30 € (17 %) | Middle option |
| `runner` **new** | Runner bundle | Tekaški paket | lactate, running-economy, anthropometry | 120 min | rested + fed | 220 € | **180 €** | 40 € (18 %) | Segment 1 (road runners) |
| `long-distance` **new** | Long-distance bundle | Paket za dolge tekme | lactate, fat-carb | 90 min | **fasted** | 220 € | **180 €** | 40 € (18 %) | Trail, gran fondo, triathlon (fuelling) |
| `performance` (exists) ★ | Performance package | Performance paket | vo2max, lactate, fat-carb, anthropometry | 120 min | **fasted** | 360 € | **250 €** | 110 € (31 %) | **Hero bundle** |
| `season` **new** | Season pack | Sezonski paket | performance now + 2 × lactate retest within 6 months | 3 visits (120 + 60 + 60 min) | per visit | 430 € | **350 €** | 80 € (19 %) | Upsell for coaching-minded athletes |
| `lactate-retest` **new** | Lactate retest | Ponovni laktatni test | lactate, within 4 months of any test that included lactate | 60 min | rested + fed | 90 € | **70 €** | 20 € (22 %) | **Retest offer** |

**Why these prices (anchoring and a decoy):**
- **Performance is the hero.** It has the biggest saving (31 %, 110 €), it's the most complete, and it's listed first (anchor).
- **The two 180 € bundles are the decoy.** Next to them, Performance costs only 70 € more for VO₂max, fuel use and body composition together. The step from 180 € to 250 € looks small, while the step from 90 € to 250 € looks big. They also give runners and long-distance athletes a bundle named for them.
- **The lactate profile stays the 90 € entry.** It's the cheapest real threshold test in Slovenia and the one ads lead with.
- **The retest at 70 €** is locally unique (§1). It sits under the 90 € single price, so customers come back to us and not to a competitor at 101.90 €.
- **The season pack** turns one visit into three and is the natural step towards Coaching. Coaching includes a lactate test every 3 months, so after the season pack, Coaching is the cheaper way to keep testing.
- **All savings are against our own current single prices** (a bundle comparison, not a was/now reduction), so the Omnibus rule on price reductions doesn't apply. Show "Sum {sum} € · you save {saving} €".

**How each one is booked:**
- `runner`, `long-distance` and `performance` are one visit: a normal bookable service with `contains`.
- `season`: book the Performance visit now. The two retests come as two booking codes in the confirmation email, valid for 6 months. MVP without codes: Jaka books the retests with the customer at the first visit. ❓ owner: which one first.
- `lactate-retest`: listed on `/lab` under the bundles with the line "Within 4 months of a test with us". Booking checks for a completed lactate-containing test on the same email in the last 120 days. MVP: Jaka checks on site and charges the difference if there was no earlier test. It is also offered in the results email and on `/account`.
- `long-distance` and `performance` are fasted, so offer morning slots only. ❓ Jaka: can lactate and fat/carb run in one protocol (gas exchange during the lactate steps)? If not, the duration becomes about 120 min.

Lab page order: Performance ★ → Long-distance → Runner → VO₂max + lactate → Lactate profile ("Best first test") → singles → Season pack and Lactate retest (a "Come back" row).

**Bundle copy (EN / SL):**
- `runner`: "Your thresholds, how economically you run, and your body composition. One visit." / "Tvoja pragova, ekonomičnost teka in telesna sestava. En obisk."
- `long-distance`: "Your thresholds and how you burn fat and carbs at every pace, for long races and fuelling." / "Tvoja pragova in poraba maščob ter OH pri vsakem tempu, za dolge tekme in prehrano med njimi."
- `season`: "The Performance package now, and two lactate retests within 6 months to see what changed." / "Performance paket zdaj in dva ponovna laktatna testa v 6 mesecih, da vidiš, kaj se je spremenilo."
- `lactate-retest`: "Within 4 months of a test with us. See what your training changed." / "V 4 mesecih po meritvi pri nas. Poglej, kaj je spremenil tvoj trening."
- Badges: "Best value" / "Največ za tvoj denar" (Performance); "Best first test" / "Najboljša prva meritev" (lactate); "For runners" / "Za tekače"; "For long races" / "Za dolge tekme".
- Saving line: "{sum} € separately · save {saving} €" / "Posamično {sum} € · prihraniš {saving} €".

### 5.2 Testimonials to collect (real ones only)
No invented quotes on the live site. Premium-site builds the section with clearly labelled sample quotes that are hidden in production until real ones exist. Ask every test customer, at the results talk or in the results email, with written consent (name, sport and photo each optional):
1. **A number that changed:** "My easy pace dropped from X to Y at the same heart rate" / "Retest: LT2 up from X to Y W".
2. **The surprise:** "I found out my easy runs were in zone 3."
3. **The fear answered:** "I thought I wasn't fit enough. It started easy," and "The finger prick was nothing."
4. **The race result:** "PR at the Ljubljana half: 1:41 → 1:36" (only with their permission and their own numbers).
5. **The experience:** "Booked online in a minute, results explained the same day."

Format: one sentence, first name + initial, sport, race or goal. Put them under the hero proof and next to the price. Ask for a **Google review** in the same email.

**What to lead with:**
- **Entry offer:** the lactate profile (90 €, the cheapest real threshold test in Slovenia).
- **Hero lab offer** for ambitious athletes: Performance (anchored).
- **Recommended package:** Coaching (119 €), sold after the test.
- Plan (25 €) is the downsell, never the headline.

**Price anchoring:**
- On `/lab`, list the most expensive first.
- On coaching, put the value line "a lactate test every 3 months (90 € each)" under Coaching.
- Don't lower prices; change the offer instead (`product.md`).
- We are ~12 € under Human Performance Centre's lactate price. ❓ Keep 90 € as the entry advantage, and raise it when slots fill up.

**Rough unit economics (assumptions, to check with real data):** one Coaching athlete is at least 3 × 119 € = 357 € (minimum term). If 1 in 7 lactate-test customers starts Coaching, a test customer is worth about 90 + 357 / 7 ≈ **140 €**. That is the ceiling for cost per paid booking on cold ads until we measure the real conversion rate.

### Seasonal campaigns (today is 22 Oct 2026)
| When | Campaign | Who | LP |
|---|---|---|---|
| **Now → mid-Dec** | "Off-season baseline: test now, retest in spring" + gift voucher ❓ | runners and cyclists after their season, XC skiers before snow | `lactate-test` |
| **Jan → Feb** | "New season, new zones" (the biggest window: resolutions, spring race blocks) | segments 1–4 | `lactate-test`, `performance` |
| **Mar → Apr** | Retest the winter testers (email); race prep for May–June races | past customers, trail | `race-preparation` |
| **Jun → Jul** | "Ljubljana Marathon in October? Start in June." (16 weeks back from mid-October) | marathon and half runners | `race-preparation` |
| **Sep → Oct** | Pre-season for XC skiing and ski mountaineering (Jaka's own sports) | segment 5 | `performance` |

Urgency stays honest: show the **next free time** and "**N free times this week**" from the slots API. Never a timer, never an invented number.

### Which ad landing pages to run first
1. **`/lp/lactate-test`, Meta (Instagram + Facebook), in Slovenian, ages 25–55, runners and cyclists.** Radius: around the lab ❓ (60–90 min drive). Creatives: Jaka photos plus hooks 1, 3 (runners), 4 (cyclists) and 9. Optimise for `booking_paid` once there are enough events; until then for `booking_started`.
2. **`/lp/performance`, retargeting** visitors of `/lab` and the lactate LP (with consent), plus triathletes and trail runners. Hook ★1 (the anchor).
3. **`/lp/race-preparation`** in the seasonal windows above.
4. **`/lp/coaching`** only after there are 3+ testimonials. Until then, coaching sells through the post-test offer and email.

Test hooks as **ad headlines** (3–4 per ad set, same LP). Traffic is too small for on-site A/B tests. Move the winning headline into the LP `h1`. ❓ owner: test budget (e.g. 10–15 €/day for 2 weeks per LP).

---

## 6. Booking-flow friction fixes

Current flow: service → time → details (name, email, phone, 7 PAR-Q questions, 2 checkboxes) → review → (Stripe) → confirmation. Good already: guest checkout, prefill when signed in, details kept when a slot is taken, account offered after booking.

| Step | Fix | Why |
|---|---|---|
| **Entry** | Every CTA deep-links with `?service=` (lactate by default), so the service step is skipped. | One step fewer for ~all traffic |
| **Service** | Order: lactate profile first with the badge "Best first test", then Performance. Each option shows price, "about N min" and one line of what you get. | Decide in place, no back-and-forth to `/lab` |
| **Time** | Open on the **first day with free times**, not today. Show "Next free: Tue 28 Oct, 17:00" as a one-tap shortcut. Hide days without slots. On mobile, a sticky "Continue" once a time is picked. Show "N free times this week" only from the API. | Most drop-off on booking flows is the empty calendar |
| **Time** | Under the calendar: "Free cancellation up to 24 hours before." | Risk reversal at the moment of commitment |
| **Details** | **Phone optional** ❓ Jaka (hint: "only used if we need to reach you on the day"). | Phone fields cost conversions (§1) |
| **Details** | PAR-Q: show the 7 questions as compact Yes/No rows, with a **"No to all"** shortcut that fills every answer with No and leaves each one visible and editable. ❓ Jaka/legal (safety). | 7 required radios are the heaviest part of the form |
| **Details** | Keep health consent as its own checkbox (GDPR art. 9 needs explicit consent). Replace the **terms checkbox** with a line next to the button: "By booking you accept the terms." ❓ owner/legal | One checkbox fewer |
| **Details** | Optional one-tap "Run or ride?" choice ❓ Jaka (if he needs to know which equipment to prepare). | Saves a phone call |
| **Review** | Button with the price: "Pay 90 € and confirm" / "Plačaj 90 € in potrdi" (online), or "Confirm booking" (pay on site). Show the total, "VAT included", the cancellation line and "what to bring" (3 bullets). | No surprises; the button says what happens |
| **Payment** | Enable **Apple Pay / Google Pay / Link** in Stripe Checkout. Keep the hold time visible (it's real). | Mobile wallet = no card typing |
| **Confirmation** | Order: ✓ booked → **add to calendar** → **how to prepare** (3 bullets) → create an account (one tap: sends the magic link to the email just used, no retyping). | Fewer no-shows, more accounts |
| **Steps** | "Step 2 of 4" (already in US-008). | Orientation |

**Sign-in friction (customer-login):**
- The sign-in page says what happens: "No password. We email you a link that signs you in." / "Brez gesla. Pošljemo ti povezavo za prijavo."
- "Continue with Google" above the email form when it's configured.
- Show "Check your inbox at {email}" with a link that opens the mail app on mobile (`mailto:` doesn't open the inbox, so show the Gmail and Outlook buttons only when the domain matches).
- After sign-in from the booking confirmation, land on `/account` with that booking on top.

---

## 7. Decisions needed

| # | Who | Decision |
|---|---|---|
| 1 | Owner | Turn online payment on (`PAYMENTS_ENABLED=true`, Stripe keys, Apple/Google Pay). |
| 2 | Owner | Publish the lab's town or area on the site, Google Business Profile and ads (the biggest unanswered objection is "where?"). |
| 3 | Owner | Confirm the bundle prices in §5.1: Runner 180 €, Long-distance 180 €, Season pack 350 €, Lactate retest 70 € within 4 months. Choose how the season-pack retests are delivered (codes or booked by Jaka). |
| 4 | Owner | Founding athletes −30 % for life, first 20: launch it, with a real counter? |
| 5 | Owner | Can Plan / Coaching start today? If not, take the post-test offer off the pages until they can. |
| 6 | Owner | Christmas gift voucher: yes/no, value, deadline. |
| 7 | Owner | Club testing day price; referral yes/no. |
| 8 | Owner | Ad test budget per landing page. |
| 9 | Owner | Race preparation cancellation/refund rule; monthly cancellation after the minimum term for Coaching/Elite. |
| 10 | Owner / legal | Replace the terms checkbox with passive acceptance; the "No to all" PAR-Q shortcut. |
| 11 | Jaka | Phone required or optional. |
| 12 | Jaka | Test durations (catalog values are estimates), treadmill/bike setup, whether he explains results on the spot, how soon results arrive. |
| 13 | Jaka | His own lactate profile and zones as the sample result on the site. |
| 14 | Jaka | Ask the first 20 customers for a quote and a Google review (with consent). |
| 15 | Owner | Keep lactate at 90 € (12 € under the nearest private competitor) or raise it when slots fill up. |
| 16 | Owner | Juniors as a segment: parental consent flow (T17). |

---

## 8. Measurement

**Already there:**
- Events `booking_started`, `booking_paid` (browser + server, deduped for Meta), `package_started`, `contact_sent` (with topic) and `lead_signup`, to Umami always and to Meta/Google only after consent.
- UTM attribution stored on bookings.
- The owner report **Ad sources**: paid bookings and revenue by `utm_source` / `utm_campaign`.

**Add (small):**
1. **UTM on contact requests**, and count coaching leads in the Ad sources report. Today a coaching lead from an ad is invisible to the owner.
2. **`booking_step`** to Umami only (`{step: time|details|review|checkout, service}`), so we can see where the flow leaks. Never health answers in any event.
3. **`cta_click`** to Umami only (`{cta: <data-cta id>, page}`): which hook and section drives the clicks.
4. **`faq_open`** to Umami only (`{q: key}`): which objections people actually have. Feed them back into this doc.

**Watch weekly (one row per week, in a sheet until it's in the report):**
| Number | Source |
|---|---|
| Paid bookings and revenue, by source/campaign | Ad sources report |
| Ad spend → **cost per paid booking**, per campaign (ceiling ≈ 140 € until measured, §5) | Meta + report |
| Funnel: LP/lab visitors → `booking_started` → each `booking_step` → `booking_paid` | Umami |
| Coaching leads (`contact_sent` topic coaching) and leads → packages | report + requests inbox |
| Test → package within 30 days | database |
| Cancellations and no-shows % | bookings |
| **Slot utilisation** (booked hours ÷ open hours): over 80 % for 3 weeks → raise the price, or open more slots | bookings + availability |
| Retests within 4 months | bookings |

Benchmarks are rough: the median fitness landing page converts about 4 % (Unbounce), and service-booking vendors quote 5–15 % of visitors booking, unverified. Compare us with ourselves week over week, and change one thing per two weeks.

---

## Appendix A: paste-ready strings

Only changed or new keys. Existing keys not listed stay as they are. Where a string has `{price}`, pass the **lactate profile** price (90), not the lowest lab price.

### `home.json`
```jsonc
// en
"hero": {
  "title": "Stop guessing. Train in your own zones.",
  "subtitle": "Lab tests and coaching for runners, cyclists and skiers. Train on data, not guesswork.",
  "primaryCta": "Book a lactate test",
  "secondaryCta": "See all tests",
  "note": "Lactate profile {price} €, VAT included. Free cancellation up to 24 hours before."
},
"whatYouGet": {
  "title": "What you get from one test",
  "caption": "Jaka's own lactate profile",
  "thresholds": { "title": "Two thresholds", "text": "LT1 and LT2, with heart rate and pace or power." },
  "zones": { "title": "Your zones", "text": "Five training zones from your own blood lactate." },
  "explained": { "title": "Explained", "text": "What your numbers mean for your training." }
},
"offers": { "lab": { "featured": "Best first test: lactate profile, {price} €", "performance": "Performance package {price} € ({separate} € if booked separately)" } },
"faq": { "title": "Before you book" },
"cta": {
  "title": "Know your zones before your next block.",
  "text": "Pick a time online in a minute. Free cancellation up to 24 hours before.",
  "button": "Book a lactate test"
}
// sl
"hero": {
  "title": "Dovolj ugibanja. Treniraj v svojih conah.",
  "subtitle": "Meritve in trenerstvo za tekače, kolesarje in smučarje. Treniraj na podlagi podatkov, ne ugibanja.",
  "primaryCta": "Rezerviraj laktatni test",
  "secondaryCta": "Vse meritve",
  "note": "Laktatni profil {price} €, z DDV. Brezplačna odpoved do 24 ur prej."
},
"whatYouGet": {
  "title": "Kaj dobiš z eno meritvijo",
  "caption": "Jakov laktatni profil",
  "thresholds": { "title": "Dva pragova", "text": "LT1 in LT2, s srčnim utripom in tempom ali močjo." },
  "zones": { "title": "Tvoje cone", "text": "Pet trening con iz tvojega laktata v krvi." },
  "explained": { "title": "Z razlago", "text": "Kaj tvoje številke pomenijo za trening." }
},
"offers": { "lab": { "featured": "Najboljša prva meritev: laktatni profil, {price} €", "performance": "Performance paket {price} € (posamično {separate} €)" } },
"faq": { "title": "Pred rezervacijo" },
"cta": {
  "title": "Spoznaj svoje cone pred naslednjim blokom.",
  "text": "Termin izbereš na spletu v minuti. Brezplačna odpoved do 24 ur prej.",
  "button": "Rezerviraj laktatni test"
}
```
❓ "Five training zones" assumes a 5-zone model: Jaka to confirm, or use "Your training zones" / "Tvoje trening cone".

### `lab.json`
```jsonc
// en
"hero": {
  "title": "Your watch estimates. The lab measures.",
  "subtitle": "Your thresholds, VO₂max and training zones, measured and explained. Lactate profile {price} €.",
  "primaryCta": "Book a lactate test",
  "secondaryCta": "Which test is right for me?",
  "trust": "VAT included · Free cancellation up to 24 h · Book online in a minute"
},
"proof": { "by": "Tests run by Jaka Marinko" },
"tests": { "separately": "{price} € if booked separately", "bestFirst": "Best first test" },
"what": { "hard": "Hard for the last few minutes, and you can stop at any time." },
"faq": { "title": "Questions before your test" },
"close": { "title": "Your zones are one test away.", "text": "Pick a time online in a minute.", "button": "Book a lactate test" }
// sl
"hero": {
  "title": "Ura ocenjuje. Laboratorij meri.",
  "subtitle": "Tvoja pragova, VO₂max in trening cone, izmerjeni in razloženi. Laktatni profil {price} €.",
  "primaryCta": "Rezerviraj laktatni test",
  "secondaryCta": "Katera meritev je prava zame?",
  "trust": "Z DDV · Brezplačna odpoved do 24 ur prej · Rezervacija na spletu v minuti"
},
"proof": { "by": "Meritve izvaja Jaka Marinko" },
"tests": { "separately": "Posamično {price} €", "bestFirst": "Najboljša prva meritev" },
"what": { "hard": "Zadnjih nekaj minut je naporno, ustaviš pa se lahko kadarkoli." },
"faq": { "title": "Vprašanja pred meritvijo" },
"close": { "title": "Do tvojih con te loči ena meritev.", "text": "Termin izbereš na spletu v minuti.", "button": "Rezerviraj laktatni test" }
```

### `coaching.json`
```jsonc
// en
"hero": {
  "title": "Your plan, built on your numbers, adjusted every week.",
  "subtitle": "Three packages from 25 € a month. Coaching adds Jaka's comments and a lab test every 3 months.",
  "primaryCta": "Tell me your goal",
  "secondaryCta": "Start with a lactate test"
},
"packages": { "includedTest": "Includes a lactate test every 3 months ({price} € each)" },
"whoDoesWhat": {
  "title": "Who does what",
  "plan": "Your plan is built on Jaka's method and adapts to your training every week.",
  "coach": "On Coaching and Elite, Jaka comments on your weeks and you talk regularly.",
  "messages": "Messages are always answered by a person."
},
"cta": { "button": "Tell me your goal" }
// sl
"hero": {
  "title": "Načrt po tvojih številkah, prilagojen vsak teden.",
  "subtitle": "Trije paketi od 25 € na mesec. Coaching doda Jakove komentarje in meritev vsake 3 mesece.",
  "primaryCta": "Napiši svoj cilj",
  "secondaryCta": "Začni z laktatnim testom"
},
"packages": { "includedTest": "Vključuje laktatni test vsake 3 mesece (vsak v vrednosti {price} €)" },
"whoDoesWhat": {
  "title": "Kdo naredi kaj",
  "plan": "Načrt temelji na Jakovi metodi in se vsak teden prilagodi tvojemu treningu.",
  "coach": "V paketih Coaching in Elite Jaka tvoje tedne komentira, redno pa se tudi pogovorita.",
  "messages": "Na sporočila vedno odgovori človek."
},
"cta": { "button": "Napiši svoj cilj" }
```
New FAQ keys under `coaching.faq`: `whoWrites`, `coachingFit`, `coachingTime`, `coachingStart`, `coachingCancel`. Text in §4.7.

### `landing.json`
```jsonc
// en  (pages.<slug>)
"lactate-test": {
  "hero": { "title": "Your training zones from a drop of blood.", "lead": "Both thresholds, the heart rate for every zone, and your results explained. 90 €." },
  "cta": "Book a lactate test",
  "close": { "title": "Know your thresholds before your next block.", "text": "Pick a time online in a minute. Free cancellation up to 24 hours before." }
},
"performance": {
  "hero": { "title": "Four tests, one visit. 250 € instead of 360 €.", "lead": "VO₂max, lactate profile, fuel use and body composition, with your zones. 360 € if booked separately." },
  "cta": "Book the Performance package",
  "close": { "title": "The full picture in one visit.", "text": "Book online and get the preparation by email. Free cancellation up to 24 hours before." }
},
"coaching": {
  "hero": { "title": "Coaching with Jaka, retested every 3 months.", "lead": "A plan that adapts every week, Jaka's comments on your weeks and a monthly call. 119 € a month." },
  "cta": "Tell me your goal",
  "close": { "title": "Start with your goal.", "text": "Tell us what you're training for. We reply within two working days." }
},
"race-preparation": {
  "hero": { "title": "Pick your race. We plan back from race day.", "lead": "A 12–16-week block for one race, with a lab test at the start and end. 490 €, paid once." },
  "cta": "Send your race date",
  "close": { "title": "Which race is next?", "text": "Send the date. We reply within two working days and plan back from it." }
}
// sl
"lactate-test": {
  "hero": { "title": "Tvoje trening cone iz kapljice krvi.", "lead": "Oba pragova, srčni utrip za vsako cono in razlaga rezultatov. 90 €." },
  "cta": "Rezerviraj laktatni test",
  "close": { "title": "Spoznaj svoja pragova pred naslednjim blokom.", "text": "Termin izbereš na spletu v minuti. Brezplačna odpoved do 24 ur prej." }
},
"performance": {
  "hero": { "title": "Štiri meritve, en obisk. 250 € namesto 360 €.", "lead": "VO₂max, laktatni profil, poraba goriva in telesna sestava, s tvojimi conami. Posamično 360 €." },
  "cta": "Rezerviraj Performance paket",
  "close": { "title": "Celotna slika v enem obisku.", "text": "Rezerviraj na spletu, navodila za pripravo dobiš po e-pošti. Brezplačna odpoved do 24 ur prej." }
},
"coaching": {
  "hero": { "title": "Coaching z Jakom in meritvijo vsake 3 mesece.", "lead": "Načrt, ki se prilagaja vsak teden, Jakovi komentarji na tvoje tedne in pogovor vsak mesec. 119 € na mesec." },
  "cta": "Napiši svoj cilj",
  "close": { "title": "Začni s svojim ciljem.", "text": "Napiši, za kaj treniraš. Odgovorimo v dveh delovnih dneh." }
},
"race-preparation": {
  "hero": { "title": "Izberi tekmo. Pripravo načrtujemo od starta nazaj.", "lead": "12–16-tedenski blok za eno tekmo, z meritvijo na začetku in na koncu. 490 €, plačaš enkrat." },
  "cta": "Pošlji datum tekme",
  "close": { "title": "Katera tekma je naslednja?", "text": "Pošlji datum. Odgovorimo v dveh delovnih dneh in načrtujemo nazaj od njega." }
}
```
Better: build the prices in the leads from the catalog with `{price}` instead of hard-coding them. New `landing.faq` keys: `fit`, `blood`, `duration`, `whatYouGet`, `whatYouGetLactate`, `whatYouGetPerformance`, `cancel`, `payment`, `retest`, `noCoach`, `raceWhatYouGet`, `raceFit`, `raceStart` (+ `sport`, `raceCancel` once decided). Text in §4.7.

### `contact.json`, `requests.json`, `site.json`, `booking.json`
```jsonc
// en
"contact": { "title": "Tell me your goal. I'll suggest where to start.", "text": "Lab tests, coaching or race preparation. I reply within two working days." },
"requests.form.messagePlaceholder": "Your goal, race date and how many hours a week you can train.",
"site.sticky": { "from": "Lactate profile {price} €", "button": "Book" },
"booking": { "title": "Book your test", "subtitle": "Pick a time. Free cancellation up to 24 hours before.", "time": { "nextFree": "Next free: {date}", "cancelNote": "Free cancellation up to 24 hours before." }, "review": { "payAndConfirm": "Pay {price} € and confirm" } }
// sl
"contact": { "title": "Napiši mi svoj cilj. Predlagal ti bom, kje začeti.", "text": "Meritve, trenerstvo ali priprava na tekmo. Odgovorim v dveh delovnih dneh." },
"requests.form.messagePlaceholder": "Tvoj cilj, datum tekme in koliko ur na teden lahko treniraš.",
"site.sticky": { "from": "Laktatni profil {price} €", "button": "Rezerviraj" },
"booking": { "title": "Rezerviraj meritev", "subtitle": "Izberi termin. Brezplačna odpoved do 24 ur prej.", "time": { "nextFree": "Prvi prosti termin: {date}", "cancelNote": "Brezplačna odpoved do 24 ur prej." }, "review": { "payAndConfirm": "Plačaj {price} € in potrdi" } }
```
Bug on live: the SL sticky bar shows "Meritve od 50 € €". The formatted price already carries "€", so either pass a plain number or drop "€" from the string.

---

## Sources
- Human Performance Centre, tests and prices: [human-performance.si](https://human-performance.si/), [lactate thresholds article](https://human-performance.si/blog/testiranje-del-3-laktatni-pragi)
- Aleksej Dolinšek, tests: [aleksejdolinsek.com/storitve/testiranja-meritve](https://aleksejdolinsek.com/storitve/testiranja-meritve/)
- Faculty of Sport, Institute of Sport, measurements: [fsp.uni-lj.si/institut-za-sport/meritve](https://www.fsp.uni-lj.si/institut-za-sport/meritve/), [recreational running](https://www.fsp.uni-lj.si/institut-za-sport/meritve/rekreacija/tek/)
- ZRS Koper, Ikarus lab services: [zrs-kp.si](https://www.zrs-kp.si/instituti-in-enote/laboratorij-ikarus/storitve/)
- Ljubljana Marathon 2024 registrations: [visitljubljana.com](https://www.visitljubljana.com/sl/obiskovalci/aktualno/pisma-iz-ljubljane/oktober-2024/na-nlb-ljubljanski-maraton-prijavljenih-vec-kot-15-000-tekacev); 2026 dates: [slovenia.info](https://www.slovenia.info/de/aktivitaten/veranstaltungen/24982-nlb-29th-ljubljana-marathon)
- Maraton Franja 2022–2025 report: [kdrog.si (PDF)](https://kdrog.si/wp-content/uploads/2025/10/MARATON-FRANJA-porocilo-2022-2025.pdf)
- Retest discount and bundles abroad: [GVSU](https://www.gvsu.edu/exercisescience/community-testing-program-165.htm), [University of Minnesota ICEPL](https://icepl.umn.edu/testing-services), [Westminster](https://www.westminster.ac.uk/business-services/health-and-fitness-services/sport-and-fitness-services/performance-packages-levels-1-3), [Newcastle](https://www.ncl.ac.uk/sport/performance/athleteservices/testing/)
- What a lactate test involves (US providers): [Intermountain](https://intermountainhealthcare.org/locations/live-well-centers/services/health-assessments/lactate-threshold), [Colorado State](https://www.chhs.colostate.edu/hes-hpcrl/performance-health-analysis/lactate-threshold/)
- Checkout abandonment, forced accounts, extra costs: [Baymard](https://baymard.com/blog/reduce-cart-abandonment)
- Late price reveal: [Hospitality Net](https://www.hospitalitynet.org/opinion/4069565.html); price shown vs hidden in B2B: [HockeyStack](https://hockeystack.com/lab-blog-posts/state-of-pricing-demo-case-study-pages); service booking rule of thumb: [SchedulingKit](https://www.schedulingkit.com/checklists/website-booking-optimization)
- Phone field tests: [NextAfter](https://www.nextafter.com/?p=13364), [Vital Design](https://vitaldesign.com/phone-number-form-field-case-study/), [Zuko](https://www.zuko.io/blog/optimizing-the-phone-number-field-on-forms)
- Fake timers, EU sweep: [Malwarebytes on the EC sweep](https://www.malwarebytes.com/blog/news/2023/01/european-commission-goes-after-dark-patterns-in-web-shops), [CDE Almería](https://www.cde.ual.es/en/european-commission-detects-manipulation-practices-in-148-of-the-399-online-stores-examined)
- Sticky mobile CTA tests: [cleancommit.io](https://cleancommit.io/ab-tests/sticky-mobile-add-to-cart-button/), [cleancommit.io (negative)](https://cleancommit.io/ab-tests/mobile-bottom-sticky-add-to-cart-button/), [Blend Commerce](https://blendcommerce.com/blogs/ab-tests-shopify/10-increase-in-conversion-rate)
- Landing page benchmarks, fitness: [Unbounce](https://unbounce.com/industry/fitness)
- CTA "my" vs "your": [ClickZ](https://clickz.com/?p=32596)
- Free consult as the primary coaching CTA (one example): [CTS / TrainRight](https://trainright.com/athletes)
