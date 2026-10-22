// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, messagesFor } from "../i18n";
import { Action, Layout, P } from "../layout";
import type { Template } from "../types";

export type MagicLinkProps = { url: string; expiresInMinutes: number };

export const magicLink: Template<MagicLinkProps> = ({ url, expiresInMinutes }, locale) => {
  const m = messagesFor(locale).magicLink;
  return {
    subject: m.subject,
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{messagesFor(locale).common.greetingNoName}</P>
        <P>{fill(m.intro, { minutes: expiresInMinutes })}</P>
        <Action href={url}>{m.button}</Action>
        <P style={{ fontSize: 13 }}>{m.ignore}</P>
      </Layout>
    ),
  };
};
