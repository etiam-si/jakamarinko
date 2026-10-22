import { type LabTestId, labTests, type Locale, type OneOff, oneOffs, type PackageId, packages, separatePrice } from "@jakamarinko/types";
import { bookingHref, type photos } from "@/components/site/site";

// What a landing page sells: one item of the catalog (packages/types), with its price and features from there.
export type Offer = { kind: "test"; id: LabTestId } | { kind: "package"; id: PackageId } | { kind: "oneOff"; id: OneOff["id"] };

// The blocks a page is built from, in the order they appear. Each one ends in the page's single action.
export const blockNames = ["hero", "points", "proof", "price", "faq", "cta"] as const;
export type BlockName = (typeof blockNames)[number];

export type LandingPage = {
  // /<locale>/lp/<slug>; the same in both languages, so one ad link works for either.
  slug: string;
  offer: Offer;
  photo: keyof typeof photos;
  blocks: BlockName[];
  // Message keys of question/answer pairs: the page's own (landing.pages.<slug>.faq.x) or shared ones elsewhere.
  faq: string[];
};

// Every ad landing page. A new page is one entry here plus its texts in messages/{en,sl}/landing.json
// under pages.<slug> (meta, hero, points, cta): no new code.
export const landingPages: LandingPage[] = [
  {
    slug: "lactate-test",
    offer: { kind: "test", id: "lactate-profile" },
    photo: "trail",
    blocks: ["hero", "proof", "points", "price", "faq", "cta"],
    faq: [
      "landing.faq.fit",
      "landing.faq.whatYouGetLactate",
      "landing.faq.duration",
      "landing.faq.preparation",
      "landing.faq.cancel",
      "landing.faq.blood",
      "landing.faq.noCoach",
    ],
  },
  {
    slug: "performance",
    offer: { kind: "test", id: "performance" },
    photo: "redBull",
    blocks: ["hero", "price", "points", "proof", "faq", "cta"],
    faq: [
      "landing.faq.fit",
      "landing.faq.whatYouGetPerformance",
      "landing.faq.duration",
      "landing.faq.fasted",
      "landing.faq.cancel",
      "landing.faq.where",
    ],
  },
  {
    slug: "coaching",
    offer: { kind: "package", id: "coaching" },
    photo: "xcSki",
    blocks: ["hero", "points", "proof", "price", "faq", "cta"],
    faq: ["coaching.faq.coachingFit", "coaching.faq.whoWrites", "coaching.faq.coachingTime", "coaching.faq.coachingStart", "coaching.faq.labTestFirst"],
  },
  {
    slug: "race-preparation",
    offer: { kind: "oneOff", id: "race-preparation" },
    photo: "finish",
    blocks: ["hero", "points", "price", "proof", "faq", "cta"],
    faq: ["landing.faq.raceWhen", "landing.faq.raceWhatYouGet", "landing.faq.raceFit", "landing.faq.raceStart", "coaching.faq.devices"],
  },
];

export const landingPage = (slug: string) => landingPages.find((p) => p.slug === slug);

// The catalog item behind an offer, and where its one action goes: booking for a test, the contact form otherwise.
export function offerItem(offer: Offer, locale: Locale) {
  if (offer.kind === "test") {
    const test = labTests.find((t) => t.id === offer.id)!;
    return {
      name: test.name[locale],
      priceCents: test.priceCents,
      separateCents: separatePrice(test)?.separateCents,
      features: test.included[locale],
      monthly: false,
      href: bookingHref(test.id),
    };
  }
  const contact = { pathname: "/contact", query: { package: offer.id } } as const;
  if (offer.kind === "package") {
    const pkg = packages.find((p) => p.id === offer.id)!;
    return { name: pkg.name[locale], priceCents: pkg.priceCents, features: pkg.features[locale], monthly: true, href: contact };
  }
  const item = oneOffs.find((o) => o.id === offer.id)!;
  return { name: item.name[locale], priceCents: item.priceCents, description: item.description[locale], monthly: false, href: contact };
}
