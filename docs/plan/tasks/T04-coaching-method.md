# T04 Coaching method

**Goal:** the written method that every AI feature and every coach follows, so plans are "Jaka's", not generic. Written by Claude, reviewed by Jaka. This is the most important input for phase 2.

**Depends on:** nothing (can start right away). **Blocks:** T21, T23 and all phase 3 AI work.

**Owns:** `docs/coaching-method.md`, `docs/coaching-method/` (per-sport appendices if it gets long).

## Build
Write for two readers: a coach who joins later, and an AI that drafts plans. Be specific (numbers, rules), not motivational. Use established endurance science and cite the sources in a short list at the end. Cover:
1. **Principles:** what this coaching believes (data, consistency, individual approach, long-term development), and what it never does.
2. **Zones:** the model used (e.g. 5 zones anchored on LT1/LT2 from the lactate test). How zones come from a lactate profile, from VO₂max, and what to do without a lab test (field tests per sport). How zones map to HR, pace and power per sport.
3. **Periodization:** season structure (base, build, peak, taper, transition), block lengths, recovery weeks, intensity distribution (e.g. polarized vs pyramidal, and when to use which).
4. **Load progression rules:** maximum weekly volume increase, maximum intensity sessions per week by level, what to do after illness, missed weeks, or a race.
5. **Per sport:** ski touring, cross-country skiing, mountain running, road running, road cycling, mountain biking. Typical key sessions, seasonality (e.g. ski seasons), strength and technique work.
6. **Athlete levels:** beginner, intermediate, advanced and competitive. What changes in volume, intensity and structure.
7. **Taper and race week** per race length.
8. **Red flags:** symptoms and patterns that stop the plan and go to a human (pain, illness, chest symptoms, overtraining signs, under-fuelling signs), with the exact action.
9. **Retest rhythm:** when a new lab test is due, and how zones are updated.
10. **Hard rules**, in a short numbered list. The engine follows them, and **code checks every plan against them before it is sent** (there is no human approval step, so these rules are the safety net). Each rule must be checkable from plan data alone, e.g. "weekly volume ≤ 110 % of the average of the last 3 weeks", "no two threshold sessions on consecutive days below level advanced". Include the pre-approved responses (e.g. "illness reported → rest day, then easy days until the athlete reports feeling well").

## Acceptance criteria
- [ ] Every rule in section 10 is concrete enough to write a unit test for: the PR includes the rules as a machine-readable list (`docs/coaching-method/rules.yaml`) that the rule check (T22) will load.
- [ ] Every sport in the product has its own section.
- [ ] Red flags each have an action, not just a description.
- [ ] Sources are listed; nothing presented as fact without a basis.
- [ ] Written in English, with a Slovenian glossary of terms (e.g. LT1 = aerobni prag).

## Out of scope
Code. The zones library is T21.

## Needs from the user
Jaka's review. Mark every place where his own preference should override the default as `JAKA:`, with the question.
