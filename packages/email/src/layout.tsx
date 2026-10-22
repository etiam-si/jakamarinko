// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { Body, Button, Container, Head, Hr, Html, Link, Preview, Section, Text } from "@react-email/components";
import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@jakamarinko/types";
import { fill, messagesFor } from "./i18n";
import { site, theme } from "./theme";

type Props = {
  locale: Locale;
  preview: string;
  children: ReactNode;
  // Only marketing emails have one; transactional emails must not.
  unsubscribeUrl?: string;
};

export function Layout({ locale, preview, children, unsubscribeUrl }: Props) {
  const m = messagesFor(locale).layout;
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: theme.background, fontFamily: theme.font, margin: 0, padding: "24px 0" }}>
        <Container style={{ backgroundColor: theme.surface, maxWidth: 560, padding: "32px 32px 24px", borderRadius: 8 }}>
          <Text style={{ margin: 0, fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em", color: theme.ink }}>{site.name}</Text>
          <Text style={{ margin: "0 0 24px", fontSize: 12, textTransform: "uppercase", letterSpacing: "0.12em", color: theme.muted }}>
            {m.tagline}
          </Text>
          {children}
          <Hr style={{ borderColor: theme.line, margin: "32px 0 16px" }} />
          <Text style={small}>{fill(m.contact, { email: site.email, phone: site.phone })}</Text>
          <Text style={small}>
            <Link href={site.url} style={smallLink}>jakamarinko.com</Link> ·{" "}
            <Link href={site.instagram} style={smallLink}>Instagram</Link>
          </Text>
          {unsubscribeUrl && (
            <Text style={small}>
              <Link href={unsubscribeUrl} style={smallLink}>{m.unsubscribe}</Link>
            </Text>
          )}
        </Container>
      </Body>
    </Html>
  );
}

export function P({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <Text style={{ fontSize: 15, lineHeight: "24px", color: theme.ink, margin: "0 0 16px", ...style }}>{children}</Text>;
}

export function Action({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Section style={{ margin: "8px 0 24px" }}>
      <Button
        href={href}
        style={{ backgroundColor: theme.accent, color: theme.accentText, fontSize: 15, fontWeight: 600, padding: "12px 20px", borderRadius: 6 }}
      >
        {children}
      </Button>
    </Section>
  );
}

// Label/value rows, e.g. service, when, where.
export function Details({ rows }: { rows: [label: string, value: ReactNode][] }) {
  return (
    <Section style={{ border: `1px solid ${theme.line}`, borderRadius: 6, padding: "4px 16px", margin: "0 0 24px" }}>
      {rows.map(([label, value]) => (
        <Text key={label} style={{ fontSize: 15, lineHeight: "22px", color: theme.ink, margin: "12px 0" }}>
          <span style={{ display: "block", fontSize: 12, color: theme.muted }}>{label}</span>
          {value}
        </Text>
      ))}
    </Section>
  );
}

const small: CSSProperties = { fontSize: 12, lineHeight: "18px", color: theme.muted, margin: "0 0 4px" };
const smallLink: CSSProperties = { color: theme.muted, textDecoration: "underline" };
