import { index, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { locales } from "@jakamarinko/types";

export const requestTopics = ["coaching", "lab_test", "other"] as const;
export const requestTopic = pgEnum("request_topic", requestTopics);
// new: waiting for the coach. answered: the coach replied by email. done: nothing more to do.
export const requestStatuses = ["new", "answered", "done"] as const;
export const requestStatus = pgEnum("request_status", requestStatuses);

// Messages from the contact form (T09). The message can hold health details; it never goes to the log.
export const requests = pgTable(
  "requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    topic: requestTopic("topic").notNull(),
    message: text("message").notNull(),
    // The sender's language: the auto-reply and the coach's answer use it.
    locale: text("locale", { enum: locales }).notNull(),
    status: requestStatus("status").default("new").notNull(),
    // When they ticked "you may contact me": the proof of consent for keeping this row.
    consentedAt: timestamp("consented_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index("requests_status_created_at").on(t.status, t.createdAt)],
);
