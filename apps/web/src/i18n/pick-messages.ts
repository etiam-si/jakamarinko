type Messages = Record<string, unknown>;

// The parts of a message tree named by paths: "booking" takes a whole namespace, "errors.error" one branch of it.
export function pickMessages(messages: Messages, paths: string[]): Messages {
  const out: Messages = {};
  for (const path of paths) {
    const keys = path.split(".");
    let from: unknown = messages;
    let to = out;
    for (const [i, key] of keys.entries()) {
      if (typeof from !== "object" || from === null || !(key in from)) break;
      from = (from as Messages)[key];
      if (i === keys.length - 1) to[key] = from;
      else to = (to[key] ??= {}) as Messages;
    }
  }
  return out;
}
