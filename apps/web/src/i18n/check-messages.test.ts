import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { checkMessages } from "./check-messages";
import { namespaces } from "./namespaces";
import { routing } from "./routing";

function messagesDir(files: Record<string, object>) {
  const dir = path.join(mkdtempSync(path.join(tmpdir(), "msg-")), "messages");
  for (const [name, content] of Object.entries(files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true });
    writeFileSync(path.join(dir, name), JSON.stringify(content));
  }
  return dir;
}

test("the real messages are in sync", () => {
  expect(checkMessages(path.join(__dirname, "../../messages"), routing.locales, namespaces)).toEqual([]);
});

test("names a nested key missing in one language", () => {
  const dir = messagesDir({
    "en/common.json": { home: { title: "Hi", soon: "Soon" } },
    "sl/common.json": { home: { title: "Živjo" } },
  });
  expect(checkMessages(dir, ["en", "sl"], ["common"])).toEqual([
    'messages/sl/common.json is missing "home.soon" (it is in messages/en/common.json)',
  ]);
});

test("a missing or unregistered namespace file", () => {
  const dir = messagesDir({ "en/common.json": {}, "en/extra.json": {} });
  expect(checkMessages(dir, ["en", "sl"], ["common"])).toEqual([
    "messages/en/extra.json is not registered in src/i18n/namespaces.ts",
    "messages/sl/common.json is missing",
  ]);
});
