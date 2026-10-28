# Gable — "Drawing set"

Gable runs six workspaces in restored buildings across Dublin, Cork and Galway. The site is designed as the
**architect's drawing set for those buildings**: every page is a sheet, every summary is a title block, durations are
dimension lines, occupied time is hatched like a cut wall on a plan. It should feel precise, calm and well made:
premium the way a good building is, not the way a luxury brand is.

## Concept, from the business's own objects

| Object on a drawing | What it does on the site |
|---|---|
| **Sheet** with a number (`GA-104`) and a title strip | Every page section. The strip runs across the top with the sheet number in a boxed cell, the sheet title, grid references A–F, and a note (a count, a scale) on the right. |
| **Title block** (the boxed table in the corner) | Every summary: the day sheet total, a space's data sheet, order details, the footer. |
| **Hatching** (45° lines = cut material) | Occupied time on the day sheet, booked blocks in "Week plan", sold-out days, busy tags. |
| **Dimension line** `├── 2 h ──┤` | Booking length, opening hours, any span. It stretches when the length chip changes. |
| **Plan symbols** (a room with a door swing, a bench with chairs) | The icon for each kind of space; the locator showing where a space is in the house. |
| **The highlighter** (marigold) | The one thing you chose: the selected time, the selected chip's underline, the active nav link. |

## Tokens

- Paper `#F6F6F2` (page) · sheet `#FFFFFF` (cards, fields) · paper-deep `#ECECE5` (bands, hovers)
- Ink `#121633` (blue-black, all text and frames) · mute `#5C6182` · faint `#8D91AA` · line `#D9DCE6` · line-strong `#B9BED0`
- **Cobalt `#2A44D4`** — the brand: primary buttons, links, plan drawings, the brand bands. cobalt-deep `#18268C`, wash `#E7EBFA`.
- **Marigold `#F4B63F`** — the highlighter only: the selection, never decoration. marigold-soft `#FBE3AE`.
- Free `#16A06A` (+ wash) for "free now" dots and tags. Alert `#C43D2B` for errors only.

Type:
- **Bricolage Grotesque** (600) for display: `t-hero`, `t-h1`, `t-h2`, `t-h3`. Tight tracking, no italics, no coloured accent words.
- **Onest** for UI and body text.
- **Azeret Mono** for annotations: sheet numbers, `t-label` (11px uppercase, tracked), figures and prices in tables (`t-num`).

Shape: corners at 2px. 1px hairlines; frames in ink, inner rules in line-strong. **No drop shadows**, except the
2px offset ink line under a primary button that it "sits down" onto when pressed. Buttons are rectangles.

## Components (components/ui)

`Button` / `ButtonLink` (primary, ink, outline, ghost, marigold) · `Chip` (selectable; selected = ink fill + marigold
underline; unavailable = struck through) · `Tag`, `StatusDot` · `Input`, `Textarea`, `Select`, `Field` · `Sheet`,
`SheetStrip`, `SheetNumber`, `SheetHeading` · `DimensionLine`, `DimInline` · `TitleBlock` · `Stepper` · `Dialog`,
`Drawer` (native `<dialog>`) · `Price` / `formatMoney` · `PlanIcon` (7 kinds) · `Logo` / `GableMark` · `Figure`
(photo with caption strip, or a drawn elevation / plan fallback, so a missing photo never shows a broken image).

## Motion (the whole vocabulary)

1. **Draw-on**: SVG line drawings (the map, the elevation, plan locators, the wayfinding route) draw their strokes when
   they appear (`.draw-on`, stroke-dashoffset).
2. **Dimension stretch**: a dimension line animates its width when the booking length changes.
3. **Hatch sweep**: a block that becomes occupied is hatched left to right (`.hatch-sweep`, clip-path).
4. **Highlighter wipe**: the marigold underline wipes in under a chosen value (`.highlight-wipe`).

Nothing else: no fade-up or blur reveals, no parallax, no marquees, no count-ups, no smooth-scroll library, no page
transitions, no magnetic buttons. All of it respects `prefers-reduced-motion`.

## Layout and rhythm

- Max width 1360px, gutters 16/24/40px. A 12-column grid; headings take 7 columns, leads 5, bottom-aligned.
- Sections alternate **paper sheets** (content) with **cobalt or ink sheets** (one strong statement each) and
  **full-bleed photographs** with a caption strip in mono (`Dock House, level 4 · 09:40`).
- Lists are tables more often than cards: rows with hairline rules, a plan icon on the left, figures in mono on the
  right. Where cards appear, they are framed cells of one grid sharing borders (like a drawing schedule), not floating
  rounded cards.

## Navigation

A normal sticky top header: logo · **Spaces ▾** (a mega menu drawn as a schedule of the seven kinds, each with its plan
icon, plus a cobalt "Day sheet" cell) · Houses · Extras · Pricing · Teams · account · **Plan your day** (primary, with
the day sheet's item count in a marigold box). Under it, the thin **house bar**: "Working from **Dock House** ▾ ·
open until 20:00". The house is global context, remembered in the browser; the planner and kind pages start from it.
On phones the links move into a right-hand drawer. There is no bottom navigation bar.

## Booking (classic and usable)

`/book` works like a search: a query bar (house, a date strip, start time, length as chips with a dimension line,
people) and results as rows of spaces that fit, each with photo, seats, kit, the price for that span and a plain
state ("Free" / "Next free 14:30"). Picking a space opens its day column of plain tappable start times right there,
with its extras. The **day sheet** (the cart) is a right rail on desktop and a bottom sheet on phones: a vertical
timeline of the day with each booking as a block, the total and the primary action always visible. Upsell lives in
the day sheet's gaps and in "fits better" swaps.

## Confirmation and account

- **Thank-you = the printed Day sheet**: a drawing sheet with a title block (reference, house, date), the day's
  timeline, a wayfinding locator with a dashed route from the entrance, arrival notes and Wi-Fi, add to calendar,
  invite guests, book again.
- **Account = "Week plan"**: a seven-column week board with each booking as a hatched block, above an upcoming list
  with change time, extend, add guests, cancel and rebook.

## How this differs from every other template

| | Gable | Siblings |
|---|---|---|
| **Concept** | An architect's drawing set: sheets, title blocks, hatching, dimension lines, plan symbols | HAAR/Clarity editorial serif, Frisør apothecary labels, VOLT dark sport hall, Alba dental chart, Tensile timetable, NOIR black luxury, Fluently stickers, Lumbung villa |
| **Palette** | Cobalt + marigold on cool paper; the only blue template | Black + orange (VOLT), black + gold (NOIR), paper + bottle green (Frisør), porcelain + lagoon (Alba), plaster + ink (Tensile) |
| **Type** | Bricolage Grotesque, Onest, Azeret Mono — none used before | See the ban list in the skill |
| **Navigation** | Header + Spaces mega menu as a schedule of plan icons + a global **house bar** | VOLT club chooser, Alba chart rail, Frisør shop tabs; none has a persistent "working from" bar |
| **Section rhythm** | Numbered sheets with a title strip and grid references; schedules (shared-border grids, tables) instead of card rows | Eyebrow pill → H2 → three cards (Clarity, HAAR), paper/green bands (Frisør), full-bleed dark bands (VOLT) |
| **Booking interaction** | Search-results planner: query bar → fitting spaces → inline day column; multi-item **day sheet timeline** with upsell in its gaps | VOLT hall map + court grid, Frisør 3-step menu + "Your chair", Tensile class sheet, Alba chair-time track; step accordions + sticky summary card elsewhere |
| **Confirmation artifact** | The printed **Day sheet** with a wayfinding route drawn from the front door | Tickets (VOLT, earlier templates), flippable appointment card (Alba), oval cartouche label (Frisør) |
| **Account** | "Week plan" board with hatched blocks | Ticket list (VOLT), recall ring (Alba), sticker book (Alba Kids) |
| **Motion** | Draw-on lines, dimension stretch, hatch sweep, highlighter wipe | The shared motion kit (reveals, parallax, marquee, Lenis, page wipes), Alba's gleam/aperture/split-flap |
| **Shapes** | 2px corners, rectangular buttons, ink frames, no shadows | Pills (Clarity/HAAR), 2px outline + offset sticker shadows (Fluently), square keyline buttons (Frisør) |
