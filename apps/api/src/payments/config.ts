import { z } from "zod";

const flag = (fallback: "true" | "false") => z.enum(["true", "false"]).default(fallback);

const Env = z.object({
  PAYMENTS_ENABLED: flag("false"),
  STRIPE_SECRET_KEY: z.string().regex(/^(sk|rk)_(test|live)_/, "must start with sk_test_, sk_live_, rk_test_ or rk_live_").optional(),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith("whsec_").optional(),
  // How long an unpaid booking keeps its slot.
  PAYMENT_HOLD_MIN: z.coerce.number().int().min(1).max(60).default(15),
  // Prices in the catalog are what the customer pays, VAT included (docs/product.md, decided 2026-10-22).
  PRICES_INCLUDE_VAT: flag("true"),
  // Shown on the Stripe invoice, next to the business details set in the Stripe dashboard. All optional.
  INVOICE_COMPANY_NAME: z.string().max(200).optional(),
  INVOICE_COMPANY_ADDRESS: z.string().max(300).optional(),
  INVOICE_VAT_ID: z.string().max(140).optional(),
});

// Read on every call, so tests can change the environment. Empty values count as unset. A bad value turns payments off
// (with the reason) instead of failing the api, so "pay on site" keeps working.
export function paymentsConfig(source: NodeJS.ProcessEnv = process.env) {
  const parsed = Env.safeParse(Object.fromEntries(Object.entries(source).filter(([, v]) => v !== "")));
  const e = parsed.success ? parsed.data : Env.parse({});
  const wanted = (parsed.success ? e.PAYMENTS_ENABLED : source.PAYMENTS_ENABLED) === "true";
  const missing = [!e.STRIPE_SECRET_KEY && "STRIPE_SECRET_KEY", !e.STRIPE_WEBHOOK_SECRET && "STRIPE_WEBHOOK_SECRET"].filter(Boolean);
  const off = !wanted
    ? "PAYMENTS_ENABLED is not true"
    : !parsed.success
      ? parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")
      : missing.length
        ? `${missing.join(" and ")} not set`
        : null;
  return {
    enabled: off === null,
    wanted,
    // Why payments are off, for the start log; null when they are on.
    off,
    secretKey: e.STRIPE_SECRET_KEY ?? "",
    webhookSecret: e.STRIPE_WEBHOOK_SECRET ?? "",
    holdMin: e.PAYMENT_HOLD_MIN,
    pricesIncludeVat: e.PRICES_INCLUDE_VAT === "true",
    invoice: { name: e.INVOICE_COMPANY_NAME, address: e.INVOICE_COMPANY_ADDRESS, vatId: e.INVOICE_VAT_ID },
  };
}

export type PaymentsConfig = ReturnType<typeof paymentsConfig>;

export function logPaymentsStatus(config = paymentsConfig(), log: Pick<Console, "log" | "warn"> = console) {
  if (config.enabled) log.log(`payments on (Stripe ${config.secretKey.includes("_test_") ? "test" : "live"} mode)`);
  else if (config.wanted) log.warn(`payments off: ${config.off}; bookings are paid on site`);
  else log.log("payments off: bookings are paid on site");
}
