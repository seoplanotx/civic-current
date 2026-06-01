# Civic Current — Deployment Guide

This document walks through everything you need to stand up Phase 1 (free
core + one-time premium unlock) in production on Vercel.

## What you're deploying

- **Frontend**: a Vite + React SPA, built to `dist/`
- **API**: TypeScript serverless functions under `api/`, auto-detected by Vercel
- **Auth**: Clerk
- **Payments**: Stripe (one-time `$14.99` premium unlock)
- **Storage**: Vercel KV (entitlements + cloud saves)

## One-time setup checklist

### 1. Clerk

1. Create a Clerk application at https://dashboard.clerk.com
2. Under **API Keys**, copy:
   - **Publishable key** → goes in `VITE_CLERK_PUBLISHABLE_KEY`
   - **Secret key** → goes in `CLERK_SECRET_KEY`
3. Enable any social or email/password sign-in methods you want
4. Under **Sessions** → **Session token**, keep default JWT settings — the
   API verifies tokens via `clerk.verifyToken()`

### 2. Stripe

1. Create a Stripe account at https://dashboard.stripe.com
2. Under **Products**, create a product for the premium unlock:
   - Name: `Civic Current Premium Unlock`
   - One-time payment, $14.99 USD
3. Copy the **price ID** (looks like `price_xxxx`) → `STRIPE_PRICE_PREMIUM_UNLOCK`
4. Under **Developers** → **API keys**, copy the **Secret key** → `STRIPE_SECRET_KEY`
5. Set up a **webhook** pointing to `https://YOUR-DOMAIN.vercel.app/api/webhook/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `checkout.session.async_payment_succeeded` (delayed-payment methods)
     - `charge.refunded`
     - `customer.subscription.updated` (Mayor's Office lifecycle)
     - `customer.subscription.deleted` (Mayor's Office cancellation)
     - `invoice.payment_failed` (Mayor's Office past-due flag)
   - Copy the **signing secret** → `STRIPE_WEBHOOK_SECRET`
   - **Important:** without the three subscription events, a Mayor's Office
     subscription would never reflect cancellation or lapse in-app.
6. **Use test mode** until you've verified the full flow end-to-end. Stripe's
   `4242 4242 4242 4242` test card always succeeds; `4000 0000 0000 9995`
   simulates an insufficient-funds decline.

#### Content packs (the in-game Shop)

The Shop (top-right **Shop** button) sells one-time content packs. Each pack
needs its own Stripe Price, mapped to an env var. The mapping lives in
[`src/content/catalog.ts`](src/content/catalog.ts) (`stripePriceEnv` per entry):

| Pack | Stripe product (suggested) | Env var |
| --- | --- | --- |
| Throwback Era | `Civic Current — Throwback Era`, one-time $4.99 | `STRIPE_PRICE_PACK_THROWBACK` |
| Tomorrow's City | `Civic Current — Tomorrow's City`, one-time $4.99 | `STRIPE_PRICE_PACK_TOMORROWS_CITY` |

For each pack: create a one-time Product + Price in Stripe, copy the price ID
into the matching env var. A missing var makes that pack's **Buy** return a 500
(the rest of the Shop still works). To add a *new* pack later: register it in
`catalog.ts` with a fresh `stripePriceEnv`, set that env var, and ship the pack
content under `src/content/packs/<id>/` — no checkout/webhook code changes
needed (one generic `/api/checkout/pack` endpoint serves every pack).

> **Refunds:** both checkout endpoints attach the buyer + SKU to
> `payment_intent_data.metadata`, so a Stripe refund fires `charge.refunded`
> and the webhook revokes the matching entitlement automatically. This only
> works for purchases made after this was wired up — older charges that lack
> the metadata won't auto-revoke.

#### Cosmetic themes (the in-game Themes shop)

The **Themes** button (top-right) sells one-time terrain re-color themes.
Like packs, each maps to a Stripe Price env var (see
[`src/content/cosmetics/catalog.ts`](src/content/cosmetics/catalog.ts)):

| Theme | Stripe product (suggested) | Env var |
| --- | --- | --- |
| Noir City | `Civic Current — Noir City`, one-time $2.99 | `STRIPE_PRICE_COSMETIC_NOIR` |
| Vaporwave | `Civic Current — Vaporwave`, one-time $2.99 | `STRIPE_PRICE_COSMETIC_VAPORWAVE` |
| Solarpunk | `Civic Current — Solarpunk`, one-time $2.99 | `STRIPE_PRICE_COSMETIC_SOLARPUNK` |

Themes are purchased (`/api/checkout/cosmetic`), then **equipped**
(`/api/cosmetics/equip`) — equipping re-colors the 3D board live. Mayor's
Office subscribers get every theme without buying. Refunds revoke ownership
(and un-equip if the refunded theme was active) via the same
`charge.refunded` path.

#### Mayor's Office subscription (recurring)

The Mayor's Office is a **recurring** subscription (opened from the account
menu). It grants 5 city slots and every cosmetic theme while active.

1. In Stripe **Products**, create `Civic Current — Mayor's Office` with a
   **recurring** price (e.g. $4.99 / month).
2. Copy the recurring price ID → `STRIPE_PRICE_MAYORS_OFFICE`.
   (This MUST be a recurring price; a one-time price will fail the
   `mode: 'subscription'` checkout.)
3. Under **Settings → Billing → Customer portal**, enable the **Customer
   Portal** so `/api/billing/portal` can create management sessions
   (subscribers use "Manage billing" to update payment or cancel).
4. Ensure the three subscription webhook events (step 5 above) are enabled —
   `customer.subscription.updated/deleted` keep `hasSubscription` in sync, and
   `invoice.payment_failed` flags `past_due`.

The webhook reconciles out-of-order Stripe deliveries: lifecycle events that
reference a subscription the user has already replaced are ignored, and
`customer.subscription.updated` (carrying the authoritative status) is the
source of truth for turning perks on/off.

### 3. Vercel KV

1. In the Vercel dashboard, open your project → **Storage** → **Create**
2. Choose **KV** (Upstash Redis)
3. After provisioning, the KV envs are automatically added to your project:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
   - `KV_URL` (etc.)

### 4. Deploy

```bash
# From the project root
vercel link        # one-time: link your local repo to a Vercel project
vercel env pull    # one-time: download envs into .env.local for dev
vercel             # deploy a preview
vercel --prod      # promote to production
```

## Local development

```bash
cp .env.example .env.local
# Fill in your test-mode keys
npm install
vercel dev         # runs both the Vite frontend and the serverless API locally
```

The frontend will be served at http://localhost:3000 and API routes at
http://localhost:3000/api/...

> **Tip**: Running plain `npm run dev` (Vite directly) works for UI iteration
> but API routes won't be available. Use `vercel dev` whenever you need to
> exercise checkout, webhooks, or cloud save flows.

## Verifying the end-to-end purchase flow

**Premium unlock:**

1. Open the app, click **Sign in**, create a Clerk test account
2. Click **Upgrade** in the top-right account menu
3. Click **Unlock Premium** → you'll be redirected to Stripe Checkout
4. Use card `4242 4242 4242 4242`, any future expiry, any CVC
5. You'll be redirected to `/?premium=success`
6. The post-purchase toast appears and the **Premium** badge replaces the
   **Upgrade** button in the account menu
7. The **Cities** menu now allows 3 city slots

**Content pack:**

1. Signed in, click **Shop** (top-right) → **Buy $4.99** on a pack
2. Complete Stripe Checkout with the test card
3. You'll be redirected to `/?pack=<id>&result=success` and see an
   "unlocked" toast
4. Reopen the **Shop** — the pack now shows an **Owned** badge, and its new
   buildings/events appear in-game (the registry re-filters on the
   entitlement refresh)

**Refund (revocation):** refund the test charge in the Stripe dashboard. The
`charge.refunded` webhook fires and the matching entitlement is revoked —
premium reverts to the Upgrade button, or the pack returns to a purchasable
state.

## What the webhook does

`/api/webhook/stripe` verifies the `stripe-signature` header against
`STRIPE_WEBHOOK_SECRET`, then:

- On **`checkout.session.completed`**, reads `client_reference_id` (the Clerk
  user id) and the `sku` metadata. `premium_unlock` grants premium;
  `pack:<id>` adds the pack to `ownedPackIds`.
- On **`charge.refunded`**, reads the same `sku` + `clerkUserId` from the
  charge metadata (propagated via `payment_intent_data`) and revokes the
  corresponding entitlement.

If KV is unreachable, the handler returns 500 and Stripe retries for up to 3
days. It is idempotent — duplicate deliveries don't double-grant, and a
pack is only added once.

## Local webhook testing

```bash
stripe listen --forward-to localhost:3000/api/webhook/stripe
# In another shell, trigger a test event
stripe trigger checkout.session.completed
```

The Stripe CLI prints the webhook signing secret on first run — use that
secret in `.env.local` for `STRIPE_WEBHOOK_SECRET` while testing.

## Failure modes

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Account menu shows "ANONYMOUS · LOCAL SAVE" | `VITE_CLERK_PUBLISHABLE_KEY` not set | Add to Vercel env vars |
| Shop shows "Purchases unavailable" | `VITE_CLERK_PUBLISHABLE_KEY` not set | Purchases need auth; add the Clerk key |
| Upgrade modal: "Server missing STRIPE_PRICE_..." | Price env var unset | Add `STRIPE_PRICE_PREMIUM_UNLOCK` |
| Shop Buy: "Server missing STRIPE_PRICE_PACK_..." | Pack price env var unset | Add the pack's `STRIPE_PRICE_PACK_*` var |
| Theme Buy: "Server missing STRIPE_PRICE_COSMETIC_..." | Cosmetic price env var unset | Add the theme's `STRIPE_PRICE_COSMETIC_*` var |
| Subscribe: "Server missing STRIPE_PRICE_MAYORS_OFFICE" | Sub price env var unset | Add a **recurring** price to `STRIPE_PRICE_MAYORS_OFFICE` |
| "Manage billing" 400 / no portal | Customer Portal not enabled | Enable it in Stripe → Settings → Billing → Customer portal |
| Subscription never cancels/lapses in-app | Subscription webhook events not enabled | Add `customer.subscription.updated/deleted` + `invoice.payment_failed` |
| Upgrade modal: "401 Authentication required" | User not signed in | Click "Sign in to purchase" |
| Webhook 400 with "signature verification failed" | Wrong webhook secret | Re-copy from Stripe dashboard |
| Refund didn't revoke access | Charge predates `payment_intent_data` metadata | Only affects charges made before the fix; revoke manually in KV |
| Cloud save returns 401 in console | Token getter returning null | Clerk session expired; sign in again |
| Slots list empty after upgrade | KV not provisioned | Connect Vercel KV to the project |
| Equipped theme doesn't recolor board | Entitlements not refreshed | Reload; AuthBridge re-fetches entitlements on auth/session change |

## Phase-by-phase roadmap

Phase 0 (✅ shipped) — content-pack architecture
Phase 1 (✅ shipped) — auth, premium unlock, cloud save
Phase 2 (✅ shipped) — paid content packs (Throwback Era, Tomorrow's City) + in-game Shop
Phase 3 (✅ shipped) — cosmetic theme shop (Noir, Vaporwave, Solarpunk)
Phase 4 (✅ shipped) — Mayor's Office subscription
Phase 5 — community scenario workshop
