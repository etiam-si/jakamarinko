// Lab tests, sessions and packages, in both languages. The booking system seeds its service types from this (T07),
// and the site shows it (T08). Prices are the launch prices from docs/product.md, in euro cents; the database
// copy is what can change later without code.
import type { Locale } from "./enums";

export type Localized = Record<Locale, string>;
export type LocalizedList = Record<Locale, string[]>;

export const labTestIds = [
  "vo2max",
  "lactate-profile",
  "vo2max-lactate",
  "fat-carb",
  "running-economy",
  "anthropometry",
  "performance",
  "runner",
  "long-distance",
  "season",
  "lactate-retest",
] as const;
export type LabTestId = (typeof labTestIds)[number];

export const sessionIds = ["personal-training"] as const;
export type SessionId = (typeof sessionIds)[number];

// Anything a customer books into a slot (service_types in T07).
export type ServiceId = LabTestId | SessionId;

export type LabTest = {
  id: LabTestId;
  kind: "lab_test";
  durationMin: number;
  priceCents: number;
  name: Localized;
  // What it measures, in plain words.
  description: Localized;
  preparation: LocalizedList;
  included: LocalizedList;
  // For combined tests: the single tests it contains.
  contains?: LabTestId[];
  // For bundles and offers: what the same costs booked one by one, at today's single prices (defaults to
  // `contains`). The site shows the sum and the saving; it's a comparison with our own prices, not a reduction.
  comparedTo?: LabTestId[];
};

export type Session = {
  id: SessionId;
  kind: "session";
  durationMin: number;
  priceCents: number;
  name: Localized;
  description: Localized;
};

// The two standard preparations; the site shows which one a test needs and lists them once.
export const restedAndFed: LocalizedList = {
  en: [
    "No hard or long training in the 24 hours before the test.",
    "Eat a light meal 2–3 hours before and drink as usual.",
    "Bring training clothes and the shoes you train in.",
    "If you are ill or injured, move the test to another day.",
  ],
  sl: [
    "24 ur pred meritvijo brez napornega ali dolgega treninga.",
    "2–3 ure prej pojej lahek obrok in pij kot običajno.",
    "Prinesi športna oblačila in obutev, v kateri treniraš.",
    "Če si bolan ali poškodovan, meritev prestavi na drug dan.",
  ],
};

export const restedAndFasted: LocalizedList = {
  en: [
    "No hard or long training in the 24 hours before the test.",
    "Come fasted: nothing to eat for at least 8 hours before, water only.",
    "Bring training clothes and the shoes you train in.",
    "If you are ill or injured, move the test to another day.",
  ],
  sl: [
    "24 ur pred meritvijo brez napornega ali dolgega treninga.",
    "Pridi na tešče: vsaj 8 ur prej nič hrane, samo voda.",
    "Prinesi športna oblačila in obutev, v kateri treniraš.",
    "Če si bolan ali poškodovan, meritev prestavi na drug dan.",
  ],
};

const explained: Localized = { en: "Your results explained", sl: "Razlaga rezultatov" };

export const labTests: LabTest[] = [
  {
    id: "vo2max",
    kind: "lab_test",
    durationMin: 45, // estimate
    priceCents: 9000,
    name: { en: "VO₂max test", sl: "Meritev VO₂max" },
    description: {
      en: "Your maximal oxygen uptake: how much oxygen your body can use at full effort, the ceiling of your aerobic engine. You do an incremental test to exhaustion while breathing through a mask that measures the air you breathe in and out.",
      sl: "Maksimalna poraba kisika: koliko kisika lahko tvoje telo porabi pri največjem naporu, torej zgornja meja tvojega aerobnega motorja. Opraviš stopnjevalni test do izčrpanosti, med katerim dihaš skozi masko, ki meri vdihani in izdihani zrak.",
    },
    preparation: restedAndFed,
    included: {
      en: ["Your VO₂max and maximum heart rate", "Your speed or power at VO₂max", explained.en],
      sl: ["Tvoj VO₂max in maksimalni srčni utrip", "Hitrost ali moč pri VO₂max", explained.sl],
    },
  },
  {
    id: "lactate-profile",
    kind: "lab_test",
    durationMin: 60, // estimate
    priceCents: 9000,
    name: { en: "Lactate profile", sl: "Laktatni profil" },
    description: {
      en: "How your blood lactate rises with effort. You run or ride in steps that get harder, with a drop of blood from your fingertip or earlobe after each. The curve shows your aerobic (LT1) and anaerobic (LT2) thresholds, the surest basis for training zones.",
      sl: "Kako narašča laktat v krvi, ko se napor povečuje. Tečeš ali kolesariš v vse težjih stopnjah, po vsaki pa se odvzame kapljica krvi iz prsta ali ušesne mečice. Krivulja pokaže aerobni (LT1) in anaerobni prag (LT2), najzanesljivejšo podlago za trening cone.",
    },
    preparation: restedAndFed,
    included: {
      en: [
        "Aerobic (LT1) and anaerobic (LT2) threshold, with heart rate and pace or power at each",
        "Your personal training zones",
        explained.en,
      ],
      sl: [
        "Aerobni (LT1) in anaerobni prag (LT2) s srčnim utripom in tempom ali močjo pri vsakem",
        "Tvoje osebne trening cone",
        explained.sl,
      ],
    },
  },
  {
    id: "vo2max-lactate",
    kind: "lab_test",
    durationMin: 75, // estimate
    priceCents: 15000,
    name: { en: "VO₂max + lactate", sl: "VO₂max + laktat" },
    description: {
      en: "Both tests in one session: your lactate thresholds and your VO₂max together, for the most complete picture of your endurance and the most accurate training zones.",
      sl: "Obe meritvi v enem obisku: laktatna pragova in VO₂max skupaj, za najbolj celovito sliko tvoje vzdržljivosti in najnatančnejše trening cone.",
    },
    preparation: restedAndFed,
    included: {
      en: [
        "Aerobic (LT1) and anaerobic (LT2) threshold, with heart rate and pace or power at each",
        "Your VO₂max and maximum heart rate",
        "Your personal training zones",
        explained.en,
      ],
      sl: [
        "Aerobni (LT1) in anaerobni prag (LT2) s srčnim utripom in tempom ali močjo pri vsakem",
        "Tvoj VO₂max in maksimalni srčni utrip",
        "Tvoje osebne trening cone",
        explained.sl,
      ],
    },
    contains: ["vo2max", "lactate-profile"],
  },
  {
    id: "fat-carb",
    kind: "lab_test",
    durationMin: 60, // estimate
    priceCents: 13000,
    name: { en: "Fat and carbohydrate use", sl: "Analiza porabe maščob in OH" },
    description: {
      en: "How much of your energy comes from fat and how much from carbohydrates at each intensity, measured from the air you breathe out. It shows where you burn the most fat, which matters for long races and what you eat during them.",
      sl: "Koliko energije pri vsaki intenzivnosti dobiš iz maščob in koliko iz ogljikovih hidratov (OH), izmerjeno iz izdihanega zraka. Pokaže, kje porabiš največ maščob, kar je pomembno za dolge tekme in prehrano med njimi.",
    },
    preparation: restedAndFasted,
    included: {
      en: [
        "Fat and carbohydrate use at each intensity",
        "The intensity of your highest fat use (FATmax)",
        explained.en,
      ],
      sl: [
        "Poraba maščob in ogljikovih hidratov pri vsaki intenzivnosti",
        "Intenzivnost največje porabe maščob (FATmax)",
        explained.sl,
      ],
    },
  },
  {
    id: "running-economy",
    kind: "lab_test",
    durationMin: 45, // estimate
    priceCents: 8000,
    name: { en: "Running economy", sl: "Ekonomičnost teka" },
    description: {
      en: "How much oxygen you need to run at a given speed. Two runners with the same VO₂max can race very differently: the more economical one uses less energy at the same pace. Measured at several steady, submaximal speeds.",
      sl: "Koliko kisika potrebuješ za tek pri določeni hitrosti. Tekača z enakim VO₂max lahko tekmujeta zelo različno: ekonomičnejši pri istem tempu porabi manj energije. Meri se pri več enakomernih, submaksimalnih hitrostih.",
    },
    preparation: restedAndFed,
    included: {
      en: ["Oxygen cost at each tested speed", explained.en],
      sl: ["Poraba kisika pri vsaki izmerjeni hitrosti", explained.sl],
    },
  },
  {
    id: "anthropometry",
    kind: "lab_test",
    durationMin: 30, // estimate
    priceCents: 5000,
    name: { en: "Anthropometry", sl: "Antropometrija" },
    description: {
      en: "Body measurements: height, body mass and body composition. A baseline for following how your body changes over a season.",
      sl: "Telesne mere: višina, telesna masa in telesna sestava. Izhodišče za spremljanje, kako se tvoje telo spreminja skozi sezono.",
    },
    preparation: {
      en: ["No special preparation needed."],
      sl: ["Posebna priprava ni potrebna."],
    },
    included: {
      en: ["Height, body mass and body composition", explained.en],
      sl: ["Višina, telesna masa in telesna sestava", explained.sl],
    },
  },
  {
    id: "performance",
    kind: "lab_test",
    durationMin: 120, // estimate
    priceCents: 25000,
    name: { en: "Performance package", sl: "Performance paket" },
    description: {
      en: "The full picture in one visit: VO₂max, lactate profile, fat and carbohydrate use and anthropometry, with a personal explanation of the results and your training zones.",
      sl: "Celotna slika v enem obisku: VO₂max, laktatni profil, poraba maščob in OH ter antropometrija, z individualno razlago rezultatov in določitvijo trening con.",
    },
    // It includes the fat and carbohydrate test, which needs a fasted athlete.
    preparation: restedAndFasted,
    included: {
      en: [
        "VO₂max",
        "Lactate profile",
        "Fat and carbohydrate use",
        "Anthropometry",
        "A personal explanation of your results",
        "Your training zones",
      ],
      sl: [
        "VO₂max",
        "Laktatni profil",
        "Analiza porabe maščob",
        "Antropometrija",
        "Individualna razlaga",
        "Določitev trening con",
      ],
    },
    contains: ["vo2max", "lactate-profile", "fat-carb", "anthropometry"],
  },
  // Bundles and the retest (docs/content/conversion-playbook.md §5.1; prices for the owner to confirm).
  {
    id: "runner",
    kind: "lab_test",
    durationMin: 120, // estimate
    priceCents: 18000,
    name: { en: "Runner bundle", sl: "Tekaški paket" },
    description: {
      en: "Your thresholds, how economically you run, and your body composition. One visit.",
      sl: "Tvoja pragova, ekonomičnost teka in telesna sestava. En obisk.",
    },
    preparation: restedAndFed,
    included: {
      en: ["Lactate profile and your training zones", "Running economy", "Anthropometry", explained.en],
      sl: ["Laktatni profil in tvoje trening cone", "Ekonomičnost teka", "Antropometrija", explained.sl],
    },
    contains: ["lactate-profile", "running-economy", "anthropometry"],
  },
  {
    id: "long-distance",
    kind: "lab_test",
    durationMin: 90, // estimate
    priceCents: 18000,
    name: { en: "Long-distance bundle", sl: "Paket za dolge tekme" },
    description: {
      en: "Your thresholds and how you burn fat and carbs at every pace, for long races and fuelling.",
      sl: "Tvoja pragova in poraba maščob ter OH pri vsakem tempu, za dolge tekme in prehrano med njimi.",
    },
    preparation: restedAndFasted,
    included: {
      en: ["Lactate profile and your training zones", "Fat and carbohydrate use, with FATmax", explained.en],
      sl: ["Laktatni profil in tvoje trening cone", "Poraba maščob in OH, s FATmax", explained.sl],
    },
    contains: ["lactate-profile", "fat-carb"],
  },
  {
    id: "season",
    kind: "lab_test",
    // The bookable visit is the Performance one; Jaka books the two retests with you on site (owner decision open).
    durationMin: 120, // estimate
    priceCents: 35000,
    name: { en: "Season pack", sl: "Sezonski paket" },
    description: {
      en: "The Performance package now, and two lactate retests within 6 months to see what changed.",
      sl: "Performance paket zdaj in dva ponovna laktatna testa v 6 mesecih, da vidiš, kaj se je spremenilo.",
    },
    preparation: restedAndFasted,
    included: {
      en: ["The Performance package", "Two lactate retests within 6 months", "Your zones updated after each retest"],
      sl: ["Performance paket", "Dva ponovna laktatna testa v 6 mesecih", "Posodobljene cone po vsakem testu"],
    },
    contains: ["vo2max", "lactate-profile", "fat-carb", "anthropometry"],
    comparedTo: ["performance", "lactate-profile", "lactate-profile"],
  },
  {
    id: "lactate-retest",
    kind: "lab_test",
    durationMin: 60, // estimate
    priceCents: 7000,
    name: { en: "Lactate retest", sl: "Ponovni laktatni test" },
    description: {
      en: "Within 4 months of a test with us. See what your training changed.",
      sl: "V 4 mesecih po meritvi pri nas. Poglej, kaj je spremenil tvoj trening.",
    },
    preparation: restedAndFed,
    included: {
      en: ["Both thresholds again, next to your last test", "Your training zones updated", explained.en],
      sl: ["Oba pragova znova, ob tvoji zadnji meritvi", "Posodobljene trening cone", explained.sl],
    },
    comparedTo: ["lactate-profile"],
  },
];

// What a bundle or offer costs booked one by one, and what it saves; null for a single test.
export function separatePrice(test: LabTest): { separateCents: number; savingCents: number } | null {
  const parts = test.comparedTo ?? test.contains;
  if (!parts) return null;
  const separateCents = parts.reduce((sum, id) => sum + labTests.find((t) => t.id === id)!.priceCents, 0);
  return { separateCents, savingCents: separateCents - test.priceCents };
}

export const sessions: Session[] = [
  {
    id: "personal-training",
    kind: "session",
    durationMin: 60, // estimate
    priceCents: 4500,
    name: { en: "Personal training session", sl: "Osebni trening" },
    description: {
      en: "One-to-one training with Jaka: technique, a key workout or a specific goal you want to work on.",
      sl: "Individualni trening z Jakom: tehnika, ključni trening ali konkreten cilj, na katerem želiš delati.",
    },
  },
];

// Bought once, not booked into a slot.
export type OneOff = {
  id: "personal-training-10" | "race-preparation";
  priceCents: number;
  name: Localized;
  description: Localized;
};

export const oneOffs: OneOff[] = [
  {
    id: "personal-training-10",
    // launch price, set by us, not from product.md: 10 × 45 € less ~11 %
    priceCents: 40000,
    name: { en: "10 personal training sessions", sl: "Paket 10 osebnih treningov" },
    description: {
      en: "Ten one-to-one sessions at a lower price per session.",
      sl: "Deset individualnih treningov po nižji ceni na trening.",
    },
  },
  {
    id: "race-preparation",
    // launch price, set by us, not from product.md: ~4 months of Coaching, with two lactate tests
    priceCents: 49000,
    name: { en: "Race preparation", sl: "Priprava na tekmo" },
    description: {
      en: "A 12–16-week training block for one race, with a lab test at the start and at the end to measure your progress. Paid once.",
      sl: "12–16-tedenski trening blok za eno tekmo, z laboratorijsko meritvijo na začetku in na koncu, ki pokažeta tvoj napredek. Plačaš enkrat.",
    },
  },
];

export const packageIds = ["plan", "coaching", "elite"] as const;
export type PackageId = (typeof packageIds)[number];

// A package gives `count` bookings of `serviceId` every `everyMonths` months.
export type CreditRule = { serviceId: ServiceId; count: number; everyMonths: number };

export type Package = {
  id: PackageId;
  priceCents: number;
  interval: "month";
  // Paying a year up front: 2 months free.
  yearlyPriceCents: number;
  minimumMonths: number;
  featured: boolean;
  credits: CreditRule[];
  labDiscountPercent: number;
  name: Localized;
  audience: Localized;
  features: LocalizedList;
};

export const packages: Package[] = [
  {
    id: "plan",
    priceCents: 2500,
    interval: "month",
    yearlyPriceCents: 25000,
    minimumMonths: 1,
    featured: false,
    credits: [],
    labDiscountPercent: 20,
    name: { en: "Plan", sl: "Plan" },
    audience: {
      en: "For athletes who want structure at a low price, often after a lab test.",
      sl: "Za športnike, ki želijo strukturo za malo denarja, pogosto po laboratorijski meritvi.",
    },
    features: {
      en: [
        "A training plan built on Jaka's method that adapts to your training every week",
        "Analysis of every workout and a weekly summary, within minutes",
        "20 % off lab tests",
        "Messages with your coach in the app, answered within 72 hours",
      ],
      sl: [
        "Načrt treninga po Jakovi metodi, ki se vsak teden prilagodi tvojemu treningu",
        "Analiza vsakega treninga in tedenski povzetek, v nekaj minutah",
        "20 % popusta na laboratorijske meritve",
        "Sporočila s trenerjem v aplikaciji, odgovor v 72 urah",
      ],
    },
  },
  {
    id: "coaching",
    priceCents: 11900,
    interval: "month",
    yearlyPriceCents: 119000,
    minimumMonths: 3,
    featured: true,
    credits: [{ serviceId: "lactate-profile", count: 1, everyMonths: 3 }],
    labDiscountPercent: 0,
    name: { en: "Coaching", sl: "Coaching" },
    audience: {
      en: "For athletes with a goal who want Jaka as their coach.",
      sl: "Za športnike s ciljem, ki želijo Jaka za trenerja.",
    },
    features: {
      en: [
        "A training plan built on Jaka's method that adapts to your training every week",
        "Jaka's personal comments on your training weeks",
        "Analysis of every workout and a weekly summary, within minutes",
        "A lactate test every 3 months, included",
        "Replies within 48 hours and a call every month",
      ],
      sl: [
        "Načrt treninga po Jakovi metodi, ki se vsak teden prilagodi tvojemu treningu",
        "Jakovi osebni komentarji na tvoje trening tedne",
        "Analiza vsakega treninga in tedenski povzetek, v nekaj minutah",
        "Laktatni test vsake 3 mesece, vključen v ceno",
        "Odgovor v 48 urah in pogovor vsak mesec",
      ],
    },
  },
  {
    id: "elite",
    priceCents: 22900,
    interval: "month",
    yearlyPriceCents: 229000,
    minimumMonths: 3,
    featured: false,
    credits: [
      { serviceId: "lactate-profile", count: 1, everyMonths: 2 },
      { serviceId: "performance", count: 2, everyMonths: 12 },
      { serviceId: "personal-training", count: 2, everyMonths: 1 },
    ],
    labDiscountPercent: 0,
    name: { en: "Elite", sl: "Elite" },
    audience: {
      en: "For competitors.",
      sl: "Za tekmovalce.",
    },
    features: {
      en: [
        "A training plan built on Jaka's method, adjusted day by day, with Jaka directly involved",
        "Analysis of every workout and a weekly summary, within minutes",
        "A lactate test every 2 months and the Performance package twice a year, included",
        "2 in-person training sessions a month",
        "Replies within 24 hours and a call every two weeks",
      ],
      sl: [
        "Načrt treninga po Jakovi metodi, prilagojen iz dneva v dan, z Jakovim neposrednim sodelovanjem",
        "Analiza vsakega treninga in tedenski povzetek, v nekaj minutah",
        "Laktatni test vsaka 2 meseca in Performance paket dvakrat na leto, vključeno v ceno",
        "2 osebna treninga v živo na mesec",
        "Odgovor v 24 urah in pogovor vsaka dva tedna",
      ],
    },
  },
];

// Every lab test ends with this offer (docs/product.md, "One-off").
export const afterTestOffer = { planFreeDays: 30, coachingFirstMonthDiscountPercent: 50 } as const;
