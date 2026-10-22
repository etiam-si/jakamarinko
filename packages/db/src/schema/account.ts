import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

// What a customer keeps in their profile beyond Better Auth's user row. Goes with the user.
export const profiles = pgTable("profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  phone: text("phone"),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});
