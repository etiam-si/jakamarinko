import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test, vi } from "vitest";
import { consoleTransport, sendEmail, setTransport } from "./index";

test("the console transport writes the html to the outbox", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "outbox-"));
  setTransport(consoleTransport(dir));
  vi.spyOn(console, "log").mockImplementation(() => {});

  const result = await sendEmail({ to: "a@example.com", subject: "Hi", locale: "sl", react: <p>Živjo</p> });

  expect(result.ok).toBe(true);
  const [file] = await readdir(dir);
  expect(await readFile(path.join(dir, file!), "utf8")).toBe("<p>Živjo</p>");
});

test("a text email is escaped", async () => {
  const sent = vi.fn(async () => ({ ok: true as const, id: "1" }));
  setTransport(sent);

  await sendEmail({ to: "a@example.com", subject: "Hi", locale: "en", text: "<b>" });

  expect(sent).toHaveBeenCalledWith(expect.objectContaining({ html: "<pre>&lt;b&gt;</pre>", text: "<b>" }));
});
