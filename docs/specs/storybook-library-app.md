# Spec: StoryBook by MainStory (parent & kids library app)

Status: **implemented** · 2026-11-16 (see "As built" at the end for where the build differs from the plan)

## Sources of truth (in this order)

1. **API contract:** `../storybook_library_app/docs/API-contracts.md`. Use only the endpoints listed there.
2. **Behaviour:** `../storybook_library_app/docs/PRD_storybook-lib-app.md` (§7 user stories, §9 flows, §10 UX) + `CR-001_Badge_and_Subscription_Pricing.md`.
3. **Visuals:** `docs/design/mainstory-apps.dc.html`, section `#library` (screens A1–D2). Section `#admin` (E1–E5) is **out of scope**.

## Conflicts to confirm

| #   | Conflict                                                                                                                                                                                                 | Proposed resolution                                                                                                                                                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | ~~Badge source~~ **Resolved:** backend now returns `plan_status`.                                                                                                                                        | Read `plan_status` (fall back to `is_subscriber`). Labels: **Subscribed** / **Free**.                                                                                                           |
| C2  | The design's badge says "Subscriber" (A4). CR-001 says "Subscribed".                                                                                                                                     | Use the CR-001 label.                                                                                                                                                                           |
| C3  | ~~CR-001-2 endpoints~~ **Resolved:** the contract now has `expected_price` on `POST /subscription-orders`, `409 PRICE_CHANGED`, and `subscription.next_renewal_price` / `price_change_pending` on `/me`. | Send `expected_price` = displayed plan price. On `PRICE_CHANGED` reload the plan and ask again. Show the price-change notice on Subscription + Settings when `price_change_pending`.            |
| C4  | The contract asks for "Pay (success)" and "Pay (fail)" controls. The design (A5) shows one Pay button.                                                                                                   | Keep the design's primary **Pay Rp X** button (success), and add a small secondary "Simulate failed payment" text button under it.                                                              |
| C5  | PRD US-04 puts a Subscription button in the header. The design shows a dismissible yellow subscribe banner on Home and My Book instead.                                                                  | Follow the design: show the banner only when the plan is Free, and keep it dismissed for the session.                                                                                           |
| C6  | There is no subscription-checkout screen in the design. B1's "Checkout" button leads straight to payment.                                                                                                | Reuse the A5 Checkout layout with a "Monthly plan" line item, then the A6/A7 result screens.                                                                                                    |
| C7  | PRD: "retry from Checkout". Contract: a failed order can't be re-paid, so the retry needs a **new** order.                                                                                               | "Back to Checkout" creates a new order with a fresh `idempotency_key`.                                                                                                                          |
| C8  | The backend seeds accounts and a plan, but **no books**.                                                                                                                                                 | Add a dev-only `scripts/seed-books.py` (stdlib `zipfile` + `urllib`). It builds 6 small picture EPUBs + PNG covers that match the design's sample books and uploads them through the admin API. |
| C9  | The plan's `benefits` is a single string ("Read all… . New books… . Cancel anytime."). The design shows a list.                                                                                          | Split on newlines. If there are none, split on `. `.                                                                                                                                            |

## Stack & dependencies

- Approved: **Vite + React** (SPA, no Next.js) · TypeScript strict · Tailwind · ESLint · Prettier · Vitest + RTL · Playwright · **epubjs**. pnpm through corepack.
- `react-router` (v8, data router in SPA mode) for client-side routing and route guards.
- TypeScript is pinned to `~6.0`: `typescript-eslint` doesn't support TS 7 yet (its peer range is `<6.1`).
- **Not** approved, so not used: TanStack Query, zod, MSW. Replacements:
  - Data layer: one small `useApi()` hook in `src/lib/api/` that returns loading/error/data/refetch. Fetching happens inside this one hook, not scattered across components.
  - Boundary validation: hand-written type guards for each response shape in `src/lib/api/types.ts`.
  - Test network mocking: `vi.stubGlobal('fetch', …)` at the boundary.
- Fonts: Baloo 2 + Nunito through a Google Fonts `<link>` in `index.html` (no dependency).
- Single-page app: tokens live in `localStorage` and the API needs a bearer header. Route components in `src/routes/` stay thin and compose `src/features/*`. The route table lives in `src/router.tsx`.
- **Data:** the frontend has no database. All data goes through the backend API (`../storybook_library_app`), which shares one PostgreSQL database with `storybook_management_app`.
- Env: `VITE_API_BASE_URL` (default `http://localhost:9999/api/v1`, the backend's `make run`).
- Dev server: `pnpm dev` → http://localhost:5173.

## Design tokens (from the design file → `src/styles/tokens.css` + Tailwind theme)

| Token                                                       | Value                                 | Use                                   |
| ----------------------------------------------------------- | ------------------------------------- | ------------------------------------- |
| `primary` / `primary-hover`                                 | #DF552E / #B8441F                     | Parent CTAs, active nav               |
| `ink` / `ink-body` / `muted` / `subtle`                     | #2D291F / #4A453B / #595959 / #8F887A | Text                                  |
| `cream` / `cream-2` / `butter` / `sun`                      | #FFFCF3 / #FFF7D7 / #FFF2CC / #FFCC08 | Surfaces, banner                      |
| `line` / `line-2` / `field` / `chip`                        | #F3E9D2 / #EDE3CB / #F6F3EC / #EFEDE8 | Borders, read-only fields, Free badge |
| `teal-50` / `teal-400` / `teal-700` / `teal-900`            | #BBE9EB / #3DBFC5 / #0B6E73 / #0B4F53 | Child view, success, Free label       |
| `lilac-50` / `lilac-300` / `lilac-900`                      | #F1E5FF / #C0ADD6 / #3A2558           | Subscription prompt                   |
| `danger-bg` / `danger-ink`                                  | #FFDCCF / #C2410C                     | Errors, Failed/Cancelled pills        |
| `night-bg` / `night-surface` / `night-text` / `night-muted` | #1E1C2A / #2C2A3D / #F4EEDC / #B9B0CC | Viewer night mode                     |

Radii: 12/14/16/18/24/28 px; pill 999px. Touch targets ≥ 48px (PRD §10). The design's 360px phone frame is the base. Layouts scale up to tablet (768) and desktop (1280): the book grid goes 2 → 3 → 4 columns, and content is capped at 960px.

## Auth & view-mode state (`src/features/session/`)

- `localStorage`: `access_token`, `refresh_token`, `parent_token`, `view_mode` (`parent` | `child`).
- API client (`src/lib/api/client.ts`):
  - adds `Authorization` on every call, and `X-Parent-Token` when one is present
  - on `401 TOKEN_EXPIRED`: one shared refresh, then a single retry
  - on `401 REFRESH_TOKEN_EXPIRED` / `UNAUTHORIZED`: clear the session and go to `/login`
  - on `403 PARENT_MODE_REQUIRED`: open the PIN prompt
  - errors become `ApiError { status, code, message }`
- Switching Parent → Child: if `/me.pin_set` is false, show C1 (the "Set a PIN first" sheet). Otherwise delete `parent_token` and set `child`.
- Switching Child → Parent: show the C4 PIN prompt → `POST /me/pin/verify` → store `parent_token`. On `INVALID_PIN`, show the remaining tries. On `TOO_MANY_ATTEMPTS`, lock the keypad and show a 60s countdown. **Forgot PIN?** → password field → `POST /me/pin/forgot`.
- Route guards (layout routes in `src/router.tsx`): `<RequireAuth>` sends signed-out users to `/login`. `<ParentOnly>` keeps Child view out of `/books/:id` (detail), `/books/:id/checkout`, `/subscription/*`, and `/settings/*` by redirecting to `/`.

## Screens & routes

| Route                     | Design             | Parent | Child | Data                                  | Notes                                                                                                                                                                                                                                  |
| ------------------------- | ------------------ | ------ | ----- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                  | A1                 | ✓      | —     | `POST /auth/login`                    | Shows the `INVALID_CREDENTIALS` message inline. No sign-up/forgot-password links. Lands in Parent view.                                                                                                                                |
| `/`                       | A2 / C2            | ✓      | ✓     | `/me`, `/books`, `/subscription/plan` | Parent: price/Free/Owned under each card + subscribe banner. Child: teal theme, "Pick a story!", no prices. Tapping a locked book in Child view → C3 modal.                                                                            |
| `/books/[id]`             | A3 / A4            | ✓      | ✗     | `/books/:id`, `/subscription/plan`    | Buttons follow `access` (contract table). Buy Now → `POST /book-orders` → `/books/:id/checkout` (order passed in router state; there is no `GET` for one order).                                                                       |
| `/books/[id]/checkout`    | A5 → A6 / A7       | ✓      | ✗     | order + book                          | Pay is disabled while in flight. `402` → A7. `409 BOOK_UNAVAILABLE` → notice + Home. Success → A6 with Read Now.                                                                                                                       |
| `/subscription`           | B1 / B2            | ✓      | ✗     | `/me`, `/subscription/plan`           | Free: offer + Checkout. Active: plan card + Cancel → bottom-sheet confirm (B2).                                                                                                                                                        |
| `/subscription/checkout`  | A5-style → A6 / A7 | ✓      | ✗     | sub order                             | On success, refetch `/me` so the badge flips without a reload.                                                                                                                                                                         |
| `/my-books`               | B3 / C5            | ✓      | ✓     | `/me/books`                           | Parent: list rows with "Bought {date}" + Read. Child: card grid. Empty state → "Go to Home".                                                                                                                                           |
| `/books/[id]/read`        | D1 / D2            | ✓      | ✓     | `/books/:id/content` (blob)           | epubjs `Rendition` in paginated mode. Back/Next disabled at the ends. "Page X of Y" counts EPUB sections (one page per section, picture books). Day/Night themes. `403 BOOK_LOCKED` → friendly locked screen (no price in Child view). |
| `/settings`               | B4                 | ✓      | ✗     | `/me`                                 | Edit name (`PATCH /me`, required). Email is read-only. Links to PIN / Subscription / Order history / Subscription history. Log out.                                                                                                    |
| `/settings/pin`           | B5                 | ✓      | ✗     | `PUT /me/pin`                         | 4-digit, entered twice. The password field appears only when `pin_set`.                                                                                                                                                                |
| `/settings/orders`        | B6                 | ✓      | ✗     | `/book-orders`                        | Paid/Failed pills, newest first, empty state.                                                                                                                                                                                          |
| `/settings/subscriptions` | B7                 | ✓      | ✗     | `/subscriptions`                      | Active/Cancelled/Expired pills, type New/Renewal, empty state.                                                                                                                                                                         |

Every data screen has loading (skeleton cards), empty, error (message + Retry), and success states. Covers and EPUBs are fetched as blobs and shown through `URL.createObjectURL` (revoked on unmount). While a cover loads, the card shows the design's flat colour, picked from a fixed palette by hashing the book id.

## File plan

```
index.html                          # font links, #root
src/main.tsx                        # SessionProvider + RouterProvider
src/router.tsx                      # route table + RequireAuth / ParentOnly guards
src/routes/                         # one thin file per screen: Login, Home, MyBooks, BookDetail, Reader, BookCheckout,
                                    # Subscription, SubscriptionCheckout, Settings, SettingsPin, OrderHistory, SubscriptionHistory, NotFound
src/routes/AppLayout.tsx            # AppShell (header + <Outlet/> + bottom nav)
src/components/ui/                  # Button, TextField, Pill, Sheet (dialog), PinBoxes, Keypad, ScreenHeader, EmptyState, ErrorState, Skeleton
src/features/session/               # SessionProvider, useSession, ViewModeToggle, PinPrompt, SetPinFirstSheet
src/features/shell/                 # AppHeader (badge + toggle), BottomNav (3 tabs parent / 2 tabs child), SubscribeBanner
src/features/books/                 # BookCard, BookGrid, useCover, BookDetail, LockedBookModal
src/features/checkout/              # CheckoutSummary, PaymentResult
src/features/subscription/          # SubscriptionOffer, SubscriptionManage, CancelSheet
src/features/my-books/, settings/, history/
src/features/reader/                # BookViewer (epubjs)
src/lib/api/                        # client.ts, endpoints.ts, types.ts (guards), useApi.ts
src/lib/format.ts                   # formatIDR (Intl id-ID), formatDate
src/styles/tokens.css
tests/e2e/                          # Playwright specs, run against the real backend + seeded books
scripts/seed-books.py               # dev only
```

## Slices (each ends with tests + typecheck + lint green, then a commit)

1. **Scaffold:** `create-vite` (react-ts), strict TS, React Router, Tailwind tokens, fonts, Vitest/RTL, Playwright, Prettier, `git init`.
2. **API client + session + login/logout:** refresh, parent token, guards. Tests: client refresh/retry, login errors.
3. **Shell:** header badge, view toggle, PIN flows (C1, C4, forgot, lockout), bottom nav. Tests: toggle rules (US-03).
4. **Home:** parent + child grids, cover blobs, locked modal, subscribe banner.
5. **Book detail + book checkout + payment results** (US-06, US-09).
6. **Subscription:** offer, checkout, manage, cancel (US-10, US-11).
7. **My Book** (US-08).
8. **Settings, PIN, order & subscription history** (US-12–14).
9. **Book viewer:** epubjs, day/night, 403 (US-07).
10. **Seed script + Playwright happy paths:** buy a book; subscribe → cancel; parent → child → PIN back; read a book. Screenshots at 375 / 768 / 1280.

## Test plan

- Unit (Vitest): `formatIDR`, the API client (attaches headers, refreshes once on concurrent 401s, redirects on refresh expiry), and the type guards.
- Component (RTL, `fetch` stubbed): BookCard lock/Free/Owned rules × view mode, Book Detail buttons per `access`, PinPrompt (wrong PIN, lockout, forgot), Checkout double-tap → one request, empty/error states.
- E2E (Playwright, real backend on :9999 after the seed script; Playwright `webServer` starts `pnpm dev` on :5173): the four flows in slice 10.
- Until the backend is ready, slices 1–9 rely on the stubbed-`fetch` component tests. E2E and browser checks wait for the backend.

## Out of scope

Admin app (E1–E5), sign-up, forgot/reset password, child profiles, offline, read-aloud, real payment gateway.

## As built

- **Checkout routes:** `/books/:id/checkout` and `/subscription/checkout` instead of `/checkout/*/[orderId]`. The API has no endpoint to read one order, so the order travels in router state. Reloading a checkout page goes back to the book or the offer page.
- **Reader paging:** epubjs `locations` gave wrong totals for short picture-book pages, so the label counts sections. A long text section still pages with Next/Back but keeps one number. Switch to `locations` if text-heavy books are added.
- **Reader font:** pages render in an iframe, so the Baloo 2 stylesheet is injected there without blocking the page.
- **Dev data:** `scripts/seed-books.py` uploads the six design books (cover PNG + 5-page EPUB each) through the admin API. Re-running it skips books that already exist.
- **Known console noise:** epubjs's sandboxed iframe makes Chrome log "Blocked script execution in 'about:srcdoc'" (EPUB scripts are blocked on purpose) and a deprecated `unload` warning. The E2E error watcher allows only these two.
