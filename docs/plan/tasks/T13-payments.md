# T13 Stripe payments for bookings

**Goal:** paid lab tests and sessions are paid online at booking, through Grega's company Stripe account.

**Depends on:** T11. **Blocks:** T14.

**Owns:** `packages/db/src/schema/payments.ts`, `apps/api/src/routes/payments.ts`, `apps/api/src/payments/`, `apps/web/src/components/booking/payment/` (a new folder inside T11's area, agreed), `apps/web/messages/{en,sl}/payments.json`.

## Build
1. **Stripe Checkout** (hosted) for a `pending_payment` booking: amount from the service type, in the customer's language, with an invoice (company details on it).
   - The slot is held for 15 min. An unpaid booking expires (worker job) and the slot frees.
2. **Webhook** `POST /api/payments/stripe`: verify the signature; idempotent per event. `checkout.session.completed` → booking `confirmed`, `paid_via = stripe`, send emails; `track` server side as `booking_paid`.
3. **Cancellation refunds:** cancelled by the customer ≥ 24 h before → full refund. Cancelled by the coach → always a full refund. Later → no refund (from the terms in T17).
4. Feature flag `PAYMENTS_ENABLED`. When off, T07's "pay on site" behaviour stays.
5. Prices shown with or without VAT according to `PRICES_INCLUDE_VAT` (open question in `docs/product.md`).

## Acceptance criteria
- [ ] Playwright with Stripe test mode: book → pay with test card 4242 → confirmed page → confirmation email.
- [ ] Unpaid for 15 min → the booking expires and the slot is free again (test with a shortened timeout).
- [ ] The webhook replayed twice → one confirmation email (idempotent).
- [ ] A forged webhook (bad signature) → 400 and no change.
- [ ] A customer cancels 3 days before → a refund is created in Stripe test mode.

## Out of scope
Subscriptions and credits (phase 3).

## Needs from the user
Stripe account of the company (test keys first, then live), invoice details, and the VAT decision.
