# Template conventions

This is a Next.js 15 (App Router) / React 19 storefront template built on
`@opencals/storefront-sdk`. These conventions keep the template fast and
maintainable. They apply to every template in `templates/` — this file is meant
to be copied across them (only the template name / branding differs).

## Data fetching

**RSC-first.** Read data on the server and pass it down. Do NOT fetch cacheable
data in a `useEffect` on the client.

- Server reads go through `lib/server-data.ts` — `React.cache()`-wrapped helpers
  (`getStoreSettings`, `getProducts`, `getProduct`) that call the SDK directly.
  `React.cache` dedupes calls within a request. Never import `lib/server-data.ts`
  from a `'use client'` file.
- `app/layout.tsx` is an async Server Component: it fetches store settings once
  and seeds `<Providers initialSettings={...}>`. `SettingsProvider` takes the
  value as a prop — it does not fetch.
- Read-only pages (e.g. `app/services/page.tsx`) are async Server Components that
  fetch with `lib/server-data.ts` and hand the result to a small `'use client'`
  child as `initialProducts` / `initialProduct`.

**Client reads use SWR, seeded with server data.** For data that genuinely needs
to live on the client (filtering, availability, add-ons, cart), use `useSWR`
against the template's own `/api/*` routes, with `fallbackData` set to the
server-rendered value so there's no loading flash on first paint.

- Shared fetcher: `lib/fetcher.ts`.
- Build the SWR key from its inputs and pass `null` when not ready (e.g. no date
  picked yet) so nothing fetches prematurely. Multiple SWR hooks run in parallel
  — never chain fetches through sequential `useEffect`s.
- `revalidateOnFocus: false` unless you specifically want refocus revalidation.

The `/api/*` routes stay: they are the client/SWR data source and call the SDK
server-side via the `@/lib/opencals` side-effect import.

## Components & files

**Pages compose; components implement.** A `page.tsx` should be: data fetching
(RSC) + layout/composition + wiring. Presentational blocks and interactive
widgets live in `components/`.

- Guideline: any `page.tsx` over ~150 lines, or one that defines a section /
  widget component, gets decomposed into `components/`.
- Group `components/` by route/domain: `components/booking/`, `components/account/`,
  `components/services/`, `components/home/`; shared primitives in `components/ui/`.
  Co-locate a route's private components under a matching subfolder
  (e.g. `components/account/appointment-detail/`).

**Never define a component inside another component** — it remounts on every
parent render. Define at module scope (or a separate file). Module-scope sibling
helpers below a page are fine.

**Use the shared UI primitives — don't hand-style buttons/inputs inline.**
- `components/ui/button.tsx` — `<Button variant size fullWidth>` and `<ButtonLink>`
  (a `next/link` with the same classes). Variants: `primary` (cobalt), `ink`,
  `outline`, `ghost`, `marigold` (only for the day sheet's suggestions). Sizes
  `sm|md|lg`. Buttons are **rectangles** (2px corners) — Gable's canonical shape;
  don't introduce pills. Pass only layout classes (`mt-*`, `flex-1`, `gap-*`) via
  `className`; colour/padding/tracking come from the variant/size.
- `components/ui/field.tsx` — `<Field>`, `<Input>`, `<Textarea>`, `<Select>` for form fields.
- `components/ui/chip.tsx` — selectable chips (selected = ink fill + marigold underline).
- Leave genuinely-different controls inline: selection/toggle chips with an
  active/selected state (staff/time/day/variant/location/department pickers, step
  indicator/progress, pagination), destructive buttons (no destructive variant),
  `<select>`, checkboxes/radios, icon-only controls, and navigation rendered as
  `next/link` `<Link>` (Button renders a `<button>` and has no anchor mode).

**Hooks are single-concern.** Split multi-purpose hooks so each has one
responsibility and independent dependencies (see `hooks/use-house-availability.ts`,
`hooks/use-payment-providers.ts`, `hooks/use-cart-expiry.ts`). A large hook may
remain as a thin orchestrator that composes the smaller ones (`hooks/use-checkout.ts`).

## Re-render hygiene

- **Memoize context provider values** with `useMemo` — an inline `value={{...}}`
  object makes every consumer re-render on each provider render. All contexts here
  (`settings`, `location`, `timezone`, `cart`) follow this.
- Hoist static objects (default non-primitive props, option lists) to module-level `const`s instead of recreating them inline.
- `React.memo` leaf components that take stable props and render often
  (e.g. the planner's time and length chips).
- Prefer a ternary (`cond ? <x/> : null`) over `cond && <x/>` for conditional
  rendering, to avoid accidentally rendering `0`/`''`.

## Bundle

- Load heavy / below-the-fold components with `next/dynamic`. Stripe is loaded
  this way in `components/checkout/checkout-view.tsx` (`StripePayment`, `ssr: false`)
  so it isn't in the initial bundle.
- Import directly from module paths; avoid barrel/index re-export files that pull
  in more than you use.

## Gable — desks, rooms, booths and studios over one multi-house store

Read `DESIGN.md` first: the "Drawing set" design system (sheets, title blocks, hatch for occupied time,
dimension lines for lengths, marigold for the one thing chosen) and the motion vocabulary. Don't add motion
outside it, and don't reuse another template's components or fonts.

**Data (`lib/workspace.ts`).** `buildCatalogue` turns the store into houses (store locations), spaces (one
product variant each, at exactly one house, no staff, no pool → the *Self* rule) and extras (add-ons). The kind
comes from the collection (`siteConfig.kinds[].collection`). Seats: `maxGuests + 1` for rooms, studios, events and
offices; `maxAttendees` for the flex floor (one product per house, a team books several seats with
`numberOfAttendees`); one for booths and studio desks. The description's `Level:` and `Kit:` lines are parsed.
`lib/server-data.ts` (`getCatalogue`, `getHouse`, `getSpace`) is the only server entry point.

**Availability.** `app/api/houses/[houseId]/availability` → `lib/availability-server.ts` reads every space at
the house once with `getCurrentAvailabilitiesMerged` (no date = the whole horizon), concurrency 3, retry on 429,
`unstable_cache` 60 s with tags `availability`, `space:<id>`, `house:<id>`, and returns packed
`[startMin, lengthMin, attendees, maxAttendees]` spans. Merged ranges report the **peak** attendees over each
merged span, so "seats left" is conservative. All derived state (fits, free now, next free, seats left, start
times, day strip) is in `lib/workspace-time.ts` on the client (`hooks/use-house-availability.ts`). **Never fetch
availability per day or per space from the client.** `/api/book`, cancel, reschedule and cart-item removal call
`revalidateTag`.

**Booking UI.**
- `/book` → `components/planner/planner.tsx` (+ `hooks/use-planner.ts`: URL state `house, kind, date, start,
  length, people, space`, remembered house) → result rows → `space-composer.tsx` (day bar, start times, extras,
  Add to day sheet). `space-booking-panel.tsx` is the same composer embedded on `/spaces/[slug]`.
- The cart is the **day sheet** (`components/day-sheet/*`, `hooks/use-day-sheet.ts`): a timeline per day,
  extras, discounts, hold timer, total; suggestions come from `lib/upsell.ts` (desk around meetings, booth in a
  gap, lunch/coffee, bigger room swap, parking). Phone: `day-sheet-bar.tsx` + drawer.
- `/checkout` → `components/checkout/checkout-view.tsx` + `hooks/use-checkout.ts` (save customer → save answers
  `{questionId, question, answer}` → start → submit with `markAsScheduled` → checkout-token sign-in). Guests
  (meeting invitees) are appointment guests.
- `/thank-you` → `components/confirmation/*` (day printout with the section drawing `house-section.tsx`, invite
  guests, .ics from `lib/ics.ts`). A snapshot (`lib/day-snapshot.ts`) lets guests see it after checkout.
- `/account` → `components/account/*`: the **Week plan** board (`week-board.tsx`), coming up with change time /
  stay longer / invite / cancel (`booking-actions.tsx`), receipts, profile. `lib/booking.ts` reads cart items,
  orders and appointments as one `Booking` shape. Email links to `/account/appointments/[id](/view)` redirect to
  `/account?booking=&action=`.
- `/preview/[screen]` renders the post-booking screens from fixtures built on the live catalogue
  (`lib/preview-fixtures.ts`; dev, or `GABLE_PREVIEW=1`).

## Verifying changes

- `npx tsc --noEmit`, `npm run lint`, `npm run build` must pass. Read-only pages should be `○` / `●` / `ƒ` Server
  Components, not client pages.
- Smoke test: the home "Free right now" board fills from one availability request per house; `/book` switches
  day, length, start and people without new API calls; add a room, then accept "A desk around your meetings" from
  the day sheet; check out with pay at the house; `/thank-you` shows the printout; `/account` shows the Week plan
  and Change time / Cancel work; `/preview` lists the fixture screens.
