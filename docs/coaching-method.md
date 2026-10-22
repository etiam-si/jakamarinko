# Coaching method

> **Status: draft v1 (2026-10-22), for Jaka's review.** Every place where Jaka's own preference should replace the default is marked **JAKA:** with a question. Until he answers, the defaults apply.

This is the method every plan, analysis and report follows, whether a coach writes it or the engine drafts it. It has two readers:
- **A coach who joins later.** Read sections 1–9 to coach the way Jaka does.
- **The engine.** Follow every section. Section 10 lists the hard rules; code checks every plan against them before a customer sees it ([`coaching-method/rules.yaml`](coaching-method/rules.yaml)). There is no human approval step, so those rules are the safety net.

Numbers here are defaults built on endurance science (sources in section 12). Where a number is a coaching convention rather than a research finding, the text says so.

**Contents:** 1 Principles · 2 Zones · 3 Periodization · 4 Load progression · 5 Per sport · 6 Athlete levels · 7 Taper and race week · 8 Red flags · 9 Retest rhythm · 10 Hard rules · 11 Slovenian glossary · 12 Sources

---

## 1. Principles

**What this coaching believes**
1. **Measure, then train.** Zones come from a lactate or VO₂max test, or at least a field test. Plans use the athlete's own numbers, not age formulas, whenever we have them.
2. **Consistency beats heroics.** Most improvement comes from months of mostly easy training without breaks for injury or illness. A plan that the athlete can repeat week after week beats a better-looking plan they can't keep.
3. **Most training is easy.** About 80 % or more of training time is below the first lactate threshold (LT1). Hard sessions are few, specific and actually hard [1, 2, 3].
4. **Hard days hard, easy days easy.** No grey middle: easy sessions stay in Z1–Z2 even when the athlete feels good.
5. **Individual.** The plan fits the athlete's goal, race calendar, available days and hours, history and life. Two athletes with the same goal get different plans.
6. **Long-term development.** Seasons build on each other. We protect next year's progress by not overreaching this year. Jaka's own Šmarna gora times (15:11 at 12 years to 12:33 at 19) are the model: steady progress, year after year.
7. **Recovery is training.** Rest days, recovery weeks, sleep and food are planned, not left over.
8. **Explain the why.** Every key session says what it is for, in one sentence.

**What it never does**
- Never trains through pain, illness or chest symptoms. Those stop the plan (section 8).
- Never increases load faster than section 4 allows, even if the athlete asks.
- Never makes up missed sessions by doubling up.
- Never gives medical, dietary or medication advice beyond "rest" and "see a doctor / physiotherapist / sports dietitian".
- Never promises a result, a time or a placing.
- Never uses weight loss as a training goal on its own, and never comments on an athlete's body.
- Never changes zones without a new test (section 9).
- Never claims Jaka did personal work he didn't do (the honesty limits in [product.md](product.md)).

**JAKA:** Is there anything you always or never do with athletes that's missing here?

---

## 2. Zones

### 2.1 The model: five zones anchored on LT1 and LT2
| Zone | Name | Where it sits | Feels like (RPE 1–10) | Typical lactate | Used for |
|---|---|---|---|---|---|
| **Z1** | Recovery | well below LT1 | 1–2, very easy | < 1.5 mmol/L | recovery sessions, warm-up, cool-down |
| **Z2** | Endurance | up to LT1 | 3–4, easy, can talk in full sentences | up to LT1 (~1.5–2.5) | most of the training: long and easy sessions |
| **Z3** | Tempo | between LT1 and LT2 | 5–6, comfortably hard, short sentences | between LT1 and LT2 (~2.5–4) | tempo, long climbs, race pace for long races |
| **Z4** | Threshold | around LT2 | 7–8, hard, a few words | around LT2 (~4) | threshold intervals |
| **Z5** | VO₂max | above LT2 | 9–10, very hard, no talking | > LT2 | short intervals of 1–6 min, hill repeats |

- **LT1 (aerobic threshold):** the first sustained rise in blood lactate above the resting level.
- **LT2 (anaerobic threshold, maximal lactate steady state):** the highest intensity where lactate still stays stable. Above it, fatigue builds quickly [4, 5].
- In the three-zone language of the research, our Z1–Z2 is "low", Z3 is "moderate", and Z4–Z5 is "high" [2, 19].

### 2.2 Zones from a lactate profile (the preferred source)
The lab test is a step test (treadmill for runners and ski athletes, bike ergometer for cyclists), with lactate, HR and speed or power measured at the end of every step.

1. **LT1** = the first step where lactate is 0.5 mmol/L or more above the athlete's lowest value in the test (baseline + 0.5).
2. **LT2** = the modified Dmax point: on the fitted lactate curve, the point farthest from the line joining LT1 to the last step [6]. If the curve can't be fitted (too few steps, a noisy curve), use the step at 4.0 mmol/L as a fallback and mark the test for coach review.
3. Read HR and speed or power at LT1 and LT2 from the curve (interpolate between steps).
4. Build the zones:

| Zone | Heart rate | Speed or power |
|---|---|---|
| Z1 | up to LT1 HR − 15 bpm | below 85 % of LT1 speed/power |
| Z2 | LT1 HR − 14 to LT1 HR | 85–100 % of LT1 |
| Z3 | LT1 HR + 1 to LT2 HR − 5 | LT1 to 95 % of LT2 |
| Z4 | LT2 HR − 4 to LT2 HR + 3 | 95–103 % of LT2 |
| Z5 | LT2 HR + 4 to HRmax | above 103 % of LT2 |

These offsets are a coaching convention built on [4, 7]; labs and coaches use slightly different ones.

- If LT2 HR − LT1 HR is less than 10 bpm, Z3 almost disappears. That usually means a test problem (steps too long or short, an athlete who started too hard). The test goes to coach review before zones are used.
- HRmax comes from the VO₂max test, or the highest HR from a race or all-out field test in the last 12 months. Never from a formula when a measured value exists.

**JAKA:** Which LT1 and LT2 methods do you use in your lab (baseline + 0.5, Dmax, modified Dmax, fixed 2/4 mmol)? And do you prefer different HR offsets for the zone edges?

### 2.3 Zones from a VO₂max test
- If the metabolic cart identifies the ventilatory thresholds, **VT1 replaces LT1 and VT2 replaces LT2**, and the table above applies. VT1 and VT2 are close to, but not the same as, LT1 and LT2 [5, 7].
- If only VO₂max and HRmax are known, use the %HRmax table in 2.4 with the measured HRmax.
- VO₂max adds two things the lactate test doesn't: **vVO₂max** (running speed at VO₂max) or **MAP** (maximal aerobic power on the bike). Z5 intervals of 2–5 min are prescribed at 90–100 % of vVO₂max or MAP.
- A combined test (VO₂max + lactate, or the Performance package) gives the best zones: lactate for LT1/LT2, gas exchange for VO₂max, vVO₂max/MAP and fat/carb use.

### 2.4 Without a lab test: field tests
A field test is good enough to start; a lab test should follow within 3 months for Coaching and Elite athletes. Field tests are done fresh (easy day before), after a 15-min warm-up with 3 short accelerations, on a course without stops.

| Sport | Test | LT2 estimate | LT1 estimate |
|---|---|---|---|
| Road running | 30-min solo run, as hard as can be held evenly [8] | average HR of the last 20 min; average pace of the 30 min | LT2 HR − 12 bpm, then checked with the talk test [9] |
| Mountain running, ski touring (summer) | 30-min steady uphill effort on a constant gradient (e.g. Šmarna gora from Tacen) | average HR of the last 20 min; vertical speed (m/h) | LT2 HR − 12 bpm |
| Ski touring (winter) | 30-min uphill on skins, steady gradient | as above, on skis | as above |
| Cross-country skiing | 30-min roller ski or ski test on a rolling loop, skating; or the uphill run test with poles | average HR of the last 20 min | LT2 HR − 12 bpm |
| Road cycling, MTB | 20-min all-out effort on a climb or trainer, after a 5-min hard effort and 10 min easy [10] | FTP = 95 % of 20-min power ≈ LT2 power; average HR of the last 10 min ≈ LT2 HR | LT2 HR − 15 bpm; power at ~75 % of FTP |

- **LT1 check (talk test):** at the estimated LT1 HR the athlete can still speak full sentences comfortably. If not, lower LT1 by 5 bpm [9].
- **No test at all (formula zones).** Use %HRmax with HRmax estimated as 208 − 0.7 × age [11]: Z1 < 72 %, Z2 72–82 %, Z3 82–87 %, Z4 87–92 %, Z5 > 92 % [19]. The formula is often 10+ bpm wrong for an individual, so RPE leads and HR is only a guide. Hard rule HR-13 allows only one intensity session a week and no Z5 until a real test is done.

**JAKA:** Would you rather require a field test before any plan starts, instead of allowing formula zones for the first weeks?

### 2.5 From zones to HR, pace and power per sport
A test gives zones for the sport it was done in. Heart rate at the same metabolic intensity differs between sports: it is usually a few beats lower in cycling than in running, and lower again in double poling than in skating [12]. Speed and power never transfer between sports.

| Sport | Lead metric for Z1–Z2 | Lead metric for Z3–Z5 | Zones from which test | HR shift vs a running test |
|---|---|---|---|---|
| Road running | HR (cap) | pace (min/km), on flat ground | running | 0 |
| Mountain running | HR | HR + vertical speed uphill (m/h); pace is meaningless on hills | running | 0 |
| Ski touring | HR | HR + vertical speed (m/h) | running (uphill) or ski touring field test | 0 |
| Cross-country skiing | HR | HR + RPE (snow and terrain change speed too much for pace) | running, or skiing field test | skating 0, classic −3, double poling −8 |
| Road cycling | power (W) or HR | power | cycling | −7 when only a running test exists |
| MTB | HR (power if a meter is fitted) | HR or power; RPE on technical terrain | cycling | −7 when only a running test exists |

- HR lags 1–3 minutes behind effort. For intervals shorter than 4 min, prescribe by pace, power, vertical speed or RPE, and use HR only for the recovery between reps.
- In heat, at altitude or when tired, HR drifts up at the same pace or power. Easy sessions follow HR (slow down); intervals follow pace or power, but stop the session if HR is far above the usual response (see section 8, RF-06).

**JAKA:** Do the HR shifts per sport match what you see in your athletes? Do you want cyclists and MTB riders to always test on the bike?

---

## 3. Periodization

### 3.1 The season
A season is planned backwards from the athlete's **A race** (the main goal; at most 2–3 per year). **B races** get a short taper; **C races** are hard training sessions.

| Phase | Length | Purpose | Intensity distribution |
|---|---|---|---|
| **Transition** | 2–4 weeks after the last A race | recover body and mind | unstructured, mostly Z1–Z2, other sports, no plan pressure |
| **Base** (general preparation) | 8–16 weeks | build volume, aerobic base, strength, technique | pyramidal: Z1–Z2 ≥ 80 %, some Z3, a little Z4 |
| **Build** (specific preparation) | 6–10 weeks | race-specific intensity and terrain | polarized: Z1–Z2 ~80 %, Z4–Z5 ~15–20 %, little Z3 (more Z3 for long races) |
| **Peak** | 2–3 weeks | race simulations, sharpening | polarized, volume slightly down |
| **Taper** | 1–3 weeks by race length (section 7) | arrive fresh | volume down 40–60 %, intensity kept |
| **Race** | race week | | |

- **Intensity distribution.** Both pyramidal and polarized distributions work. In trained athletes, polarized training gave somewhat bigger short-term gains in several studies [3, 13], and pyramidal is what many elite athletes do over a whole year [14]. Default: pyramidal in base, polarized in build and peak. For races longer than 3 hours (marathon, long trail, gran fondo, long ski touring), keep more Z3 in build because race pace sits there.
- **Beginners** stay pyramidal all year with one intensity session a week. Most of their progress comes from volume and consistency.
- **Two A races far apart** (e.g. a ski touring race in March and a mountain race in September): two shorter cycles, each with a short base, build and taper.

### 3.2 Blocks
- Default mesocycle: **3 loading weeks + 1 recovery week (3:1)**. Beginners and athletes aged 50 or more: **2:1** (convention; older athletes recover more slowly between hard sessions [15]).
- **Recovery week:** volume ≤ 70 % of the loading weeks, at most one intensity session (short), extra rest day allowed. Field tests and retests go at the end of a recovery week.
- Inside the loading weeks, volume rises by about 5–10 % a week, within the hard limits in section 4.
- **Competitive athletes in build** may use block periodization (a week with 3–5 intensity sessions of one type, then an easy week) [16]. This exceeds HR-06, so it is only planned by a coach, never by the engine.

**JAKA:** Do you use 3:1 by default, or something else? Do you use block periodization with your competitive athletes?

### 3.3 The week
- Build the week around the **key sessions** (intensity sessions and the long session), then fill with easy sessions.
- At least 48 hours between intensity sessions for beginner and intermediate athletes (HR-07).
- The long session usually goes on the weekend; an intensity session is not the day before it, except for advanced athletes practising race-specific fatigue.
- Strength goes on hard days (after the key session or later the same day), so easy days stay easy.

---

## 4. Load progression rules

Load is measured in **time** (minutes of endurance training), because time works the same in every sport. Running volume is also tracked on its own, because running causes the most overuse injuries.

| Rule | Default | Hard rule |
|---|---|---|
| Weekly volume | ≤ +10 % over the average of the last 3 normal weeks (at least +30 min allowed for small volumes) | HR-01 |
| Running volume | ≤ +10 % over its 3-week average (at least +20 min) | HR-02 |
| Longest session | ≤ +15 % over the longest of the last 6 weeks (at least +20 min) | HR-03 |
| Weekly ceiling per level | beginner 6 h, intermediate 10 h, advanced 15 h, competitive 25 h | HR-04 |
| Intensity sessions per week | beginner 1, intermediate 2, advanced 2 (3 in build/peak), competitive 3; races count | HR-06 |
| Hard days in a row | none below advanced; advanced and competitive at most one pair a week | HR-07 |
| Easy share | ≥ 75 % of weekly time in Z1–Z2 (weeks without a race) | HR-08 |
| Rest | one rest day a week (beginner, intermediate), one easy day (advanced, competitive) | HR-09 |
| Recovery week | after at most 3 loading weeks (2 for beginners and 50+) | HR-10 |
| Double days | none below advanced; advanced ≤ 2, competitive ≤ 4 a week | HR-11 |

**About the 10 % rule.** It is a convention, not a proven threshold. A trial in novice runners found no fewer injuries with a 10 % progression than with a faster one [17], while large jumps in running distance (above ~30 % in two weeks) were linked to more injuries in another study [18]. Sudden spikes in load raise injury and illness risk in general [20, 21]. We keep 10 % because it is simple to check and keeps us well away from the spikes that matter. The +30/+20 min floors exist because 10 % of a small volume is too little to make progress.

Analyses also track internal load as session RPE × minutes [36] and show it to coaches. It is not a hard rule: load ratios such as the acute:chronic workload ratio have conceptual problems that make fixed cut-offs unreliable [37].

**JAKA:** Is 10 % right for you, or would you allow more for athletes coming back to a volume they've done before?

### 4.1 After illness (pre-approved response PR-01, hard rule HR-14)
- **Above-the-neck symptoms only** (runny nose, sore throat), no fever: rest on the day it's reported. Then each day is rest or at most 45 min in Z1–Z2, no intensity, until the athlete reports feeling well. The "neck check" is a widely used clinical convention [22].
- **Fever, or symptoms below the neck** (chest cough, body aches, vomiting, diarrhoea): red flag RF-04. Full rest, the engine stops, the coach is alerted.
- **Return:** for as many days as the athlete was ill (at least 2, at most 7), only Z1–Z2 and at most 60 min a day. The first 7 days back have at most 70 % of the usual volume. Intensity returns after that.

### 4.2 After missed weeks (hard rule HR-16)
| Gap with no training | Next 7 days | Intensity |
|---|---|---|
| 1–6 days | normal plan, nothing made up | normal |
| 7–13 days | ≤ 80 % of the usual volume | none in the first 3 days |
| 14–27 days | ≤ 60 % of the usual volume | none in the first 7 days |
| 28 days or more | the coach restarts the plan | the coach decides |

Aerobic fitness drops noticeably after 2–4 weeks without training [23], and tendons and bones de-adapt too, so the return is gradual even when the athlete feels fresh.

### 4.3 After a race (pre-approved response PR-05, hard rule HR-15)
| Race duration | Day after | No intensity for |
|---|---|---|
| < 1 h | rest or ≤ 45 min Z1 | 3 days |
| 1–3 h | rest or ≤ 45 min Z1 | 5 days |
| 3–6 h | rest or ≤ 45 min Z1 | 10 days |
| > 6 h | rest or ≤ 45 min Z1 | 14 days |

Running races and steep downhills cause more muscle damage than cycling or skiing of the same duration; the coach may add rest after a long mountain race. **JAKA:** Are these days right for you? Would you separate running from cycling and skiing?

### 4.4 Daily adjustments
- Bad night or high fatigue in the check-in (1–2 days): the day's intensity session becomes easy and shorter (PR-02).
- Muscle soreness without pain: no intensity and no running that day (PR-03).
- Missed session: not made up (PR-04).

---

## 5. Per sport

Each sport has its own appendix with key sessions, seasonality, strength and technique work:

| Sport | Appendix | Season (Slovenia) |
|---|---|---|
| Ski touring (turno smučanje) | [ski-touring.md](coaching-method/ski-touring.md) | races Dec–Apr; dryland May–Nov |
| Cross-country skiing (tek na smučeh) | [xc-skiing.md](coaching-method/xc-skiing.md) | snow Dec–Mar; roller skis May–Nov |
| Mountain running (gorski tek) | [mountain-running.md](coaching-method/mountain-running.md) | races May–Oct |
| Road running (cestni tek) | [road-running.md](coaching-method/road-running.md) | spring (Mar–May) and autumn (Sep–Oct) races |
| Road cycling (cestno kolesarstvo) | [road-cycling.md](coaching-method/road-cycling.md) | races and gran fondos Apr–Sep |
| Mountain biking (gorsko kolesarstvo) | [mtb.md](coaching-method/mtb.md) | races Apr–Oct |

**Athletes with more than one sport** (common in Slovenia, and Jaka's own background): winter is ski touring or cross-country skiing, summer is mountain running or cycling. The A races decide the phases; the off-season sport is used for base volume. Summer roller skiing and uphill running with poles keep ski-specific fitness; winter skiing is excellent base for summer running with less impact. Running volume rules (HR-02) still apply when switching back to running in spring: the first 4 weeks of running after a ski winter start from the running volume of the winter, not from last summer's.

---

## 6. Athlete levels

The level is set at onboarding by the coach or from the questionnaire, and reviewed at every retest.

| | **Beginner** | **Intermediate** | **Advanced** | **Competitive** |
|---|---|---|---|---|
| Who | < 1 year of structured training, or returning after years off | 1–3 years of regular training, finishes races | 3+ years, trains most of the year, races for time | races for placings, national level or top age-group |
| Typical weekly volume | 3–5 h | 5–8 h | 8–13 h | 12–20+ h |
| Sessions per week | 3–4 | 4–6 | 5–8 | 7–12 |
| Intensity sessions | 1 | 2 | 2 (3 in build/peak) | 2–3 |
| Double days | no | no | up to 2 a week | up to 4 a week |
| Recovery week | every 3rd week | every 4th week | every 4th week | every 3rd–4th week |
| Rest | 2 rest days | 1–2 rest days | 1 rest or easy day | 1 easy day |
| Structure | simple, repeated weeks; same key sessions for 3–4 weeks | phases (base, build, taper) | full periodization | full periodization, coach-led changes |
| Focus | habit, easy volume, technique, strength basics | consistency, long session, threshold | specific intensity, race simulation | details: peaking, altitude, race tactics |
| Intervals | Z3–Z4, e.g. 4 × 5 min | Z4 and some Z5 | Z4 and Z5, race-specific | full range, longer total time at intensity |

- Age 50 or more: same level by experience, but a 2:1 block rhythm (HR-10) and at least 72 h between Z5 sessions (convention [15]).
- Juniors (16–18): plans only with a parent's consent (T03). Volume and intensity as one level lower than their experience suggests. Under 16: no automatic plans (HR-19).

**JAKA:** Do these levels and volumes match your athletes? How do you want juniors handled?

---

## 7. Taper and race week

Reduce volume by 40–60 %, keep intensity and keep most of the session frequency; 2 weeks is the most effective taper on average [24, 25]. Shorter races need a shorter taper.

| Race length | Examples | Taper | Volume in the last week | Intensity |
|---|---|---|---|---|
| < 1 h | 5–10 km run, vertical kilometre, cycling time trial, sprint XC race | 7–10 days | −40 to −50 % | keep 1–2 short sessions at race pace |
| 1–3 h | half marathon, XC 30 km, MTB XCO/XCM short, individual ski touring race | 10–14 days | −40 to −60 % | 1 session at race pace in race week |
| 3–6 h | marathon, long trail, gran fondo, long ski touring race | 14–21 days | −50 to −60 % | race-pace sessions shorten; last one 5–7 days before |
| > 6 h | ultra trail, ultra cycling | 14–21 days | −50 to −60 % | little intensity in the last 10 days |

**Race week (A race on Sunday; shift for other days):**
| Day | Short race (< 1 h) | Medium (1–3 h) | Long (> 3 h) |
|---|---|---|---|
| Mon | rest | rest | rest |
| Tue | 40–50 min with 4–5 × 2 min at race pace | 45–60 min with 3 × 5 min at race pace | 40–60 min Z2 |
| Wed | 30–40 min Z1–Z2 | 30–45 min Z2 | 45 min with 2 × 8 min at race pace |
| Thu | 40 min with 3 × 3 min at race pace | 40 min Z2 + 4 strides | 30–40 min Z1–Z2 |
| Fri | rest | rest | rest |
| Sat | 20–30 min Z1–Z2 + 3–4 × 20 s openers | 20–30 min + openers | 20–30 min + openers |
| Sun | race | race | race |

- The 2 days before an A or B race: no session over 60 min, at most 10 min in Z4–Z5 per day (HR-17).
- **B race:** 3–5 lighter days before, no full taper. **C race:** no taper; it replaces an intensity session.
- Race week has no new equipment, food or shoes. Carbohydrate loading for races over 90 min: the athlete's doctor or dietitian decides details; the plan only reminds.

**JAKA:** Is this the race week you use? Do you want specific openers per sport?

---

## 8. Red flags

A red flag **stops the engine for that athlete**: no automatic plan, analysis or report until a coach clears it (HR-18). The athlete gets a fixed, pre-written message (text in EN and SL in [rules.yaml](coaching-method/rules.yaml)), and the coach is alerted. Triggers are check-in answers, keywords in check-in notes and messages, and patterns in workout data. A keyword hit always opens the flag: a false alarm costs the coach a minute; a missed one can cost a lot more.

| ID | Red flag | Triggers (any one) | Training stops | Athlete is told | Coach alert | Who clears it |
|---|---|---|---|---|---|---|
| RF-01 | **Chest symptoms** | chest pain, pressure or tightness; palpitations or irregular heartbeat; breathlessness out of proportion to effort | all training | stop; call 112 if it's happening now or came at rest; see a doctor before training again | immediately | coach, after the athlete reports a doctor's assessment |
| RF-02 | **Fainting or near-fainting** | fainting, blacking out, dizziness during or right after exercise | all training | stop; see a doctor; 112 if it happens again or they feel unwell now | immediately | coach, after a doctor's assessment |
| RF-03 | **Head injury** | a fall or blow to the head; concussion symptoms | all training | no training until a doctor has checked them and they are symptom-free; 112 for worsening headache, vomiting, confusion, drowsiness [26] | immediately | coach, after a doctor clears a return |
| RF-04 | **Fever or illness below the neck** | fever ≥ 38 °C; chest cough, body aches, vomiting, diarrhoea | all training | full rest; doctor if fever lasts > 3 days or they feel worse; tell us when well | same day | coach, when the athlete feels well; then the return in 4.1 |
| RF-05 | **Pain or injury** | pain ≥ 4/10; any pain at the same spot on 2 check-ins in a row; pain that changes how they move; swelling; an acute injury | all training | don't train through pain; rest from what hurts; doctor or physio if they can't bear weight, it's swollen, or a bone hurts | same day | coach, who decides which sports and intensities are allowed |
| RF-06 | **Signs of overtraining** | fatigue ≥ 4/5 on 3 check-ins in a row; resting HR ≥ 7 bpm above the 14-day average on 3 days in a row; motivation ≤ 1/5 on 3 check-ins in a row; two intensity sessions in a row where targets couldn't be reached, with fatigue ≥ 3 [27] | intensity (only Z1–Z2 ≤ 45 min) | the body is asking for a break; easy and short, or rest | same day | coach, who sets the next week |
| RF-07 | **Signs of under-fuelling (REDs)** | period missing ≥ 3 months or newly irregular (only if the athlete chose to track it); unintended weight loss ≥ 5 % in 4 weeks; a bone stress injury; 3+ illnesses in 90 days; mentions of skipping meals or disordered eating [28] | intensity, no progression | can be a sign of too little energy; see a doctor or sports dietitian; plan stays easy | same day | coach, after talking with the athlete |
| RF-08 | **Mental health crisis** | any mention of suicide, self-harm or not wanting to live [29] | pause: no automatic output at all | thank you for telling us; 112 if in danger; Samarijan 116 123 any time | immediately | coach |
| RF-09 | **Pregnancy or a new medical condition** | pregnancy; a new diagnosis (heart, blood pressure, diabetes…); new medication such as beta blockers | pause | plan paused until the coach has looked at it with them | same day | coach, who updates the profile |

- **"Immediately"** means a push notification and email to the coach right away, any time of day. **"Same day"** means in the coach's alert list and the next morning's briefing at the latest.
- The chest and fainting rules follow the European sports cardiology guidelines: exercise-related chest pain, syncope and palpitations need medical assessment before training continues [30].
- Coaches never diagnose. Their job after a red flag: read the athlete's data and messages, contact the athlete, decide when and how training restarts, and write it down in the athlete's notes.

**JAKA:** Do you commit to contacting every athlete with a red flag, including those on the Plan package? The messages say "your coach will contact you" for RF-01 to RF-03 and RF-07 to RF-09.

---

## 9. Retest rhythm

| Who | Lab test due |
|---|---|
| Coaching | lactate every 3 months (included) |
| Elite | lactate every 2 months, Performance package twice a year (included) |
| Plan and test-only | suggested every 3–4 months; zones older than 12 months count as untested (HR-13) |

**A retest is also due:**
- at the start of each base phase and 3–4 weeks before an A race (to set race zones);
- after 3+ weeks off for injury or illness;
- when HR at the same pace or power has been 5+ bpm lower (fitness gained) or higher (fitness lost, or fatigue) in comparable easy sessions for 2 weeks;
- when the athlete keeps finishing intensity sessions far above or below the targets.

**Timing:** at the end of a recovery week, rested, no hard training in the 24 h before (the same preparation as the booking emails), same protocol and equipment as the last test.

**Updating zones:**
- A new lab test replaces the old anchors completely. No averaging with old tests.
- A field test updates the zones only for the sport it was done in, and only if there is no lab test from the last 3 months.
- If a field test and a recent lab test disagree by more than 5 bpm at LT2, the coach reviews before anything changes.
- New zones apply from the next plan week. The athlete gets a short explanation of what changed and why.

**JAKA:** Is 3–4 months right for Plan athletes, or should we push for more often in the first year?

---

## 10. Hard rules

The engine follows these rules, and code checks every plan against them before it is sent ([rules.yaml](coaching-method/rules.yaml), loaded by the rule check in T22). A plan that fails is regenerated once; if it fails again it goes to the coach and the customer sees "your coach is preparing this". Every rule can be checked from plan data alone.

1. **HR-01** Weekly volume ≤ max(110 % of the average of the last 3 normal weeks, that average + 30 min).
2. **HR-02** Weekly running volume ≤ max(110 % of its 3-week average, average + 20 min).
3. **HR-03** No session (races excluded) longer than max(115 % of the longest of the last 6 weeks, that + 20 min).
4. **HR-04** Weekly volume ≤ 6 h beginner, 10 h intermediate, 15 h advanced, 25 h competitive.
5. **HR-05** Sessions only on available days, never longer than the time available that day.
6. **HR-06** Intensity sessions per week ≤ 1 beginner, 2 intermediate, 2 advanced (3 in build/peak), 3 competitive. Races count.
7. **HR-07** No hard days in a row below advanced; advanced and competitive at most one pair a week, never three in a row.
8. **HR-08** ≥ 75 % of weekly endurance time in Z1–Z2 in weeks without a race.
9. **HR-09** At least one rest day a week (beginner, intermediate) or one easy day (advanced, competitive).
10. **HR-10** No more than 3 loading weeks in a row (2 for beginners and 50+); a recovery week is ≤ 70 % volume with ≤ 1 intensity session.
11. **HR-11** No double days below advanced; ≤ 2 a week advanced, ≤ 4 competitive.
12. **HR-12** Every session has minutes per zone that add up to its duration; every target lies inside the athlete's zones.
13. **HR-13** Formula zones, or zones older than 12 months: no Z5, at most one intensity session a week.
14. **HR-14** Illness reported: rest that day, then Z1–Z2 ≤ 45 min until well; then 2–7 days Z1–Z2 ≤ 60 min; first week back ≤ 70 % volume.
15. **HR-15** After a race: easy day after, then no intensity for 3 / 5 / 10 / 14 days by race length.
16. **HR-16** After a 7–13 day gap: ≤ 80 % volume, no intensity for 3 days; 14–27 days: ≤ 60 %, no intensity for 7 days; 28+ days: coach.
17. **HR-17** 2 days before an A or B race: sessions ≤ 60 min, ≤ 10 min Z4–Z5 per day. A race week ≤ 70 % of the pre-taper volume.
18. **HR-18** An open red flag stops all automatic output except its fixed message.
19. **HR-19** Under 16, or a medical condition from onboarding: no automatic plan; a coach plans.
20. **HR-20** Customer-facing text never mentions AI, algorithms or similar, and never claims to be handwritten (EN and SL word lists).

**Pre-approved responses** (the engine applies them without a coach): PR-01 mild illness, PR-02 poor sleep or high fatigue, PR-03 muscle soreness, PR-04 missed session, PR-05 race done. Details and messages are in [rules.yaml](coaching-method/rules.yaml).

**JAKA:** Each rule has its default marked in rules.yaml. Which numbers would you change?

---

## 11. Slovenian glossary

| English | Slovensko |
|---|---|
| LT1, aerobic threshold | aerobni prag (LT1) |
| LT2, anaerobic threshold | anaerobni prag (LT2) |
| maximal lactate steady state | maksimalno laktatno ravnovesje (MLSS) |
| VT1 / VT2, ventilatory thresholds | prvi / drugi ventilacijski prag |
| VO₂max | maksimalna poraba kisika (VO₂max) |
| vVO₂max, MAP | hitrost pri VO₂max, maksimalna aerobna moč |
| FTP | funkcionalna pražna moč (FTP) |
| lactate, lactate profile | laktat, laktatni profil |
| zone, training zones | cona, trening cone |
| recovery / endurance / tempo / threshold / VO₂max zone | regeneracijska / aerobna (osnovna vzdržljivost) / tempo / pražna / VO₂max cona |
| heart rate (HR), max HR, resting HR | srčni utrip (SU), maksimalni SU, SU v mirovanju |
| pace, speed, power | tempo (min/km), hitrost, moč (W) |
| vertical speed | vertikalna hitrost (m/h) |
| RPE, rating of perceived exertion | subjektivna ocena napora (RPE) |
| volume, intensity, load | obseg, intenzivnost, obremenitev |
| intensity distribution, polarized, pyramidal | porazdelitev intenzivnosti, polarizirana, piramidna |
| periodization | periodizacija |
| macrocycle, mesocycle, microcycle | makrocikel, mezocikel, mikrocikel |
| transition / base / build / peak phase | prehodno obdobje / bazna faza / faza gradnje / vrh forme |
| taper | tapering, zmanjšanje obremenitve pred tekmo |
| race week | tekmovalni teden |
| recovery week | teden razbremenitve |
| rest day, easy day | dan počitka, lahek dan |
| intensity session, key session | intenziven trening, ključni trening |
| long session | dolgi trening |
| intervals, recovery between reps | intervali, odmor med ponovitvami |
| strides, openers | stopnjevanja, aktivacija pred tekmo |
| warm-up, cool-down | ogrevanje, ohlajanje |
| strength training, plyometrics | trening moči, pliometrija |
| technique | tehnika |
| double day | dan z dvema treningoma |
| field test, retest | terenski test, ponovna meritev |
| running economy | ekonomičnost teka |
| fat and carbohydrate use | poraba maščob in ogljikovih hidratov (OH) |
| overreaching, overtraining | preobremenjenost, pretreniranost |
| relative energy deficiency in sport | relativno energijsko pomanjkanje v športu (REDs) |
| red flag | rdeča zastavica, opozorilni znak |
| check-in | dnevni vprašalnik |
| ski touring, skins, transition | turno smučanje, kože, menjava |
| cross-country skiing, classic, skating, double poling | tek na smučeh, klasična tehnika, drsalna tehnika, soročno odrivanje |
| roller skis, ski walking with poles | smučarske rolke, hoja s palicami (imitacija) |
| mountain running, vertical kilometre | gorski tek, vertikalni kilometer |
| road running | cestni tek |
| road cycling, gran fondo | cestno kolesarstvo, rekreativni maraton (gran fondo) |
| mountain biking (XCO, XCM) | gorsko kolesarstvo (olimpijski kros, maraton) |

**JAKA:** Which terms do you use with athletes? Some (FTP, tapering) are usually left in English.

---

## 12. Sources

1. Seiler S. What is best practice for training intensity and duration distribution in endurance athletes? *Int J Sports Physiol Perform.* 2010;5(3):276–291.
2. Seiler KS, Kjerland GØ. Quantifying training intensity distribution in elite endurance athletes: is there evidence for an "optimal" distribution? *Scand J Med Sci Sports.* 2006;16(1):49–56.
3. Stöggl T, Sperlich B. Polarized training has greater impact on key endurance variables than threshold, high intensity, or high volume training. *Front Physiol.* 2014;5:33.
4. Faude O, Kindermann W, Meyer T. Lactate threshold concepts: how valid are they? *Sports Med.* 2009;39(6):469–490.
5. Jones AM, Burnley M, Black MI, Poole DC, Vanhatalo A. The maximal metabolic steady state: redefining the "gold standard". *Physiol Rep.* 2019;7(10):e14098.
6. Bishop D, Jenkins DG, Mackinnon LT. The relationship between plasma lactate parameters, Wpeak and 1-h cycling performance in women. *Med Sci Sports Exerc.* 1998;30(8):1270–1275.
7. Jamnick NA, Pettitt RW, Granata C, Pyne DB, Bishop DJ. An examination and critique of current methods to determine exercise intensity. *Sports Med.* 2020;50(10):1729–1756.
8. Friel J. *The Triathlete's Training Bible*, 4th ed. VeloPress; 2016. (30-minute field test for threshold HR.)
9. Reed JL, Pipe AL. The talk test: a useful tool for prescribing and monitoring exercise intensity. *Curr Opin Cardiol.* 2014;29(5):475–480.
10. Allen H, Coggan A, McGregor S. *Training and Racing with a Power Meter*, 3rd ed. VeloPress; 2019.
11. Tanaka H, Monahan KD, Seals DR. Age-predicted maximal heart rate revisited. *J Am Coll Cardiol.* 2001;37(1):153–156.
12. Millet GP, Vleck VE, Bentley DJ. Physiological differences between cycling and running: lessons from triathletes. *Sports Med.* 2009;39(3):179–206.
13. Esteve-Lanao J, Foster C, Seiler S, Lucia A. Impact of training intensity distribution on performance in endurance athletes. *J Strength Cond Res.* 2007;21(3):943–949.
14. Stöggl TL, Sperlich B. The training intensity distribution among well-trained and elite endurance athletes. *Front Physiol.* 2015;6:295.
15. Tanaka H, Seals DR. Endurance exercise performance in Masters athletes: age-associated changes and underlying physiological mechanisms. *J Physiol.* 2008;586(1):55–63.
16. Issurin VB. New horizons for the methodology and physiology of training periodization. *Sports Med.* 2010;40(3):189–206.
17. Buist I, Bredeweg SW, van Mechelen W, et al. No effect of a graded training program on the number of running-related injuries in novice runners: a randomized controlled trial. *Am J Sports Med.* 2008;36(1):33–39.
18. Nielsen RO, Parner ET, Nohr EA, et al. Excessive progression in weekly running distance and risk of running-related injuries: an association which varies according to type of injury. *J Orthop Sports Phys Ther.* 2014;44(10):739–747.
19. Seiler S, Tønnessen E. Intervals, thresholds, and long slow distance: the role of intensity and duration in endurance training. *Sportscience.* 2009;13:32–53.
20. Soligard T, Schwellnus M, Alonso JM, et al. How much is too much? (Part 1) International Olympic Committee consensus statement on load in sport and risk of injury. *Br J Sports Med.* 2016;50(17):1030–1041.
21. Schwellnus M, Soligard T, Alonso JM, et al. How much is too much? (Part 2) International Olympic Committee consensus statement on load in sport and risk of illness. *Br J Sports Med.* 2016;50(17):1043–1052.
22. Eichner ER. Infection, immunity, and exercise: what to tell patients? *Phys Sportsmed.* 1993;21(1):125–135.
23. Mujika I, Padilla S. Detraining: loss of training-induced physiological and performance adaptations. Part I. *Sports Med.* 2000;30(2):79–87.
24. Bosquet L, Montpetit J, Arvisais D, Mujika I. Effects of tapering on performance: a meta-analysis. *Med Sci Sports Exerc.* 2007;39(8):1358–1365.
25. Mujika I, Padilla S. Scientific bases for precompetition tapering strategies. *Med Sci Sports Exerc.* 2003;35(7):1182–1187.
26. Patricios JS, Schneider KJ, Dvorak J, et al. Consensus statement on concussion in sport: the 6th International Conference on Concussion in Sport–Amsterdam, October 2022. *Br J Sports Med.* 2023;57(11):695–711.
27. Meeusen R, Duclos M, Foster C, et al. Prevention, diagnosis, and treatment of the overtraining syndrome: joint consensus statement of the ECSS and the ACSM. *Med Sci Sports Exerc.* 2013;45(1):186–205.
28. Mountjoy M, Ackerman KE, Bailey DM, et al. 2023 International Olympic Committee's (IOC) consensus statement on Relative Energy Deficiency in Sport (REDs). *Br J Sports Med.* 2023;57(17):1073–1097.
29. Reardon CL, Hainline B, Aron CM, et al. Mental health in elite athletes: International Olympic Committee consensus statement. *Br J Sports Med.* 2019;53(11):667–699.
30. Pelliccia A, Sharma S, Gati S, et al. 2020 ESC Guidelines on sports cardiology and exercise in patients with cardiovascular disease. *Eur Heart J.* 2021;42(1):17–96.
31. Rønnestad BR, Mujika I. Optimizing strength training for running and cycling endurance performance: a review. *Scand J Med Sci Sports.* 2014;24(4):603–612.
32. Sandbakk Ø, Holmberg HC. Physiological capacity and training routines of elite cross-country skiers: approaching the upper limits of human endurance. *Int J Sports Physiol Perform.* 2017;12(8):1003–1011.
33. Duc S, Cassirame J, Durand F. Physiology of ski mountaineering racing. *Int J Sports Med.* 2011;32(11):856–863.
34. Vernillo G, Giandolini M, Edwards WB, et al. Biomechanics and physiology of uphill and downhill running. *Sports Med.* 2017;47(4):615–629.
35. Daniels J. *Daniels' Running Formula*, 3rd ed. Human Kinetics; 2014.
36. Foster C, Florhaug JA, Franklin J, et al. A new approach to monitoring exercise training. *J Strength Cond Res.* 2001;15(1):109–115.
37. Impellizzeri FM, Tenan MS, Kempton T, Novak A, Coutts AJ. Acute:chronic workload ratio: conceptual issues and fundamental pitfalls. *Int J Sports Physiol Perform.* 2020;15(6):907–913.

**Conventions without a single source** (marked as such in the text): the HR offsets for zone edges, the +30/+20 min floors, the level ceilings, the race recovery days, and the gap return percentages. They are conservative defaults for Jaka to confirm or change.
