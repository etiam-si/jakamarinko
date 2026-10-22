// Automatic JSX runtime even when another package's tsconfig compiles this file (tsx in apps/api).
/** @jsxRuntime automatic @jsxImportSource react */
import { fill, formatWhen, messagesFor } from "../i18n";
import { Layout, P } from "../layout";
import { theme } from "../theme";
import type { Template } from "../types";
import type { Booking } from "./booking";

// TODO(jaka): confirm the bookingPreparation texts in messages/{en,sl}.json: 24 h without hard training,
// 10 hours fasted for the fat/carb test, a light meal 2 to 3 h before other tests, no coffee, what to bring.
// fasted: the fat and carbohydrate test needs an empty stomach; every other test wants a light meal.
export type BookingPreparationProps = { name: string; booking: Booking; fasted: boolean };

export const bookingPreparation: Template<BookingPreparationProps> = ({ name, booking, fasted }, locale) => {
  const m = messagesFor(locale).bookingPreparation;
  const common = messagesFor(locale).common;
  const steps = [m.noHardTraining, fasted ? m.fasted : m.meal, m.sleep];
  return {
    subject: fill(m.subject, { service: booking.serviceName }),
    body: (
      <Layout locale={locale} preview={m.preview}>
        <P>{fill(common.greeting, { name })}</P>
        <P>{fill(m.intro, { service: booking.serviceName, date: formatWhen(booking.start, locale) })}</P>
        <ul style={{ margin: "0 0 16px", paddingLeft: 20, color: theme.ink, fontSize: 15, lineHeight: "24px" }}>
          {steps.map((step) => (
            <li key={step} style={{ marginBottom: 8 }}>{step}</li>
          ))}
        </ul>
        <P style={{ fontWeight: 600, margin: "0 0 4px" }}>{m.bringTitle}</P>
        <P>{m.bring}</P>
        <P>{m.questions}</P>
        <P style={{ margin: 0 }}>{common.signoff}</P>
        <P>{common.signature}</P>
      </Layout>
    ),
  };
};
