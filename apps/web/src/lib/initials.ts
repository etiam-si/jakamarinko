// What the account button shows: the first letters of the first two words of the name ("Ana Novak" → "AN"), or the
// first letter of the email while there's no name.
export function initials(name: string, email: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length) return words.slice(0, 2).map((w) => [...w][0]!.toLocaleUpperCase()).join("");
  return ([...email.trim()][0] ?? "?").toLocaleUpperCase();
}
