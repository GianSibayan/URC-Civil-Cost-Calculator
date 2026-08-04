> ## Note for Future Devs — Redeployment
> This repo is public and not taking new collaborators. To get your own copy running:
> 1. Fork this repo on GitHub
> 2. Clone your fork, checkout `local-dev` for local work
> 3. Vercel dashboard → New Project → Import Git Repository → pick your fork
> 4. Set your env vars — see [Access & Auth](#access--auth) for what's needed (login won't work and price edits will silently fail without them)
>
> The live deployment here keeps auto-deploying as-is, mainly so `admin.html` price edits still work — but nobody's actively maintaining it. More detail in [Handover](#handover-for-future-interns).

---

# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool that replaces the department's Excel-based workflow (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`). Engineers input building parameters and get detailed cost estimates; admins manage the price database through a protected panel.

## Status
🚧 In active development

**July 2026:**
- Fixed Total Nodes formula — was summing footings instead of multiplying (grid intersections), undercounted by ~9× in testing
- No. of Stories now actually scales Gross Area/Volume
- Total Pallet Slots rebuilt on cited industry standards (pallet dimensions, aisle-width bands, OSHA clearance)
- Top Clearance added to Rack Levels (OSHA sprinkler buffer)
- Isle Width now classifies aisle type instead of feeding the footprint formula directly; fixed a separate bug where Isle Width wasn't being read by the formula at all
- New: Practical Pallet Capacity (Operational Buffer %)
- Fixed a duplicate, still-broken copy of the Nodes calc inside the "save to history" function
- Footing & Pedestal merged into a 4th tab on the Building Calculator (was its own separate module)
- Tooltips rebuilt as hover-bubbles across all tabs
- New file: `URC_CCC_Building_Calculator.xlsx` — Excel mirror of the Building Calculator with a cited References tab
- Source Excel (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`) bugs fixed directly: wrong Pallets/m² link, fractional Rack Levels, wrong C25/30 price lookup, missing Excavation/Forms formulas, unscaled Concrete/Rebar costs
- **Major bug fixed:** the 5 buildings shared item arrays by reference, so only RM Warehouse was actually independently priced — fixed with `cloneItems()`. Making/Converting/PUB/Admin's Shell/Interior/Mechanical/Electrical rows now read as unpriced and need real pricing re-entered (see Known Blockers)
- Structural Components gained an 11th component, Indirect Costs & Overhead (was silently excluded before)
- All 11 component descriptions rewritten to name their actual WBS items
- `labor_rates.json` expanded 15 → 30 roles (4 new ones flagged as estimated, not directly sourced)
- Fixed a stale comment incorrectly claiming daily rates needed ×8 — they didn't
- **Open question, not resolved:** are the 5 buildings physically distinct? Flagged for Sir Tony
- New page: `estimate_summary.html` — read-only Financial Ledger + Structural Components + full BOQ breakdown
- Master Estimator now serializes its full line-item breakdown, not just totals
- BOQ search on the Summary page redesigned down to a single search box
- Structural Components card (10 components) added to the Summary page
- WBS items now individually editable; default items locked (code can't drift, can't be removed); every item has a stable ID so row insert/remove can't corrupt saved costs
- Four scope groups ported from the source Excel that were missing: Site Clearance, Others, Other Buildings, Engineering & Construction Management
- Contingency/Undefined Cost scorecards rewritten: typed % per row, averaged (not summed) — per Sir Tony's direction
- New Escalation Scorecard tab (placeholder criteria, awaiting Sir Tony's real rubric)
- Escalation moved from a manual field on `calculator.html` to CES's scorecard
- Selection popover / BOQ panel / Full Screen button given clearer, labeled controls
- Footing & Pedestal is now quantities-only, no pricing (avoids double-counting against CES's Foundations row); added Rebar Weight, Excavation Volume, Forms Area outputs

**Prior session:**
- CES's BOQ side panel rebuilt into three views: single item, category roll-up, all-categories overview
- Lines regrouped by type (Materials / Labor / Lump Sum) instead of inline tags
- Hover tooltips added for truncated line text
- Panel now re-renders live regardless of which view is open
- Styling fixes (category card colors, WBS label colors)
- A resizable BOQ panel was prototyped and explicitly reverted
- Itemized per-line detail still isn't saved to History (Known Blocker #19, unchanged)

**Two sessions ago:**
- `history.html` audited and re-synced with the current record shape
- Escalation % now actually renders in History; Grand Total formula label fixed
- Lump Sum moved from the Labor card to the Cost Estimate Scope card
- Fixed a duplicate `goBackMain()` that was re-triggering auto-logout on `history.html`
- Retheme pass (contrast fixes, dimension labels)
- Known limitation, deferred: Labor by Role in History is still aggregated, not itemized per line

**Three sessions ago:**
- Financial Ledger built in `calculator.html`, reading live from Master Estimator
- Live currency conversion added (Frankfurter API, offline cache)
- Save Estimate unified across both pages into one History record
- Fixed a percentage bug (scorecards were computing 100× too large)
- Minor dropdown-overflow and focus-ring fixes

**Four sessions ago:**
- Master Estimator rebuilt end-to-end: multi-line data model, Selection popover, collapsible categories, scorecards as tabs, design system extracted (`CCC_DESIGN_LANGUAGE.md` / `ccc-design-system.css`)

---

## What This App Does

> **Where the formulas come from:** the building formulas in this app might still be wrong somewhere — `URC_CCC_Building_Calculator.xlsx` is there so you can actually check. It's a clean Excel mirror of the Building Calculator with named-range formulas and a **References tab** citing 13 sources (pallet dimensions, aisle-width standards, OSHA clearance rules, etc.) — verify against it before trusting a number. The original file this app replaced, `WAREHOUSE_BUILDING_CALCULATOR.xlsx`, is the other reference point; some of its formulas were buggy too and got fixed directly in both places (see Status), so don't assume either file is gospel — cross-check.

**1. Building Calculator** (`calculator.html`)
Engineer inputs dimensions, structure selections, bay spacing, and capacity parameters. Auto-calculates floor area, building volume (scaled by stories), footing count (Total Nodes), rack levels, pallet footprint, an aisle-width classification (VNA / Narrow Aisle / Wide Aisle), and both theoretical-max and practical (buffered) pallet capacity live. Right panel shows a live isometric SVG diagram of the building plus the **Financial Ledger**.

Currency conversion lives inside the Financial Ledger as a live, API-driven "Convert to" dropdown — there's no separate manual conversion tab.

**2. Footing & Pedestal Calculator** (`calculator.html`)
Computes concrete volume, rebar weight, excavation volume, and formwork area from footing/pedestal dimensions and rebar ratio/steel density. **Quantities only — no pricing.** CES's Foundations WBS row (one per building) is the single place a peso figure for foundations should exist; pricing here would double-count it.

Building Calculator and Footing & Pedestal share one continuously scrolling page and one pill tab bar (Dimension / Structure / Capacity / Footing).

**3. Master Estimator Worksheet** (`cost_estimate_scope.html`)
Line-item cost builder replicating the Cost Estimate Scope sheet, organized by scope category (Site Clearance, Yard & Underground, Yard Utilities, Plant Utilities, Substation & Power, RM Warehouse, Making, Converting, PUB, Admin Building, Others, Other Buildings, Indirect Costs). Hosts the **Contingency**, **Undefined Cost**, and **Escalation** scorecards as in-page tabs, and the **Save Estimate → History** flow. WBS items are individually editable, but default items' codes and their ability to be removed are both locked, so nothing that keys off them (Structural Components, in particular) can silently drift.

**4. Estimate Summary** (`estimate_summary.html`)
Read-only report combining the Financial Ledger, a **Structural Components** breakdown (the same costs, regrouped by physical building system instead of scope category), and the full Bill Of Quantities. Nothing here is editable — every number is sourced from CES or calculator.html, never recomputed.

**5. Labor & Resources** (`labor_resources.html`) — *deprecated, not deleted*
Labor costing now happens directly inside Master Estimator (each scope-item line can be a Labor line). This file still exists but nothing links to it or reads its old storage keys (`urc_ccc_labor_2026`, `urc_ccc_labor_ready`). Delete outright or leave it dormant — see Known Blockers.

**6. Master Estimator's Scorecards** (in-page tabs inside `cost_estimate_scope.html`)
Three qualitative scoring tools — **Contingency**, **Undefined Cost**, and **Escalation** — each broken into criteria, each criterion broken further into reference descriptions, and **every description is its own row with its own typed 0–100 percentage**. The subtotal is the **average** across every row, not a sum, hard-capped at 100. Escalation currently has one placeholder criterion pending real guidance from Sir Tony. The old standalone `contingency_scorecard.html` page is superseded — see Known Blockers.

**7. Admin Panel** (`admin.html`)
Protected price management interface. View, edit, add rows, import Excel/CSV, and export all 14 category price lists. Includes an Annual Escalation tool.

**8. Estimate History** (`history.html`)
Renders saved estimate records: Building Calculator snapshot, Master Estimator's full cost/category/labor breakdown, all three scorecards, and `escalationPct`.

---

## Master Estimator — Implementation Detail

### Data model

```js
// gridState[itemKey] = array of lines. itemKey is item.id, not array position
// — see "WBS item editability" below for why that distinction matters.
gridState['yard-underground__0__0'] = [
  { matId: 'concreting_materials_3', qty: '10', labId: '', headcount: '', days: '', lumpSum: '' },
  { matId: '', qty: '', labId: 'mason', headcount: '2', days: '3', lumpSum: '500' }
];
```

Each **scope item** (a WBS row) can hold any number of lines, added/removed independently. A line is exactly one of:

- **Material** — `matId` + `qty`. Unit and Unit Cost come from the matching category JSON in `/data/`.
- **Labor** — `labId` + `headcount` + `days`. Cost = `headcount × days × dailyRate`. `dailyRate` is a plain per-day figure — no ×8 conversion happens anywhere.
- **Lump Sum** — a flat `lumpSum` amount, addable on top of any line, including one with no material or labor selected (for pure flat-quote items like bonds/insurance/mobilization).

`Total Cost` per line = `(qty × unitCost)` or `(headcount × days × dailyRate)`, plus `lumpSum`.

### WBS item editability

Every WBS item — default or custom — has a stable `item.id`, assigned once at page load and never recomputed from array position:

- **Default items** get `id = ${categoryId}__${sectionIndex}__${itemIndex}` — matches the old positional key exactly, so worksheets saved before this feature existed still resolve correctly.
- **Custom items** get `id = custom-${timestamp}-${random}`.

`gridState`, `selectedItem`, and totals are all keyed by `item.id`, never by position — so inserting or removing a row never reattaches another item's saved cost data to the wrong item.

| | Description | WBS Code | Remove |
|---|---|---|---|
| Default item | editable | locked, plain text | locked, no ✕ shown |
| Custom item | editable | editable | removable, with confirm if it has priced lines |

The code lock exists because Structural Components sums specific WBS codes (e.g. `105`/`110`/`120` → Substructure) across all five buildings — a drifted code would silently miss an item.

**Persistence — `urc_ces_scope_overrides`:**
```js
{ added: [{ id, catId, sectionIdx, code, desc }], edited: { [itemId]: { code, desc } }, removed: [itemId] }
```
`removed` is effectively unused now — default items can't reach it (blocked before removal even runs), and custom-item deletions route through `added`'s filter instead. `hydrateScopeStructure()` clears it on every load, so any default item removed before this fix existed reappears automatically.

### Grid layout

Columns: `WBS | Scope Description | Selection | Qty | Unit | Unit Cost (₱) | Lump Sum (₱) | Total Cost (₱) | Add Row`. Quantity reshapes per line type — a single number for Material, a `Headcount | Days` split for Labor. Each section gets one TOTAL row at the bottom. Categories are collapsible.

### BOQ side panel — three views

| View | Trigger | Shows |
|---|---|---|
| **Item** | Click a WBS code or Scope Description cell | That item's lines, grouped Mat/Lab/Lump Sum |
| **Category** | Click the category header bar, or the section row beneath it | Every priced item in the category |
| **All categories** (default) | Page load; click ✕; click outside the grid/BOQ workspace | Every priced category as its own card |

Category and section clicks both roll up to the whole category, not just the clicked section. Lines are grouped by type (Mat/Lab/Lump Sum headings), not tagged per-line. Every line and the Selection button carry a `title` attribute with the full untruncated text for hover.

Outside-click detection uses `event.composedPath()`, not `e.target.closest()` — clicking a category header re-renders the grid mid-click, which detaches the clicked row from the DOM before the event finishes bubbling; `closest()` on a detached node silently returns nothing.

> A horizontally resizable version of this panel was built, tested, and explicitly reverted — not a missing feature if it comes up again.

### Selection — why not a native `<select>`

A native `<select>` can't support a checkbox-style category filter, live search-as-you-type, or staying open while the page scrolls underneath it. Selection instead opens a single shared floating popover (`#selection-popover`, one instance for the whole page):

- Search input, filters by name as you type
- A single-select category filter ("All" + "Labor" + each of the 14 material categories)
- Search bypasses the category filter entirely while active
- `position: fixed` — stays open while the grid's own scroll container scrolls underneath it
- Closes on: picking an option, clicking outside, or `Escape`

### Performance

Two changes address DOM bloat on a ~300+ item worksheet:

1. **Categories collapse by default** — a collapsed category renders zero rows into the DOM, not just CSS-hidden ones.
2. **Selection uses one shared popover instead of a native `<select>` per row** — the previous per-row `<select>` approach measured out to ~59,000 `<option>` elements sitting in the DOM at once with a ~220-item materials list.

### Scorecards (Contingency, Undefined Cost, Escalation)

All three live as in-page tabs inside `cost_estimate_scope.html`, not separate pages.

- `scorecardRows(criteria)` flattens each criterion's descriptions into individually-scoreable rows (Contingency: 4 criteria × 4 descriptions = 16 rows; Undefined Cost: 3 × 4 = 12).
- Every row gets its own `<input type="number">`, 0–100. `setScoreValue()` clamps on entry; `scorecardSubtotal()` clamps again as a second line of defense.
- Subtotal = **average across every row in the whole scorecard**, blanks counted as 0 — never a sum.
- Escalation is a third scorecard, same mechanism, currently one placeholder criterion (`ESCALATION_CRITERIA`), fully wired end-to-end.
- Selections persist as `urc_ces_scorecard_selections = { contingency: {}, undefinedCost: {}, escalation: {} }`, keyed by row id. Each subtotal also writes to its own cross-page key (`urc_ces_contingency_subtotal`, etc.) for the Ledger pages to read. Units: whole-number percentage (`8` = 8%), not a fraction.
- Escalation is read-only on `calculator.html` — `getEscalationPct()` in CES is the only place it's set now.

### Save Estimate → History

The Save button (in either page's header) enables once both flags are true:

- `urc_ccc_calc_ready` (calc.html: Length, Width, Clear Height all > 0)
- `urc_ccc_ces_ready` (CES: Defined Cost > 0, Project Title + Prepared By filled)

There's no cross-tab listener — a flag written in one open tab won't live-update a different tab's button until that tab's own state next changes.

Project Title, Prepared By, Plant, Estimate Type, Date, and Mean Spending Date are always read from CES's header metadata (`urc_ces_meta`). Both pages build an identical History record from the shared `urc_ces_cross_page` snapshot — kept in sync by hand across both files, since there's no shared module system.

Grand Total = `Defined Cost × (1 + Undefined% + Escalation% + Contingency%)`. On confirm, the record is pushed to `urc_ccc_history`.

### Excel export

`exportToExcelBOQ()` — one exported row per line, header block (Project Title, Plant, Prepared By, Date) pulled from the metadata bar.

---

## Building Calculator — Financial Ledger Implementation Detail

```
Raw Total                = Material Cost + Labor Cost (+ Lump Sum, via CES's Defined Cost)
Undefined Cost Subtotal  = Raw Total × Undefined%      (from CES's Undefined Cost scorecard)
Escalation                = Raw Total × Escalation%    (from CES's Escalation scorecard)
Risk Funds (Contingency) = Raw Total × Contingency%    (from CES's Contingency scorecard)
Estimated Grand Total    = Raw Total × (1 + Undefined% + Escalation% + Contingency%)
```

Everything on this card is read-only, sourced from `urc_ces_cross_page` and the three `urc_ces_*_subtotal` keys. There is exactly one place any of the three percentages ever gets typed.

**Two different "Undefined Cost" concepts exist and are not the same thing:** the old Excel's "UNDEFINED ALLOWANCES" line items (Field Instructions / Unlisted Items / Post Start-up, each a manually-typed %) are a different rubric from CES's Undefined Cost scorecard (Project Complexity / Technology / Completeness of Definition — an AACE-style classification score). The scorecard is the intended replacement for the old line-item %s — worth confirming with Sir Tony if it ever comes into question.

### Footing & Pedestal — quantities only, no pricing

The source Excel never actually computed a final peso total for footing/pedestal either — every rate existed but nothing multiplied them together. All pricing was removed instead; CES's Foundations WBS row (one per building) is the one place that total should exist — a parallel total here would double-count it.

```
Concrete Volume    = (Footing Vol + Pedestal Vol) × Nodes
Rebar Weight       = Concrete Volume × Rebar Ratio × Steel Density
Excavation Volume  = Footing Length × Footing Width × Excavation Depth × Nodes
Forms Area         = (2×(FL+FW)×FD + 2×(PL+PW)×PH) × Nodes
```

Excavation Volume assumes the dig matches the footing footprint exactly, no working-clearance margin — worth confirming standard practice with whoever reviews the numbers. Forms Area assumes vertical-side formwork only.

### Storage Capacity

```
Rack Levels                = FLOOR((Rack Height − Bottom Clearance − Top Clearance) / Rack Level Height)
Pallet Footprint           = Pallet Depth × Pallet Width
Aisle Width Classification = VNA / Narrow Aisle / Wide Aisle, from Isle Width against cited forklift bands
Total Pallet Slots         = FLOOR(Floor Area × Storage Efficiency % × (1 − Dock/Staging %) ÷ Pallet Footprint × Rack Levels)
Practical Pallet Capacity  = FLOOR(Total Pallet Slots × Operational Buffer %)
```

Every number here is a secondary industry source (equipment vendor pages, logistics blogs, OSHA-citing safety guides), cited on the companion Excel's References tab — a reasonable starting point for sanity-checking, not a substitute for URC's actual rack vendor specs or Engr. Emir's sign-off.

**Open, unresolved:** Total Nodes' grid-intersection formula is mathematically correct for counting footings in a rectangular grid, but nobody with structural engineering authority has confirmed that's how footings actually get laid out for these buildings in practice. Worth a direct check with Sir Tony/Engr. Emir before it's trusted for real material takeoffs.

### Live currency conversion

"Convert to" dropdown (USD / EUR / JPY / SGD) under the Estimated Grand Total. `loadFxRates()` fetches from [Frankfurter](https://frankfurter.dev) — free, keyless, base PHP. Falls back to the last successful fetch cached in `localStorage['urc_ccc_fx_rates']`; shows "Rates unavailable" if neither source has a rate yet.

---

## Estimate Summary (`estimate_summary.html`) — Implementation Detail

Read-only page combining the Financial Ledger, Structural Components, and full BOQ, so nobody has to flip between CES's BOQ panel and calculator.html's Ledger. Everything here is sourced from data CES and calculator.html already write — nothing is recomputed.

### Layout

Three cards: **Financial Ledger** and **Structural Components** side by side, then **Bill Of Quantities — Full Breakdown** underneath at full width. All three share one shell and render their titles as black-outlined white badges.

### Data sources

| Card | Reads from |
|---|---|
| Financial Ledger | `urc_ces_cross_page`, the three `urc_ces_*_subtotal` keys |
| Structural Components | `urc_ces_full_breakdown` |
| Bill Of Quantities | `urc_ces_full_breakdown` |

Auto-refreshes via a `storage` event listener (fires when a different tab writes to a watched key) plus a `focus` listener as a fallback, and a manual Refresh button.

### `urc_ces_full_breakdown`

CES's `buildFullBreakdownData()` walks every priced category → item → line and serializes:
```js
{ categories: [{ label, subtotal, items: [{ code, desc, subtotal, mat, lab, lump }] }], grandTotal, updatedAt }
```
This avoids duplicating CES's ~400-item `SCOPE_CATEGORIES` structure into a second file — CES computes it once, this page just renders it.

### Bill Of Quantities

One search box filtering a two-column card grid. A category-name match keeps the whole category; an item-level match isolates just that item.

### Structural Components

Same priced WBS costs, regrouped into **11** physical building-system components: Sitework, Substructure, Superstructure, Roofing, Exterior Enclosure, Interior Finishes, Mechanical/MEP, Electrical, Equipment & Furnishings, Other Buildings, and Indirect Costs & Overhead. Each component is either a category-label match or a fixed WBS-code list; since every building shares the same common codes, a code-based component sums across all five buildings in one pass.

This stays correct only because CES locks default items' WBS codes, and only because each building's items are genuinely independent (`cloneItems()` fix — see Status).

Four borderline WBS-code groupings are flagged in Known Blockers (`125`/`175`/`195`/`199`, currently under Exterior Enclosure) — not yet reconciled with Sir Tony.

### Escalation, Undefined Cost, Contingency

Read-only here too, same reasoning as calculator.html — exactly one place each percentage ever gets set.

---

## History (`history.html`) — Implementation Detail

Each saved record renders as:

**Collapsed (4 cards):** Building Calculator, Cost Estimate Scope (lines priced, categories, material cost, Lump Sum, Defined Cost), Labor (roles used, person-days, labor cost), Scorecards (Undefined Cost %, Escalation %, Contingency %, Combined % — the actual sum of all three).

**Expanded:** Building Dimensions grid (Footing/Pedestal labeled `L×W×D` / `L×W×H` — they don't share a third dimension), Cost Estimate Scope (category totals + material/labor/lump-sum split + the three percentages), Labor by Role, and an Estimated Grand Total bar with the full formula.

**Labor by Role is aggregated Person-Days (`headcount × days`, summed), not real per-line Headcount × Days.** Once labor lines are scattered across many scope items, a role's headcount and days can't be meaningfully summed as a pair (3 masons on one item + 1 on another isn't "4 masons"). `getLaborBreakdown()` in `cost_estimate_scope.html` collapses this before the record is saved. Separately, History has no full itemized scope-item list at all — CES's own BOQ panel renders that live, but it's never serialized into the saved record. Fixing both means capturing a new itemized-line array at save time in `confirmSaveEstimate()` (both files) and `updateTotals()`. Deliberately deferred — see Known Blockers.

Record shape is a clean break from the pre-rebuild one — clear `urc_ccc_history` once if testing with stale saved data.

---

## Access & Auth

### Environment Variables (set these in Vercel — Settings → Environment Variables)

- **`USERS`** — login credentials for the app. Required for anyone to log in at all.
- **A GitHub write token** — required by `api/update-prices.js` so price edits in `admin.html` can actually commit back to GitHub. Exact env var name isn't documented here — open that file and check what it reads (`process.env.___`) before assuming a name.

Skip either one and the app will still deploy and *look* fine — login just won't work, or price edits will report success in the admin panel but never actually save. Test both after any fresh deploy.

- All users log in with a **URC email + password**
- No public access — login required for all pages
- Session stored in `sessionStorage` — clears on browser close
- Password changes: on the live deployment, that requires access to Gian's Vercel account — ask Sir Tony or Engr. Emir if that's ever needed. On your own fork, you set your own `USERS` env var directly, no one to ask.
- **Local dev bypass**: `src/auth.js` detects `localhost`/`127.0.0.1` and auto-injects a dev session — no credentials needed locally. Has no effect on the deployed URL, since `isLocalDev()` checks `window.location.hostname`; real credential checks against `api/auth.js` always apply there.

### Landing Page (`index.html`) — Two-State Hub

On load, `renderAuthState()` checks `Auth.isLoggedIn()`:

- **Logged out** → login form shown directly
- **Logged in** → hub view: **Calculator**, **Access Price List** (admin), and **Logout** buttons

`Auth.login(email, password, destination)`:
| Destination | Redirects to |
|---|---|
| `'calculator'` (default) | `/calculator.html` |
| `'admin'` | `/admin.html` |
| `'page-landing'` | `/index.html` |

### Logout — Hub Only

Logout only exists in the `index.html` hub view — not the sidebar or `admin.html`. The sidebar's **Main Page** button does plain navigation only (`window.location.href='index.html'`); it doesn't call `Auth.logout()`, so navigating around the app never ends the session by accident. Logging out is a deliberate, separate action.

> **Note:** `goBackMain()` may still exist as dead code inline in `calculator.html`, `cost_estimate_scope.html`, and `labor_resources.html` — a repo-wide check for other callers before deleting it is recommended.

### Offline Auth Behavior

- **Already logged in, connection drops** → unaffected. Session check is local (`sessionStorage`).
- **Logged out, tries to log in offline** → always fails. `Auth.login()` POSTs to `/api/auth`; with no network, the request never reaches the server. No offline login path by design.
- Log in once while you have signal — the session then holds for the rest of that browser session even if connectivity drops afterward.

---

## Offline Support (Service Worker)

`sw.js`, at the project root, registers on every page via an inline script tag.

### Strategy: Network-First

Every `GET` tries the network first; if that fails, it falls back to whatever's cached. Successful responses are cached opportunistically on every fetch, not just the precache list.

```js
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') return; // POST/auth calls always hit network directly
    event.respondWith(
        fetch(event.request).then(res => {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, res.clone()));
            return res;
        }).catch(() => caches.match(event.request))
    );
});
```

`POST` requests (login, admin price saves) always go straight to the network and fail outright with no connection — no offline queue exists for these.

### Precached on Install

All HTML pages, `src/auth.js`, `src/nav.js`, `src/parser.js`, `prices.json`, all 14 `/data/*.json` files, and the 3 CDN scripts (Tailwind, xlsx, xlsx-js-style). Each file is cached individually — one failed URL doesn't abort the whole install.

### Testing Offline Behavior

Live Server (`127.0.0.1:5500`) is loopback-only — toggling wifi does nothing locally, since the request never leaves the device. Use DevTools → **Application** tab → **Service Workers**, confirm status reads "activated and is running," then use the **Offline** checkbox to simulate no connection. Real wifi-off testing only becomes meaningful once deployed.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Styling | Tailwind CSS (CDN); `ccc-design-system.css` extracted but not yet linked into any page |
| Building diagram | Native SVG isometric renderer — no library (`renderIsoBuilding()` in `calculator.html`) |
| Excel parsing | SheetJS / xlsx-js-style (CDN) |
| Offline / caching | Service Worker + Cache API (`sw.js`, network-first) |
| Hosting | Vercel |
| Source control | GitHub |
| Price database | `prices.json` + 14 category JSONs in `/data/` |
| Auth + price saves | Vercel Serverless Functions |
| Master Estimator state | All `localStorage`, not `sessionStorage` — so a worksheet survives closing the browser |
| Currency | Philippine Peso (₱) |

### Storage keys (all `localStorage`)

| Key | Shape | Purpose |
|---|---|---|
| `urc_ces_grid_state` | `{ itemKey: [line, ...] }` | The worksheet itself — `itemKey` is `item.id` |
| `urc_ces_meta` | `{ project, plant, type, preparedBy, date, meanSpendingDate }` | Header metadata — single source of truth for project details |
| `urc_ces_collapsed_categories` | `string[]` | Which category ids are collapsed |
| `urc_ces_active_tab` | `'grid' \| 'contingency' \| 'undefinedCost' \| 'escalation'` | Last tab viewed, restored on reload |
| `urc_ces_scope_overrides` | `{ added, edited, removed }` | Custom WBS items and description edits to default items |
| `urc_ces_scorecard_selections` | `{ contingency: {}, undefinedCost: {}, escalation: {} }` | Per-row scorecard values, keyed by row id |
| `urc_ces_contingency_subtotal` | `{ subtotal, updatedAt }` — whole-number %, average | Read by both Ledger pages |
| `urc_ces_undefinedCost_subtotal` | `{ subtotal, updatedAt }` — same shape/mechanism | Read by both Ledger pages |
| `urc_ces_escalation_subtotal` | `{ subtotal, updatedAt }` — same shape/mechanism | Escalation's one source of truth |
| `urc_ces_full_breakdown` | `{ categories, grandTotal, updatedAt }` | Full itemized breakdown, written on every grid edit |
| `urc_ces_boq_collapsed` | `'true' \| 'false'` | Whether the BOQ side panel is collapsed |
| `urc_ces_cross_page` | `{ materialCost, laborCost, lumpSumCost, definedCost, categoryTotals, pricedLines, laborBreakdown, scorecards, updatedAt }` | Shared snapshot both Save buttons read from |
| `urc_ccc_calc_ready` | `'true' \| 'false'` | calc.html: Length/Width/Clear Height all > 0 |
| `urc_ccc_ces_ready` | `'true' \| 'false'` | CES's own readiness portion only — each page's button combines both flags itself |
| `urc_ccc_fx_rates` | `{ base: 'PHP', rates, date }` | Last successful FX fetch, offline fallback for the Ledger |
| `urc_ccc_state_v10` | calc.html's full state object | Dimension/structure/capacity/footing-quantity fields, `currencyTarget` |
| `urc_ccc_history` | `record[]` | Saved estimates |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html                  # Landing page — two-state hub (login form or logged-in hub)
├── calculator.html             # Building Calculator + Footing & Pedestal + Financial Ledger + Save Estimate
├── cost_estimate_scope.html    # Master Estimator — worksheet + scorecard tabs + Save Estimate
├── estimate_summary.html       # Read-only combined view: Financial Ledger + Structural Components + full BOQ
├── labor_resources.html        # DEPRECATED — labor costing now lives inside Master Estimator
├── contingency_scorecard.html  # SUPERSEDED — logic now an in-page tab in cost_estimate_scope.html
├── admin.html                  # Admin panel — price management + escalation tool
├── history.html                # Estimate History
├── sw.js                       # Service worker — offline caching (network-first)
├── prices.json                 # Core rates used in calculations
├── ccc-design-system.css       # Extracted design tokens — not yet linked into any page
├── CCC_DESIGN_LANGUAGE.md      # Style guide describing the app's intended aesthetic
├── URC_CCC_Building_Calculator.xlsx  # Reference Excel — Building Calculator formulas + cited References tab. Sanity-check tool, not a data source the app reads from.
├── data/                       # 14 price list JSONs + labor rates
│   ├── concreting_materials.json
│   ├── timber_formworks.json
│   ├── roofing.json
│   ├── steel_truss.json
│   ├── painting_works.json
│   ├── electrical.json
│   ├── masonry.json            # Has prices[] + concrete_proportion_table[]
│   ├── fencing.json
│   ├── ceiling.json
│   ├── plumbing.json
│   ├── rebars.json
│   ├── concrete_mix.json
│   ├── equipment.json          # Rate ranges: rate_min_php / rate_max_php
│   ├── pipes.json              # 3 sub-tables: nominal, seamless, ERW welded
│   └── labor_rates.json        # 30 roles — field is dailyRate, a genuine per-day figure, no ×8 needed
├── src/
│   ├── auth.js                 # Frontend session handling (requireLogin, logout, getEmail, login w/ destination routing)
│   ├── nav.js                  # Shared sidebar nav — still links to the old Contingency Score page, see Known Blockers
│   └── parser.js                # loadCategory, saveBulk, savePricesJson, downloadCategory
├── api/
│   ├── auth.js                 # Vercel serverless — validates credentials, returns token
│   └── update-prices.js        # Vercel serverless — pushes whitelisted JSON to GitHub
```

---

## Isometric Building Diagram — Implementation Detail

Native SVG isometric renderer (`renderIsoBuilding()` in `calculator.html`) — no charting or 3D library, just projection math.

**Projection.** Standard 30° isometric axes: `ISO_LEFT = {x:-0.866, y:0.5}` (Length axis), `ISO_RIGHT = {x:0.866, y:0.5}` (Width axis), height moves straight up on screen. A uniform `scale` is derived per-render from `Math.min(340 / planSpan, 160 / heightSpan)` so the drawing fits its `viewBox` regardless of building proportions.

**Mezzanine.** Height is `H × (stories − 0.5) / stories`. The slab grows along the length as % Mezzanine increases, clamped 0–100.

**Current scope:** only reflects Building Calculator's Dimension fields. Footing/Pedestal corner posts were prototyped and removed by request.

---

## Data Fetch Pattern

All JSON fetches try two sources in order:
1. **Relative path** (`/prices.json`, `/data/xxx.json`) — works on Vercel
2. **Raw GitHub fallback** — for local dev or CDN cache misses

---

## Local Development

The app has two environments: **production** (Vercel, `main` branch) and **local dev** (Live Server, `local-dev` branch).

### Running locally

No build step, no installs required:

1. Open the repo in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `localhost:5500`
4. Enter any email and password — the localhost bypass in `src/auth.js` auto-logs you in
5. Material prices load via the GitHub raw URL fallback automatically

### Branches

- **`main`** (this repo) — still the live production branch, auto-deploying to Gian's original Vercel project. Price-list edits made through `admin.html` commit here automatically and go live the same way they always did. Not open to new collaborator pushes anymore — if you want to build on the app itself, fork it instead; your fork's `main` is whatever you connect to your own Vercel project.
- **`local-dev`** — the branch pattern all intern development work used to go through before merging to `main`. Keep using this pattern in your own fork if you're continuing development.

### Working Locally on "local-dev" branch

**First time setup:**
```bash
git clone https://github.com/GianSibayan/URC-Civil-Cost-Calculator.git
cd URC-Civil-Cost-Calculator
git checkout local-dev
```

**Pulling latest changes:**
```bash
git pull origin local-dev
```

**Pushing your changes:**
```bash
git add .
git commit -m "brief description of what you changed"
git push origin local-dev
```

---

## No Build Step

Plain HTML/JS — no frameworks, no compilers, no `npm install`. Open any `.html` file directly in a browser (via Live Server), or deploy to Vercel as-is. Framework preset in Vercel dashboard must be set to **Other** (not Vite, not Next.js) — this is why `ccc-design-system.css` is plain hand-written CSS rather than using Tailwind's `@apply`, which needs a build step the CDN's runtime JIT compiler doesn't support.

---

## Known Blockers / Pending Items

1. **`labor_resources.html` disposition undecided** — deprecated in practice (nothing links to it, nothing reads its storage keys) but not deleted.
2. **`contingency_scorecard.html` disposition undecided** — its logic now lives as an in-page tab in Master Estimator; the standalone page is orphaned.
3. **`src/nav.js` still links to the old Contingency Score page** — needs updating now that it's an in-page tab, not a separate destination.
4. **`sw.js`'s `ASSETS_TO_CACHE` needs a review pass** — `contingency_scorecard.html` is superseded and no longer needs precaching for labor pricing to work.
5. **`sw.js` hasn't been directly re-verified against the Frankfurter API fetch.** The documented network-first strategy should cover it (a normal CORS GET), and there's an independent `localStorage` fallback either way — but not confirmed by reading `sw.js` itself.
6. **`ccc-design-system.css` and `CCC_DESIGN_LANGUAGE.md` aren't integrated into any page yet.** Only `calculator.html`'s input focus-ring color has been aligned so far. `calculator.html` uses entirely bespoke classes (`.dim-input`, `.struct-select`, `.field-row`) with no relationship to `.ccc-*` — a bigger migration lift than CES, which is already Tailwind-utility-based.
7. **calc.html's header Export button does nothing** — `pointer-events-none`/`opacity-40`, no `onclick`. Export to Excel already lives in CES. Safe one-line removal.
8. **Save Estimate readiness flags don't update live across tabs.** A flag written in one open tab won't refresh a different tab's button state until that tab's own state next changes.
9. **Stretch + Estimated Total Cost formulas** (Building Calculator) depend on `BuildingsBenchmarking rev 3.9 07.xlsm` on Sir Tony's machine. Currently manual input fields.
10. **Tab 3 PhilConstruct unit rates** — pending Sir Tony sharing the rate list; currently `0` in `prices.json`.
11. **Shared estimate history** — saved estimates live in each user's local browser; a GitHub-backed shared history isn't implemented.
12. **Admin write actions aren't gated for offline** — editing/saving price rows and Annual Escalation both POST to `api/update-prices.js`, which fails silently offline with no warning.
13. **No network-first timeout in `sw.js`** — a `Promise.race()` timeout wrapper is planned but not added.
14. **`goBackMain()` cleanup** — removed from `history.html`'s inline copy, but `calculator.html`, `cost_estimate_scope.html`, and `labor_resources.html` haven't been checked for their own copies. Don't assume the auto-logout bug is gone app-wide just because it's gone from History.
15. **Real-device offline test pending** — only verified via DevTools' simulated Offline mode so far.
16. **Isometric diagram doesn't reflect Footing & Pedestal** — intentionally simplified.
17. **Page header title is a placeholder** — `#header-title` currently reads "Summary (tent name)" on the older pages.
18. **Old test records in `urc_ccc_history` won't render correctly** against the rebuilt `history.html` — clear that key once if testing with stale data.
19. **History's Labor by Role is aggregated Person-Days, not real per-line Headcount × Days — and History has no full itemized scope-item list at all.** `getLaborBreakdown()` in `cost_estimate_scope.html` collapses per-line detail before the record is ever saved. Fixing it means capturing a new itemized-line array at save time in `confirmSaveEstimate()` (both files) and `updateTotals()`, then rendering it in `history.html`.
20. **Escalation Scorecard has only one placeholder criterion** — functional end-to-end but not a real rubric yet. Swap in the actual criteria via `ESCALATION_CRITERIA` once Sir Tony provides them.
21. **Structural Components' code-to-component mapping is a best-effort grouping**, based on UniFormat II adapted for a warehouse/plant context — not something Sir Tony has directly confirmed beyond one example (Footing & Pedestal → Substructure). Worth a sanity check, especially the borderline calls: `115` (grouped with the frame, not the foundation), and `125`/`175`/`195`/`199` (all currently under Exterior Enclosure despite some naming that suggests otherwise).
22. **Whether RM Warehouse/Making/Converting/PUB/Admin Building are meant to be 5 physically distinct buildings is unconfirmed.** CES's structure assumes they are; `calculator.html`'s Building Dimensions Calculator only has one set of inputs and doesn't model any of the 5 individually.
23. **Making/Converting/PUB/Admin Building's Shell/Interior/Mechanical/Electrical rows need real pricing entered** — a direct consequence of the `cloneItems()` fix (see Status). They now read as genuinely blank, and only worth filling once #22 above is answered.
24. **Four new labor rates need a sanity check before being trusted for an estimate**: HVAC Technician (₱950/day), Fire Protection/Sprinkler Fitter (₱900/day), Elevator/Escalator Technician (₱1,300/day), Low-Voltage/Communications Technician (₱800/day) — derived from salaried-annual compensation data, not sourced the same way as the other new roles.
25. **Total Nodes' grid-intersection formula is mathematically correct for counting footings in a rectangular grid, but hasn't been confirmed against how URC actually lays out footings in practice.** Worth a direct check with Sir Tony/Engr. Emir before it's used for a real material takeoff.
26. **Storage Capacity's cited references are secondary industry sources** (equipment vendor pages, logistics blogs, OSHA-citing guides), not URC's own rack vendor specs — good for sanity-checking, not a substitute for Engr. Emir's sign-off on the actual benchmarks.
27. **`WAREHOUSE_BUILDING_CALCULATOR.xlsx`'s Cost Estimate box is a genuine empty stub** — "STRETCH" and "Estimated Total Cost" labels with no formula or data behind either. Needs Sir Tony's input on what it was meant to compute. Separately, `COST ESTIMATE SCOPE!F9:F16` in the same workbook has pre-existing `#REF!` errors, unrelated and untouched.

---

## Handover (For Future Interns)

1. **Don't request collaborator access — fork it.** Nobody's actively developing the app itself anymore. The original repo/deployment stays live and keeps auto-deploying (mainly to keep `admin.html` price edits working), but it's public and not taking on new collaborators — treat it as a template to fork, not a team repo to join.
2. Fork the repo to your own GitHub account, clone your fork, and checkout `local-dev` for local development (see [Local Development](#local-development) above).
3. Deploy your fork on your own Vercel account (New Project → Import Git Repository → your fork) and set your own `USERS` environment variable — see [Access & Auth](#access--auth) above. Your deployment and credentials are independent of anyone else's from here on.
4. All price list data lives in `/data/` — edit via `admin.html`, never directly on GitHub
5. Run escalation in `admin.html` → Annual Escalation at the start of each new year
6. Sir Tony owns the Excel reference file and PhilConstruct rate list — confirm any formula questions with him directly
7. When editing `sw.js`, keep the precache list (`ASSETS_TO_CACHE`) in sync with any new pages/data files added to the app
8. Before touching `cost_estimate_scope.html`'s styling, read `CCC_DESIGN_LANGUAGE.md` — it documents the intended aesthetic and the reasoning behind it, so changes stay consistent instead of drifting

---

## Team

*Reflects who built this, not who's currently maintaining it — see [Handover](#handover-for-future-interns) above.*

| Role | Name |
|---|---|
| Backend, API, Logic, GitHub/Vercel (internship ended Aug 2026) | Gian Eugene P. Sibayan |
| Frontend UI, Figma, Logic, HTML/CSS | Althea Antonio, Paolo Sarmiento |
| Project Owner | Engr. Tony Pabilan |
| Direct Supervisor | Engr. Emir Manansala |

*ESD Global Engineering Internship Batch, URC / JG Summit Holdings*
