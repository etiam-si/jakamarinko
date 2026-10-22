# Shot list: photos the site still needs

A brief for the photographer. Every slot below shows a designed placeholder in dev and screenshot builds
(`NEXT_PUBLIC_SHOW_PLACEHOLDERS=true`); in production it falls back to the photo named here, or the section does
without. The descriptions are also in `apps/web/messages/{en,sl}/site.json` under `shots`; the slots are in
`apps/web/src/components/site/photo-slot.tsx`.

General: real people, real lab, no stock. Deliver the originals at **at least 1600 px on the short side** (the site
needs about 2× the shown width for sharp phone screens; today's photos are 460–1200 px, which caps how big they can
be shown). Natural light where possible, no heavy filters: the site tints group photos in the brand's spruce itself.

| Slot | Page | Ratio | The shot | Until then |
|---|---|---|---|---|
| `labHero` | Lab tests, hero | 4:5 portrait | An athlete mid-test on the treadmill, mask on, with Jaka beside them reading the screen. Side view, cool lab light. | An illustrated lactate curve |
| `labSample` | Lab tests, "What happens in a test" | 3:2 | Close-up of a fingertip lactate sample during a test: gloved hands, the analyser soft in the background. Shallow depth of field. | Nothing (the steps stand alone) |
| `coachingHero` | Coaching, hero | 4:5 portrait | Jaka and an athlete at a laptop going through a plan and training zones, both in training kit. Over the shoulder, warm indoor light. | Cross-country skiing photo |
| `aboutPortrait` | About, hero | 4:5 portrait | Jaka, waist up, in a training top on a mountain trail in soft evening light, looking at the camera. | Mountain running photo |
| `contactLab` | Contact, beside the form (large screens) | 4:5 portrait | The testing room in Spodnje Pirnice, tidy and empty: treadmill, bike and analyser, daylight, shot from the door. | U20 European Championships photo |

Also useful, no slot yet:
- The building or entrance in Spodnje Pirnice, so people recognise it when they arrive (3:2).
- Higher-resolution originals of the existing race photos (Red Bull 400, World and European Championships, ski
  mountaineering, cross-country skiing): the current files are small and soften on phones.
