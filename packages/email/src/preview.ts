// pnpm --filter email preview: renders every template in both languages to .emails/preview/ (at the repo root).
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { locales } from "@jakamarinko/types";
import { renderTemplate, type TemplateName } from "./index";
import { templates } from "./templates";
import { samples } from "./templates/samples";

const dir = path.resolve(import.meta.dirname, "../../../.emails/preview");
await mkdir(dir, { recursive: true });

const links: string[] = [];
for (const name of Object.keys(templates) as TemplateName[]) {
  for (const locale of locales) {
    const email = await renderTemplate(name, locale, samples[name] as never);
    const file = `${name}.${locale}.html`;
    await writeFile(path.join(dir, file), email.html);
    for (const a of email.attachments ?? []) await writeFile(path.join(dir, `${name}.${locale}.${a.filename}`), a.content);
    links.push(`<li><a href="${file}">${name} (${locale})</a>: ${email.subject}</li>`);
  }
}
await writeFile(path.join(dir, "index.html"), `<meta charset="utf-8"><ul>${links.join("")}</ul>`);
console.log(`${links.length} emails in ${dir}`);
