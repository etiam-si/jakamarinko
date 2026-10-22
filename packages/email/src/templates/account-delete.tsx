// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, messagesFor } from "../i18n";
import { Action, Layout, P } from "../layout";
import type { Template } from "../types";

export type AccountDeleteProps = { url: string; expiresInMinutes: number };

// The link that confirms deleting an account (T15). Nothing is deleted until it is opened.
export const accountDelete: Template<AccountDeleteProps> = ({ url, expiresInMinutes }, locale) => {
  const m = messagesFor(locale).accountDelete;
  return {
    subject: m.subject,
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{messagesFor(locale).common.greetingNoName}</P>
        <P>{m.intro}</P>
        <P>{m.kept}</P>
        <Action href={url}>{m.button}</Action>
        <P style={{ fontSize: 13 }}>{fill(m.expires, { minutes: expiresInMinutes })}</P>
        <P style={{ fontSize: 13 }}>{m.ignore}</P>
      </Layout>
    ),
  };
};
