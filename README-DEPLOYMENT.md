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
2. Under **Products**, create a product:
   - Name: `Civic Current Premium Unlock`
   - One-time payment, $14.99 USD
3. Copy the **price ID** (looks like `price_xxxx`) → `STRIPE_PRICE_PREMIUM_UNLOCK`
4. Under **Developers** → **API keys**, copy the **Secret key** → `STRIPE_SECRET_KEY`
5. Set up a **webhook** pointing to `https://YOUR-DOMAIN.vercel.app/api/webhook/stripe`
   - Events to send:
     - `checkout.session.completed`
     - `charge.refunded`
   - Copy the **signing secret** → `STRIPE_WEBHOOK_SECRET`
6. **Use test mode** until you've verified the full flow end-to-end. Stripe's
   `4242 4242 4242 4242` test card always succeeds; `4000 0000 0000 9995`
   simulates an insufficient-funds decline.

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

1. Open the app, click **Sign in**, create a Clerk test account
2. Click **Upgrade** in the top-right account menu
3. Click **Unlock Premium** → you'll be redirected to Stripe Checkout
4. Use card `4242 4242 4242 4242`, any future expiry, any CVC
5. You'll be redirected to `/?premium=success`
6. The post-purchase toast appears and the **Premium** badge replaces the
   **Upgrade** button in the account menu
7. The **Cities** menu now allows 3 city slots

## What the webhook does

When Stripe POSTs `checkout.session.completed` to `/api/webhook/stripe`, the
handler:

1. Verifies the `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`
2. Pulls the Clerk user id from `session.client_reference_id`
3. Calls `setEntitlements(userId, { hasPremium: true })` on KV

If KV is unreachable, the handler returns 500 and Stripe will retry the event
for up to 3 days. The handler is idempotent — duplicate deliveries don't
double-grant.

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
| Upgrade modal: "Server missing STRIPE_PRICE_..." | Price env var unset | Add `STRIPE_PRICE_PREMIUM_UNLOCK` |
| Upgrade modal: "401 Authentication required" | User not signed in | Click "Sign in to purchase" |
| Webhook 400 with "signature verification failed" | Wrong webhook secret | Re-copy from Stripe dashboard |
| Cloud save returns 401 in console | Token getter returning null | Clerk session expired; sign in again |
| Slots list empty after upgrade | KV not provisioned | Connect Vercel KV to the project |

## Phase-by-phase roadmap

Phase 0 (✅ shipped) — content-pack architecture
Phase 1 (this guide) — auth, premium unlock, cloud save
Phase 2 — first paid content pack (Post-Carbon Future)
Phase 3 — cosmetic theme shop
Phase 4 — Mayor's Office subscription
Phase 5 — community scenario workshop
