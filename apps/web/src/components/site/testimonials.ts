import type { Localized, Sport } from "@jakamarinko/types";
import { showPlaceholders } from "./site";

export type Testimonial = {
  id: string;
  // The athlete's name as they agreed to have it shown, e.g. "Ana N.".
  name: string;
  sport: Sport;
  quote: Localized;
  // Optional portrait under public/, at least 160 px square.
  photo?: string;
  // Written consent to publish the quote, name and photo. A quote without it is never shown.
  consent: true;
};

// Real quotes from real athletes, with their consent. Adding one is a data entry here; the home and coaching pages
// show them as soon as there is one.
export const testimonials: Testimonial[] = [];

// Fictional samples so the layout can be reviewed before real quotes exist. Shown only with
// NEXT_PUBLIC_SHOW_PLACEHOLDERS=true, always under "Sample athlete" and with a visible "Sample" badge. Never in
// production: presenting invented quotes as real customers is an unfair commercial practice.
const samples: (Omit<Testimonial, "name" | "consent"> & { sample: true })[] = [
  {
    id: "sample-runner",
    sport: "road_running",
    sample: true,
    quote: {
      en: "The lactate profile showed my easy runs were too fast. Slower easy days, and my 10 km finally moved.",
      sl: "Laktatni profil je pokazal, da so bili moji lahki teki prehitri. Počasnejši lahki dnevi in moj čas na 10 km se je končno premaknil.",
    },
  },
  {
    id: "sample-cyclist",
    sport: "road_cycling",
    sample: true,
    quote: {
      en: "I train eight hours a week, not twenty. The plan fits that, and every hour has a reason.",
      sl: "Treniram osem ur na teden, ne dvajset. Načrt je narejen za to in vsaka ura ima svoj namen.",
    },
  },
  {
    id: "sample-skier",
    sport: "ski_touring",
    sample: true,
    quote: {
      en: "Retesting after the winter showed exactly what changed. No more guessing whether the block worked.",
      sl: "Ponovna meritev po zimi je pokazala točno, kaj se je spremenilo. Nič več ugibanja, ali je blok deloval.",
    },
  },
];

export type ShownTestimonial = Omit<Testimonial, "consent" | "name"> & { name?: string; sample?: true };

// What the pages show: the real quotes, plus the samples in dev, e2e and screenshot builds.
export const shownTestimonials: ShownTestimonial[] = [...testimonials, ...(showPlaceholders ? samples : [])];
