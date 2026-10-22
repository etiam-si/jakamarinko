import Stripe from "stripe";

type Session = { id: string; status: "open" | "complete" | "expired"; payment_status: "paid" | "unpaid"; params: Record<string, string> };

// Tests only: a Stripe client whose HTTP calls go to an in-memory fake of Checkout sessions and refunds.
// Requests are recorded with their form fields flattened as Stripe sends them, e.g. line_items[0][quantity].
export function fakeStripe() {
  const sessions = new Map<string, Session>();
  const refunds: Record<string, string>[] = [];
  const calls: { method: string; path: string; params: Record<string, string> }[] = [];
  let n = 0;

  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
  const fail = (message: string) => json({ error: { type: "invalid_request_error", message } }, 400);
  const view = (s: Session) => ({
    id: s.id,
    object: "checkout.session",
    status: s.status,
    payment_status: s.payment_status,
    url: s.status === "open" ? `https://checkout.stripe.test/c/pay/${s.id}` : null,
    client_reference_id: s.params.client_reference_id ?? null,
    metadata: { booking_id: s.params["metadata[booking_id]"] },
    amount_total: Number(s.params["line_items[0][price_data][unit_amount]"]),
    payment_intent: s.status === "complete" ? `pi_${s.id}` : null,
  });

  const fetchFn = async (input: string | URL | Request, init?: RequestInit) => {
    const url = new URL(typeof input === "string" || input instanceof URL ? input : input.url);
    const method = init?.method ?? "GET";
    const params = Object.fromEntries(new URLSearchParams(typeof init?.body === "string" ? init.body : ""));
    calls.push({ method, path: url.pathname, params });
    const [, , kind, sub, id, action] = url.pathname.split("/");

    if (kind === "checkout" && sub === "sessions") {
      if (method === "POST" && !id) {
        const s: Session = { id: `cs_test_${++n}`, status: "open", payment_status: "unpaid", params };
        sessions.set(s.id, s);
        return json(view(s));
      }
      const s = sessions.get(id!);
      if (!s) return json({ error: { type: "invalid_request_error", message: "No such session" } }, 404);
      if (action === "expire") {
        if (s.status !== "open") return fail(`Only Checkout Sessions with a status of open can be expired (it is ${s.status})`);
        s.status = "expired";
      }
      return json(view(s));
    }
    if (kind === "refunds" && method === "POST") {
      const existing = refunds.find((r) => r.payment_intent === params.payment_intent);
      if (existing) return fail("Charge has already been refunded");
      refunds.push(params);
      const paid = [...sessions.values()].find((x) => `pi_${x.id}` === params.payment_intent);
      if (!paid) return fail("No such payment_intent");
      return json({ id: `re_${refunds.length}`, object: "refund", amount: view(paid).amount_total, payment_intent: params.payment_intent, status: "succeeded" });
    }
    return json({ error: { type: "invalid_request_error", message: `fake: ${method} ${url.pathname}` } }, 404);
  };

  const client = new Stripe("sk_test_fake", { httpClient: Stripe.createFetchHttpClient(fetchFn as typeof fetch), maxNetworkRetries: 0 });

  return {
    client,
    sessions,
    refunds,
    calls,
    // What the customer does on the Stripe page.
    pay(id: string) {
      const s = sessions.get(id)!;
      s.status = "complete";
      s.payment_status = "paid";
      return view(s);
    },
    view: (id: string) => view(sessions.get(id)!),
  };
}

export type FakeStripe = ReturnType<typeof fakeStripe>;
