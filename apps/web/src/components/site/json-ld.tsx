import { type Locale, labTests, packages } from "@jakamarinko/types";
import { BRAND_NAME } from "@/components/brand/logo";
import { euros, labMapsUrl, siteUrl, url } from "./site";

type Contact = { phone: string; email: string; instagram: string; strava: string };

const person = `${siteUrl}/#jaka`;
const business = `${siteUrl}/#business`;

function JsonLd({ data }: { data: object }) {
  const json = { "@context": "https://schema.org", ...data };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }} />;
}

// Structured data for search engines: Jaka as a Person and the lab and coaching as a SportsActivityLocation.
// The address is the lab's (labAddress in site.ts).
export function SiteJsonLd({ locale, description, jobTitle, contact }: { locale: string; description: string; jobTitle: string; contact: Contact }) {
  return (
    <JsonLd
      data={{
        "@graph": [
          {
            "@type": "Person",
            "@id": person,
            name: BRAND_NAME,
            jobTitle,
            url: url(locale, "/about"),
            image: `${siteUrl}/brand/photos/jaka-redbull-400.png`,
            sameAs: [contact.instagram, contact.strava],
          },
          {
            "@type": "SportsActivityLocation",
            "@id": business,
            name: BRAND_NAME,
            description,
            url: url(locale, ""),
            logo: `${siteUrl}/brand/icons/icon-512.png`,
            image: `${siteUrl}/og/${locale}/home.png`,
            telephone: contact.phone,
            email: contact.email,
            founder: { "@id": person },
            address: { "@type": "PostalAddress", streetAddress: "Spodnje Pirnice 19N", postalCode: "1215", addressLocality: "Medvode", addressCountry: "SI" },
            hasMap: labMapsUrl,
            sameAs: [contact.instagram],
          },
          { "@type": "WebSite", "@id": `${siteUrl}/#website`, name: BRAND_NAME, url: siteUrl, inLanguage: locale, publisher: { "@id": business } },
        ],
      }}
    />
  );
}

const offer = (priceCents: number, href: string) => ({
  "@type": "Offer",
  price: euros(priceCents).toFixed(2),
  priceCurrency: "EUR",
  url: href,
  availability: "https://schema.org/InStock",
});

// Each lab test as a Service with its catalog price (packages/types), so search results can show what it costs.
export function LabTestsJsonLd({ locale }: { locale: Locale }) {
  return (
    <JsonLd
      data={{
        "@graph": labTests.map((test) => ({
          "@type": "Service",
          "@id": `${siteUrl}/#${test.id}`,
          name: test.name[locale],
          description: test.description[locale],
          serviceType: "Sports performance testing",
          provider: { "@id": business },
          offers: offer(test.priceCents, `${url(locale, "/booking")}?service=${test.id}`),
        })),
      }}
    />
  );
}

// The coaching packages, each a Service with its monthly price.
export function PackagesJsonLd({ locale }: { locale: Locale }) {
  return (
    <JsonLd
      data={{
        "@graph": packages.map((pkg) => ({
          "@type": "Service",
          "@id": `${siteUrl}/#package-${pkg.id}`,
          name: `${BRAND_NAME} ${pkg.name[locale]}`,
          description: pkg.audience[locale],
          serviceType: "Endurance coaching",
          provider: { "@id": business },
          offers: {
            ...offer(pkg.priceCents, `${url(locale, "/coaching")}?package=${pkg.id}`),
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: euros(pkg.priceCents).toFixed(2),
              priceCurrency: "EUR",
              unitCode: "MON",
              referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
            },
          },
        })),
      }}
    />
  );
}

// The questions exactly as the page shows them; Faq renders this next to its list.
export function FaqJsonLd({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <JsonLd
      data={{
        "@type": "FAQPage",
        mainEntity: items.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      }}
    />
  );
}
