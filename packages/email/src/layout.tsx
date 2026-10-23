// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { Body, Button, Column, Container, Head, Heading, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@jakamarinko/types";
import { fill, messagesFor } from "./i18n";
import { site, theme } from "./theme";

type Props = {
  locale: Locale;
  // The inbox preview line, also shown as the email's heading.
  preview: string;
  children: ReactNode;
  // Only marketing emails have one; transactional emails must not.
  unsubscribeUrl?: string;
};

// Branded frame for every email, built from tables and inline styles (react-email) so Gmail, Outlook and Apple Mail
// show the same thing: the spruce header with the logo, the zone stripe, a white card, and the footer below it.
export function Layout({ locale, preview, children, unsubscribeUrl }: Props) {
  const m = messagesFor(locale).layout;
  return (
    <Html lang={locale}>
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
      </Head>
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: theme.background, fontFamily: theme.font, margin: 0, padding: "24px 12px" }}>
        <Container style={{ maxWidth: 560, width: "100%" }}>
          <Section data-skip-in-text style={{ backgroundColor: theme.accent, borderRadius: "12px 12px 0 0", padding: "28px 32px" }}>
            {/* Not a link, so the email's own button is its first link: what a reader taps first, and what tests read. */}
            <Img src={site.logo.src} width={site.logo.width} height={site.logo.height} alt={`${site.name} — ${site.tagline}`} />
          </Section>
          <Section data-skip-in-text>
            <Row>
              {theme.zones.map((colour) => (
                <Column key={colour} style={{ backgroundColor: colour, height: 4, lineHeight: "4px", fontSize: 0 }}>
                  &nbsp;
                </Column>
              ))}
            </Row>
          </Section>
          <Section style={{ backgroundColor: theme.surface, borderRadius: "0 0 12px 12px", padding: "32px 32px 16px" }}>
            <Heading as="h1" style={{ margin: "0 0 20px", fontSize: 24, lineHeight: "30px", fontWeight: 800, letterSpacing: "-0.01em", color: theme.ink }}>
              {preview}
            </Heading>
            {children}
          </Section>
          <Section style={{ padding: "24px 32px 8px" }}>
            <Text style={small}>{fill(m.contact, { email: site.email, phone: site.phone })}</Text>
            <Text style={small}>
              <Link href={site.url} style={smallLink}>jakamarinko.com</Link> ·{" "}
              <Link href={site.instagram} style={smallLink}>Instagram</Link>
            </Text>
            <Text style={{ ...small, color: theme.ink, fontWeight: 600 }}>
              {site.name} · <span style={{ fontWeight: 400, color: theme.muted }}>{m.tagline}</span>
            </Text>
            {unsubscribeUrl && (
              <Text style={small}>
                <Link href={unsubscribeUrl} style={smallLink}>{m.unsubscribe}</Link>
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function P({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <Text style={{ fontSize: 16, lineHeight: "26px", color: theme.ink, margin: "0 0 16px", ...style }}>{children}</Text>;
}

// The one action of an email: a spruce button, as a link with inline colours so every client draws it.
export function Action({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Button
        href={href}
        style={{
          backgroundColor: theme.accent,
          color: theme.accentText,
          fontSize: 16,
          fontWeight: 600,
          lineHeight: "20px",
          padding: "14px 24px",
          borderRadius: 8,
          textDecoration: "none",
        }}
      >
        {children}
      </Button>
    </Section>
  );
}

// Label/value rows, e.g. service, when, where.
export function Details({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <Section
      style={{ backgroundColor: theme.tint, borderLeft: `3px solid ${theme.accent}`, borderRadius: 8, padding: "4px 20px", margin: "0 0 24px" }}
    >
      {rows.map(([label, value]) => (
        <Text key={label} style={{ fontSize: 16, lineHeight: "24px", color: theme.ink, margin: "14px 0" }}>
          <span style={{ display: "block", fontSize: 12, lineHeight: "18px", letterSpacing: "0.08em", textTransform: "uppercase", color: theme.muted }}>
            {label}
          </span>
          {value}
        </Text>
      ))}
    </Section>
  );
}

const small: CSSProperties = { fontSize: 12, lineHeight: "18px", color: theme.muted, margin: "0 0 6px", textAlign: "center" };
const smallLink: CSSProperties = { color: theme.muted, textDecoration: "underline" };
