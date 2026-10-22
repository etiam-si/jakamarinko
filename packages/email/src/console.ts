import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Transport } from "./types";

// Dev transport: never reaches a real inbox. Prints who it was for and writes the body to .emails/.
// The body stays out of the console because it can hold health data.
export function consoleTransport(dir = path.resolve(process.env.EMAIL_OUTBOX_DIR ?? ".emails")): Transport {
  return async (email) => {
    try {
      await mkdir(dir, { recursive: true });
      const id = `${new Date().toISOString().replace(/[:.]/g, "-")}-${Math.random().toString(36).slice(2, 8)}`;
      const file = path.join(dir, `${id}.html`);
      await writeFile(file, email.html);
      for (const a of email.attachments ?? []) await writeFile(path.join(dir, `${id}-${a.filename}`), a.content);
      console.log(`email [${email.locale}] to ${email.to}: ${email.subject}\n  ${file}`);
      return { ok: true, id };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  };
}
