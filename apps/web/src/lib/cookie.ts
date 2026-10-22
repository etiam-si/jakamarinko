// First-party cookies set from the browser. `cookies` is document.cookie or a Cookie header.
export function readCookie(name: string, cookies: string): string | undefined {
  for (const part of cookies.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return decodeURIComponent(value.join("="));
  }
}

export function writeCookie(name: string, value: string, days: number) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${days * 86_400}; Path=/; SameSite=Lax${secure}`;
}
