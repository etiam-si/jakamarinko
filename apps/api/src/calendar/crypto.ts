import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { locales } from "@jakamarinko/types";

// Tokens at rest: AES-256-GCM, stored as iv.tag.ciphertext (base64url).
export function encrypt(plain: string, key: Buffer) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

// Throws when the key changed or the value was tampered with.
export function decrypt(stored: string, key: Buffer) {
  const [iv, tag, data] = stored.split(".").map((p) => Buffer.from(p, "base64url"));
  if (!iv || !tag || !data) throw new Error("bad encrypted token");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}

const mac = (payload: string, key: Buffer) => createHmac("sha256", key).update(`calendar-state:${payload}`).digest("base64url");

// The OAuth state: who started the connection, where to send them back, and until when. Signed, so the callback
// only accepts what we issued, for the user who is signed in.
const State = z.object({ userId: z.string(), locale: z.enum(locales), exp: z.number() });
type State = z.infer<typeof State>;

export function signState(state: State, key: Buffer) {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  return `${payload}.${mac(payload, key)}`;
}

export function verifyState(value: string, key: Buffer, now: Date) {
  const [payload, sig] = value.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(mac(payload, key));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const state = State.parse(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  return state.exp > now.getTime() ? state : null;
}
