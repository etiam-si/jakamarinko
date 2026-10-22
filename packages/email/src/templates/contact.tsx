// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { Link } from "@react-email/components";
import { fill, type Messages, messagesFor } from "../i18n";
import { Action, Details, Layout, P } from "../layout";
import { site } from "../theme";
import type { Template } from "../types";

// To the coach, in the coach's language.
export type ContactReceivedProps = {
  name: string;
  email: string;
  phone?: string;
  topic: keyof Messages["contactReceived"]["topics"];
  message: string;
  requestUrl: string;
};

export const contactReceived: Template<ContactReceivedProps> = ({ name, email, phone, topic, message, requestUrl }, locale) => {
  const m = messagesFor(locale).contactReceived;
  return {
    subject: fill(m.subject, { name }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{m.intro}</P>
        <Details
          rows={[
            [m.name, name],
            [m.email, <Link href={`mailto:${email}`}>{email}</Link>],
            ...(phone ? [[m.phone, phone] as [string, string]] : []),
            [m.topic, m.topics[topic]],
            [m.message, <span style={{ whiteSpace: "pre-wrap" }}>{message}</span>],
          ]}
        />
        <Action href={requestUrl}>{m.open}</Action>
      </Layout>
    ),
  };
};

// To the sender. Doesn't repeat their message, which can hold health details.
export type ContactAutoReplyProps = { name: string };

export const contactAutoReply: Template<ContactAutoReplyProps> = ({ name }, locale) => {
  const m = messagesFor(locale).contactAutoReply;
  const common = messagesFor(locale).common;
  return {
    subject: m.subject,
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{m.intro}</P>
        <P>{m.meanwhile}</P>
        <Action href={`${site.url}/${locale}`}>{m.button}</Action>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};
