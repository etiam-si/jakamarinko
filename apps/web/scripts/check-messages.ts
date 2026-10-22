// Runs before `next build`: fails the build when a message key exists in one language and not the other.
import path from "node:path";
import { locales } from "@jakamarinko/types";
import { checkMessages } from "../src/i18n/check-messages";
import { namespaces } from "../src/i18n/namespaces";

const problems = checkMessages(path.join(__dirname, "../messages"), locales, namespaces);
if (problems.length > 0) {
  console.error(`Messages are out of sync between languages:\n${problems.map((p) => `  - ${p}`).join("\n")}`);
  process.exit(1);
}
console.log(`messages: ${namespaces.length} namespace(s) in sync across ${locales.join(", ")}`);
