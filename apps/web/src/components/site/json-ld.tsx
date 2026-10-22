import { BRAND_NAME } from "@/components/brand/logo";
import { siteUrl, url } from "./site";

type Contact = { phone: string; email: string; instagram: string; strava: string };

// Structured data for search engines: Jaka as a Person and the lab and coaching as a SportsActivityLocation.
// No address until the user gives one (docs/plan/tasks/T08-public-site.md).
export function SiteJsonLd({ locale, description, jobTitle, contact }: { locale: string; description: string; jobTitle: string; contact: Contact }) {
  const person = {
    "@type": "Person",
    "@id": `${siteUrl}/#jaka`,
    name: BRAND_NAME,
    jobTitle,
    url: url(locale, "/about"),
    image: `${siteUrl}/brand/photos/jaka-redbull-400.png`,
    sameAs: [contact.instagram, contact.strava],
  };
  const business = {
    "@type": "SportsActivityLocation",
    "@id": `${siteUrl}/#business`,
    name: BRAND_NAME,
    description,
    url: url(locale, ""),
    logo: `${siteUrl}/brand/icons/icon-512.png`,
    image: `${siteUrl}/brand/og-base.png`,
    telephone: contact.phone,
    email: contact.email,
    founder: { "@id": person["@id"] },
    sameAs: [contact.instagram],
  };
  const json = { "@context": "https://schema.org", "@graph": [person, business] };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json).replace(/</g, "\\u003c") }} />;
}
