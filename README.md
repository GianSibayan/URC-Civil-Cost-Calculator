# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool built to replace the department's existing Excel-based workflow (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`). Engineers input building parameters and receive detailed cost estimates. Admins manage the price database through a protected panel.

## Status
🚧 In active development — July 2026 | **`history.html` audited and cleaned up** (was the top gap left by last session's Financial Ledger work — the record shape had changed and the page was never re-verified against it): scorecard per-criterion descriptions removed from the expanded view, replaced with three plain percentage rows (Undefined Cost / Escalation / Contingency) folded directly into the Cost Estimate Scope card | **Escalation % now actually renders in History** — `escalationPct` has been written at the top level of every saved record since last session but was never displayed, and the Grand Total formula label was silently missing the term entirely (`Defined Cost × (1 + Contingency % + Undefined Cost %)` instead of the real formula); both fixed, confirmed directly against `confirmSaveEstimate()` in both files rather than assumed from this doc | **Lump Sum relocated from the Labor card to the Cost Estimate Scope card** (both collapsed and expanded) — Lump Sum is addable to any line (material, labor, or standalone), not labor-specific, so it was mis-scoped | **Removed a duplicate `goBackMain()`** inline in `history.html` that called `Auth.logout()` and was defined *after* `nav.js` loads — meaning it silently shadowed `nav.js`'s already-fixed pure-navigation version and reintroduced the auto-logout-on-Main-Page bug for this page specifically, even though the app was believed fixed everywhere | Retheme pass: dark bars (row header, Grand Total) `bg-slate-700` → true grey `bg-neutral-700`; scorecard percentages and Defined Cost de-colored; Clear All changed from red to grey; fixed low-contrast grey-on-dark text in the Grand Total bar; tightened Building Dimensions' cell padding/font size; Footing/Pedestal now labeled with their actual dimension order (`L×W×D` / `L×W×H` — they don't share a third dimension) | **Known limitation root-caused and deliberately deferred, not fixed this session**: Labor by Role in History still shows aggregated Person-Days, not real per-line Headcount × Days, and History still has no full itemized scope-item list (only category-level totals + role-aggregated labor) — both trace back to `getLaborBreakdown()` collapsing per-line headcount/days *before* the record is ever saved; CES's own BOQ side panel already renders a full itemized per-line list live, it just never gets serialized. Fixing this needs a new itemized-line array captured in three places across two files (see Known Blockers) — scoped, discussed, intentionally not attempted this session | *(prior session, unchanged since)* **calculator.html's Financial Ledger is now built**: renamed from "Bill of Quantities," reads Material Cost / Labor Cost / Raw Total / Undefined Cost % / Contingency % live from Master Estimator via `urc_ces_cross_page`, adds an inputtable **Escalation %** field (replacing the old year-based admin.html auto-escalation concept for this formula), computes **Estimated Grand Total = Raw Total × (1 + Undefined% + Escalation% + Contingency%)** | **Live currency conversion** added to the Financial Ledger — a "Convert to" dropdown (USD/EUR/JPY/SGD) fetches real-time rates from the free Frankfurter API (base PHP, keyless, CORS-enabled), caches the last successful fetch to `localStorage` for offline use; the old manual Exchange Rate/Amount-to-Convert Currency tab is **removed** | **Save Estimate now lives in both calculator.html and Master Estimator** — the button only enables once *both* pages are filled in (`urc_ccc_calc_ready` AND `urc_ccc_ces_ready`), Project Title/Prepared By always read from CES's header regardless of which page's button is clicked, and both pages build an identical History record off one shared `urc_ces_cross_page` snapshot (now carries category totals, labor-by-role, and full scorecard detail, not just Defined Cost) | **Fixed a real percentage bug**: Contingency/Undefined scorecard subtotals are whole-number percentages (e.g. `8` = 8%) not fractions — the Ledger was briefly displaying/computing them 100× too large | Fixed a dropdown-overflow bug on the Structure section (`Skylights / Windows`) caused by a fixed-width `.struct-select`; unified calculator.html's input focus-ring color to the same blue accent CES uses | *(two sessions ago, unchanged since)* Master Estimator rebuilt end-to-end: multi-line-per-WBS-item data model, shared floating Selection popover, collapsible categories, Contingency/Undefined Cost scorecards as in-page tabs, `contingency_scorecard.html` superseded, design system extracted (`CCC_DESIGN_LANGUAGE.md` / `ccc-design-system.css`, still not wired into either page), `labor_resources.html` being phased out

---

## Working Locally on "local-dev" branch
**First time setup:**
git clone <repo-url>
git checkout local-dev

**Pulling latest changes from teammates:**
git pull origin local-dev

**Pushing your changes:**
git add .
git commit -m "brief description of what you changed"
git push origin local-dev


## What This App Does

**1. Building Calculator** (`calculator.html`)
Engineer inputs dimensions (length, width, clear height, stories, mezzanine %), structure selections (structure type, roof, wall cladding, slab thickness), bay spacing, and capacity parameters. App auto-calculates floor area, building volume, total connection nodes, storage area, rack levels, and total pallet positions live. Right panel (Live Output Summary) shows a live isometric SVG diagram of the building — envelope box, story-division lines, and a mezzanine slab that grows toward the opposite wall as % Mezzanine increases — plus the **Financial Ledger** (rebuilt this session, see full detail below).

The old standalone Currency Conversion tab (manual base/target/exchange-rate/amount fields) is **removed** — currency conversion now lives inside the Financial Ledger itself as a live, API-driven "Convert to" dropdown under the Grand Total.

**2. Footing & Pedestal Calculator** (`calculator.html`)
Engineer inputs footing/pedestal dimensions and selects concrete class. App auto-calculates concrete volume, rebar weight, excavation volume, formwork area, labor rate, and total cost in ₱ using rates fetched from `prices.json`.

Building Calculator and Footing & Pedestal are two sections on the **same continuously scrolling page**, each with its own local pill-tab sub-navigation. *Unchanged this session.*

**3. Master Estimator Worksheet** (`cost_estimate_scope.html`)

Structured line-item cost builder replicating the Cost Estimate Scope sheet from the Excel reference, organized by scope category (Yard & Underground, Yard Utilities, Plant Utilities, Substation & Power, RM Warehouse, Making, Converting, PUB, Admin Building, Indirect Costs). Also hosts the **Contingency Scorecard** and **Undefined Cost Scorecard** as in-page tabs, and the **Save Estimate → History** flow (now shared with calculator.html — see below).

**4. Labor & Resources** (`labor_resources.html`) — *deprecated, not deleted*
Previously a standalone page for entering headcount/days per labor role, feeding a separate cost stream into the old Save Estimate flow. **Labor costing now happens directly inside Master Estimator** (each scope-item line can be a Labor line — role, headcount, and days, priced from the same rate database). This file still exists in the repo and has not been edited, but nothing currently links to it or reads its old storage keys (`urc_ccc_labor_2026`, `urc_ccc_labor_ready`). Decide whether to delete it outright or leave it dormant — see Known Blockers.

**5. Master Estimator's Scorecards** (in-page tabs inside `cost_estimate_scope.html`)
Two qualitative scoring tools — **Contingency Scorecard** and **Undefined Cost Scorecard** — for each criterion, pick the one description that matches the project; the app sums the picked point values (verified against the source spreadsheet's real formulas — `SUM`, not an average). **Important:** the subtotal each scorecard produces is a whole-number percentage (e.g. `8` means 8%), not a fraction — this tripped up the Financial Ledger's first draft (see Known Learnings). The old standalone `contingency_scorecard.html` page is superseded by this — see Known Blockers.

**6. Admin Panel** (`admin.html`)
Protected price management interface. Admins can view, edit, save individual rows, add rows, import from Excel/CSV, and export all 14 category price lists. Core rates (concrete class prices, rebar, excavation, labor, escalation/place factors) are edited directly. Includes an Annual Escalation tool. *Unchanged this session*, except see the labor-rate-unit note under Known Blockers.

**7. Estimate History** (`history.html`)
Renders saved estimate records: Building Calculator snapshot, Master Estimator's full cost/category/labor breakdown, both scorecards with the exact description picked per criterion, and now `escalationPct`. *Not touched this session — the record shape changed again (see Storage Keys), so verify `history.html` still renders new saves correctly before relying on it.*

---

## Master Estimator — Implementation Detail

### Data model

```js
// gridState[itemKey] = array of lines. itemKey = `${categoryId}__${sectionIndex}__${itemIndex}`
gridState['yard-underground__0__0'] = [
  { matId: 'concreting_materials_3', qty: '10', labId: '', headcount: '', days: '', lumpSum: '' },
  { matId: '', qty: '', labId: 'mason', headcount: '2', days: '3', lumpSum: '500' }
];
```

Each **scope item** (a WBS row like "1.1.1 Site grading & drainage") can hold **any number of lines**, added/removed independently — not a fixed one-material-one-labor pair per row like the previous iteration. A line is exactly one of:

- **Material** — `matId` + `qty`. Unit and Unit Cost come from the matching category JSON in `/data/`.
- **Labor** — `labId` + `headcount` + `days`. Cost = `headcount × days × (dailyRate × 8)`. **Important:** the `dailyRate` field in the labor database actually stores an *hourly* rate — it's multiplied by 8 everywhere a real daily cost is needed (`computeLineCost()`, the Selection popover's display text, the grid trigger button's label). The hardcoded fallback rates in `fetchLaborRates()` (used only when the JSON fetch fails) were **not** adjusted and may already represent daily figures — worth a sanity check, see Known Blockers.
- **Lump Sum** — a flat `lumpSum` amount, addable on top of *any* line (including a line with no material or labor selected at all, for pure flat-quote items like bonds/insurance/mobilization).

`Total Cost` per line = `(qty × unitCost)` or `(headcount × days × dailyRate × 8)`, **plus** `lumpSum` either way.

### Grid layout

Columns: `WBS | Scope Description | Selection | Qty | Unit | Unit Cost (₱) | Lump Sum (₱) | Total Cost (₱) | Add Row`. WBS code and Scope Description use `rowspan` to merge across a scope item's multiple lines. Every line gets both `✕` (remove) and `+` (insert a new blank line directly below it) — not just the last line.

The Quantity cell reshapes itself based on line type: a single right-aligned number for Material, a split `Headcount | Days` pair (same font/alignment/weight as the Material input, just blue instead of amber — color is data-type signal only, never used to differentiate control state) for Labor.

Each **section** (e.g. "Yard & Underground", which is both the category and its only section) gets one inline **TOTAL** row at the bottom, summing every item in that section — not one total per WBS item. Category headers are collapsible (see Performance below); a collapsed category shows its total inline in the header bar.

### Selection — why not a native `<select>`

A plain `<select>` cannot support a checkbox-style category filter, live search-as-you-type, or staying open while the page scrolls underneath it — these are real browser limitations, not implementation choices. Selection is instead a button that opens a **single shared floating popover** (`#selection-popover`, one instance in the whole page, repositioned/repopulated per click — not one popover per row, which would reintroduce the DOM bloat described below):

- A search input, filtering by name as you type
- A **single-select radio filter** ("All" + "Labor" + each of the 14 material categories) arranged in a 3-column grid — only one narrows the list at a time, since a line can only be one material or one labor role anyway
- While actively searching, the radio filter is bypassed entirely (search looks across everything regardless of which category is selected) — clearing the search returns to whatever was radio-selected
- `position: fixed`, appended once near the top of `<body>` — this is what keeps it open while the grid's own scroll container scrolls underneath it; native `<select>` dropdowns close on document scroll in most browsers, which was the specific complaint that led to this rebuild
- Closes on: picking an option, clicking outside it, or `Escape`

Selection's trigger button and the popover's option list are both plain neutral/black text — color-coding by data type (amber = material, blue = labor) lives **only** on the Quantity inputs, not on the Selection text itself.

### Performance

Two changes address DOM bloat on a ~300+ scope-item worksheet:

1. **Categories collapse by default** (all except the first, on first visit) — a collapsed category renders *zero* rows into the DOM, not just CSS-hidden ones. Collapse state persists (`urc_ces_collapsed_categories`).
2. **Selection is no longer a native `<select>` per row.** The previous iteration rebuilt a full materials+labor `<option>` list (hundreds of entries) for *every single row* — with a ~220-item materials list, that measured out to ~59,000 `<option>` elements sitting in the DOM simultaneously. The popover approach means **zero** `<option>`-equivalent elements exist in the main grid at all; the option list only gets built once, lazily, when the popover is actually opened.

### Scorecards (Contingency + Undefined Cost)

Both live as **in-page tabs** inside `cost_estimate_scope.html` (`tab-panel-contingency` / `tab-panel-undefined`), not separate pages — switching tabs swaps the visible content area only; the header metadata bar stays put, and the BOQ side panel + grid search/Clear controls hide themselves since neither applies to a scorecard.

**Mechanism**, verified against `Sample_TEMPLATE_1.xlsx`'s actual formulas (`CONTINGENCY!D9 = SUM(D4:D8)`, `UNDEFINED COST!C8 = SUM(C5:C7)`) — **not** an average of every description's value:

- Contingency: 4 criteria — Site, Resources (Construction/Engineering/Business), Schedule, Pricing — each with 4 real description options and point values pulled directly from the source sheet.
- Undefined Cost: 3 criteria — Project Complexity, Technology, Completeness of Definition — same pattern.
- For each criterion, click the one description that matches the project. The subtotal is the **sum** of the picked values, shown live per scorecard.
- Selections persist per-scorecard (`urc_ces_contingency_selections`, `urc_ces_undefined_selections`) and each scorecard's subtotal is written to its own cross-page key (`urc_ces_contingency_subtotal`, `urc_ces_undefinedCost_subtotal`) for `calculator.html`'s Financial Ledger to read. **Units matter here**: `subtotal` is a whole-number percentage (`8` means 8%), not a fraction (`0.08`) — the Ledger's first draft assumed the latter and briefly displayed/computed 100× too large before this was caught and fixed.

This replaces the old Contingency Scorecard's free-form 0–100-per-category "Score Input" design (see prior README/manual and the old `contingency_scorecard.html`), which didn't match how the source spreadsheet actually works.

### Save Estimate → History

**Save Estimate now lives in both `calculator.html` and `cost_estimate_scope.html`** — the button in either page's header enables only once *both* pages are filled in:

- `urc_ccc_calc_ready` (calc.html: Length, Width, Clear Height all > 0) **and**
- `urc_ccc_ces_ready` (CES: Defined Cost > 0, Project Title + Prepared By both filled)

Each page recalculates and writes its own flag as the person types; each page's Save button reads both flags before enabling. There's no cross-tab listener — if both pages are open in separate tabs simultaneously, a flag written in one tab won't live-update the other tab's button until that tab's own state next changes (see Known Blockers).

Project Title, Prepared By, Plant, Estimate Type, Date, and Mean Spending Date are **always read from CES's header metadata** (`urc_ces_meta`) — never re-entered in calculator.html. Its confirmation modal mirrors those fields read-only, plus a live preview of Defined Cost, Contingency %, Undefined Cost %, **Escalation %** (read from calc.html's own state), and the Estimated Grand Total (`Defined Cost × (1 + Undefined% + Escalation% + Contingency%)`).

**One shared snapshot, two Save buttons.** To make the two buttons produce byte-identical History records, `urc_ces_cross_page` was expanded from just `{ definedCost }` into a full snapshot — category totals, labor-by-role breakdown, priced-line count, and both scorecards' subtotal *and* full per-criterion detail (see Storage Keys). CES's own `confirmSaveEstimate()` still computes its portion live for freshness; calculator.html's copy reads the same cross-page snapshot instead of recomputing CES's numbers itself. **Both copies must be kept in sync by hand** — there's no shared module system (no build step), so this is duplicated logic across two files. If `urc_ces_cross_page`'s shape changes again, update both `confirmSaveEstimate()` functions together.

On confirm (from either page), the record is pushed to `urc_ccc_history` (unchanged key) with `escalationPct` now included alongside the existing fields.

### Excel export

`exportToExcelBOQ()` still works — unchanged this session. Handles multi-line items (one exported row per line), pulls the header block (Project Title, Plant, Prepared By, Date) from the metadata bar instead of a hardcoded placeholder.

---

## Building Calculator — Financial Ledger Implementation Detail

The right-panel card formerly called "Bill of Quantities" is now the **Financial Ledger** — rebuilt this session to match the bottom summary section of `Sample_TEMPLATE_1.xlsx` (`SAMPLE 1` sheet, rows 82–96), confirmed against its actual formulas rather than guessed:

```
Raw Total                = Material Cost + Labor Cost (+ Lump Sum, via CES's Defined Cost)
Undefined Cost Subtotal  = Raw Total × Undefined%      (from CES's Undefined Cost scorecard)
Escalation                = Raw Total × Escalation%    (typed directly in this card)
Risk Funds (Contingency) = Raw Total × Contingency%    (from CES's Contingency scorecard)
Estimated Grand Total    = Raw Total + Undefined Cost + Escalation + Risk Funds
                          = Raw Total × (1 + Undefined% + Escalation% + Contingency%)
```

**Everything except Escalation is read-only, sourced from CES.** Material Cost, Labor Cost, and Raw Total come from `urc_ces_cross_page`; Undefined % and Contingency % come from `urc_ces_contingency_subtotal` / `urc_ces_undefinedCost_subtotal`. Escalation % is the one live input on this card — it replaces the old admin.html year-based auto-escalation concept for this formula specifically (admin.html's own Annual Escalation tool, which re-prices `prices.json` line items, is unrelated and untouched).

**Two different "Undefined Cost" concepts exist in the source material, and they are not the same thing:** the Excel's bottom-section "UNDEFINED ALLOWANCES" line items (Field Instructions / Unlisted Items / Post Start-up, each a manually-typed %) are a *different* rubric from CES's "Undefined Cost" scorecard tab (Project Complexity / Technology / Completeness of Definition, an AACE-style estimate-classification scoring system). The scorecard is understood to be the intended **replacement** for the old manual line-item %s — both feed the same slot in the Grand Total formula, just via a more structured method — consistent with why the Contingency scorecard replaced its own old free-form 0–100 input. Worth confirming this reading with Sir Tony if it ever comes into question.

### Live currency conversion

A "Convert to" dropdown (USD / EUR / JPY / SGD) sits under the Estimated Grand Total. `loadFxRates()` fetches live rates from [Frankfurter](https://frankfurter.dev) (`https://api.frankfurter.dev/v1/latest?base=PHP&symbols=USD,EUR,JPY,SGD`) on page load — free, keyless, CORS-enabled, ECB reference rates, confirmed to cover all four target currencies. Base is always PHP (everything in the Ledger is computed in ₱); there's no manual exchange-rate entry anymore.

**Offline behavior, two layers deep:**
1. `sw.js`'s documented network-first + cache-everything-on-success strategy should transparently cache this GET like any other request — **not independently re-verified this session**, see Known Blockers.
2. Independently of that, the last successful fetch is written to `localStorage['urc_ccc_fx_rates']` and used as a fallback if the live fetch fails for any reason. If neither layer has a rate yet (e.g. first-ever load with no connection), the converted-total line shows "Rates unavailable" rather than a stale or wrong number.

The old Currency Conversion tab (Base Currency / Target Currency / Exchange Rate / Amount to Convert, manual entry) is **removed** from Building Calculator entirely — it's fully superseded by this.

---

## History (`history.html`) — Implementation Detail

Rewritten to match Master Estimator's new record shape (two sessions ago), then given a visual and data-accuracy pass this session — verified against the actual `confirmSaveEstimate()` / `updateTotals()` code in both `cost_estimate_scope.html` and `calculator.html` directly, rather than assumed from this doc. Each saved record renders as:

**Collapsed (4 mini-cards):** Building Calculator (unchanged), Cost Estimate Scope (lines priced, categories, material cost, **Lump Sum — moved here this session**, Defined Cost), Labor (roles used, total person-days, labor cost — **Lump Sum removed, see below**), Scorecards (Undefined Cost %, **Escalation % — added this session**, Contingency %, Combined % — now genuinely the sum of all three, matching the real Grand Total formula for the first time).

**Expanded:** Building Dimensions grid (cell padding/font size tightened this session; Footing/Pedestal now labeled `L×W×D` / `L×W×H` respectively, since Footing uses Depth and Pedestal uses Height as its third dimension and the two were previously shown identically), Cost Estimate Scope (category totals + material/labor/lump-sum split, **plus Undefined Cost / Escalation / Contingency as three plain percentage rows folded in this session**, see below), Labor by Role (aggregated across every scope item that used that role — unchanged limitation, see note below), and an Estimated Grand Total bar (background `slate-700` → true grey `neutral-700`; label/formula text was low-contrast grey-on-dark and is now `white/70`/`white/50`; the formula string itself was silently missing the Escalation term and now correctly reads `Defined Cost × (1 + Undefined Cost % + Escalation % + Contingency %)`).

**Scorecard descriptions removed from the expanded view.** The full per-criterion description table (previously its own `expandedScorecards()` block) is gone — an engineer only needs that text once, at pick-time, inside Master Estimator itself. Only the three final percentages (Undefined Cost, Escalation, Contingency) remain, now living as plain rows inside the Cost Estimate Scope card rather than a separate block.

**Escalation was already being saved and simply never rendered.** `escalationPct` has been written at the top level of every saved record since the Financial Ledger session (`confirmSaveEstimate()` in both `cost_estimate_scope.html:789` and `calculator.html:812`), but `history.html` never displayed it, and the Grand Total formula label omitted the term. Both fixed.

**Lump Sum moved from the Labor card to the Cost Estimate Scope card.** Lump Sum is addable to any line — material, labor, or standalone (bonds, mobilization, etc.) — not labor-specific, so showing it under "Labor" implied a scoping it doesn't have. It now sits alongside Material Cost in the CES card, both collapsed and expanded.

**Color pass:** dark bars (row header, Grand Total) changed from `bg-slate-700` (navy) to `bg-neutral-700` (true grey) for cohesion with the rest of the app; scorecard percentages, Defined Cost, and the Clear All button (previously red) were all de-colored/greyed to match — color is meant to be the one functional accent elsewhere in the app, not scattered decoratively across this page. Note this is a deliberate departure from `CCC_DESIGN_LANGUAGE.md`'s documented `slate-700` for dark category bars — worth reconciling if/when `history.html` is migrated onto `ccc-design-system.css` for real (see Known Blockers #7).

**Removed a duplicate `goBackMain()`.** `history.html` had its own inline `goBackMain()` calling `Auth.logout()`, defined in a `<script>` block *after* `nav.js` loads — meaning it silently shadowed `nav.js`'s already-fixed pure-navigation version and reintroduced the auto-logout-on-Main-Page bug for this page specifically, even though the app was believed fixed everywhere. Deleted; `history.html` now relies entirely on `nav.js`'s Main Page button like every other page.

**Labor-by-role note (limitation confirmed, intentionally left as-is this session):** the old shape assumed one central labor roster (`{ role, rate, count, days }` from a single page). Now that labor lines are scattered across many different scope items, a role's headcount and days can't be meaningfully summed into one pair (3 masons on one item + 1 mason on another isn't "4 masons"). Labor is instead aggregated by **Person-Days** (`headcount × days`, summed — the one honestly-additive unit) with a pre-computed subtotal per role, not re-derived from summed count × summed days. This session traced the root cause precisely: `getLaborBreakdown()` in `cost_estimate_scope.html` (line ~627) collapses headcount/days into Person-Days *before* the record is ever saved, and it's called from both `confirmSaveEstimate()` and `updateTotals()`'s cross-page snapshot — by the time anything reaches `history.html`, per-line headcount/days are already gone. Separately, CES's own BOQ side panel (`~line 1330`) already renders a full itemized per-line list live (material/labor/lump-sum tags per WBS item) — but that itemized detail is never serialized into the saved record either, only category-level totals and role-aggregated labor are. Fixing both properly (real per-line Headcount × Days, and a full itemized scope-item list in History) would require capturing a new itemized array at save time in **three places across two files** — `confirmSaveEstimate()` in both `cost_estimate_scope.html` and `calculator.html`, plus `updateTotals()`'s `urc_ces_cross_page` snapshot. Scoped and discussed; **deliberately deferred**, not attempted this session. See Known Blockers.

**Record shape is a clean break** from the pre-rebuild one — old test records saved before that rebuild won't render correctly against this page. Clear `urc_ccc_history` once if you have old test data sitting around.

---

## Access & Auth

- All users log in with a **URC email + password**
- No public access — login required for all pages
- User credentials stored in Vercel environment variable (`USERS`)
- Session stored in `sessionStorage` — clears on browser close
- Password changes: contact Gian (Vercel owner) to update the `USERS` env var
- **Local dev bypass**: `src/auth.js` detects `localhost` / `127.0.0.1` and auto-injects a dev session — no credentials needed locally. This bypass has **no effect on Vercel** — `isLocalDev()` checks `window.location.hostname`, which will never equal `localhost`/`127.0.0.1` on the deployed URL, so real credential checks against `api/auth.js` always apply there.

### Landing Page (`index.html`) — Two-State Hub

`index.html` no longer just shows a login form. On load, `renderAuthState()` checks `Auth.isLoggedIn()` and renders one of two states:

- **Logged out** → login form shown directly (no button click needed to reveal it)
- **Logged in** → hub view: **Calculator**, **Access Price List** (admin), and **Logout** buttons

`Auth.login(email, password, destination)` accepts three destination values:
| Destination | Redirects to |
|---|---|
| `'calculator'` (default) | `/calculator.html` |
| `'admin'` | `/admin.html` |
| `'page-landing'` | `/index.html` (re-renders as the logged-in hub) |

### Logout — Hub Only

**Logout lives only in the `index.html` hub view.** It is intentionally *not* duplicated into the sidebar (`src/nav.js`) or `admin.html`. This was a deliberate decision: the sidebar's **Main Page** button was originally wired through `goBackMain()`, which called `Auth.logout()` on every click — meaning simple navigation back to the hub silently ended the session every time. This is now fixed:

- **Main Page** (sidebar, and in `admin.html`) → plain navigation only (`window.location.href='index.html'`), session stays alive
- **Logout** → exists as its own explicit button in the `index.html` hub, calling `Auth.logout()` directly

Net effect: clicking around the app never logs anyone out by accident. Logging out is a deliberate, separate action, matching how most session-based apps behave (stay logged in across navigation; explicit action to sign out).

> **Note:** `goBackMain()` may still exist as dead code inline in `calculator.html`, `cost_estimate_scope.html`, and `labor_resources.html` (it is not centralized in `auth.js`). Since nav.js's Main Page button no longer calls it, a repo-wide check for other callers before deleting it is recommended — see Known Blockers.

### Offline Auth Behavior

- **Already logged in, connection drops** → unaffected. Session check is local (`sessionStorage`), no network call required to stay logged in.
- **Logged out, tries to log in offline** → always fails, regardless of whether the credentials are correct. `Auth.login()`'s real branch POSTs to `/api/auth`; with no network, the request never reaches the server. There is no offline login path by design — this is a hard requirement of server-side credential validation, not a bug.
- **Practical guidance for engineers:** log in once while you have signal; the session then holds for the rest of that browser session (until the tab/browser closes) even if connectivity drops afterward.

---

## Offline Support (Service Worker)

`sw.js`, at the project root, registers on every page via an inline `<script>` tag at the bottom of each HTML file. *Unchanged this session* — see the Known Blockers note about `ASSETS_TO_CACHE` needing a review pass now that `contingency_scorecard.html` is superseded and Master Estimator's own scope changed.

### Strategy: Network-First

Every `GET` request tries the network first; if that fails (offline), it falls back to whatever's cached. Successful responses are cached opportunistically on every fetch — not just the precache list — so any page a user has visited while online becomes available offline afterward, even beyond the initial precache set.

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

`POST` requests (login, admin price saves) are explicitly untouched by the service worker — they always go straight to the network and fail outright if there's no connection. No offline queue exists for these yet (see Known Blockers).

### Precached on Install

All HTML pages, `src/auth.js`, `src/nav.js`, `src/parser.js`, `prices.json`, all 14 `/data/*.json` files, and the 3 CDN scripts (Tailwind, xlsx, xlsx-js-style). Caching is per-file (`cache.add()` with individual `.catch()`), not `cache.addAll()` — a single failed URL (e.g. a CDN hiccup) no longer aborts the entire install.

### Testing Offline Behavior

Live Server (`127.0.0.1:5500`) is loopback-only — toggling your machine's wifi off/on has **no effect** on whether it loads, since the request never leaves the device. To actually test offline behavior locally, use DevTools → **Application** tab → **Service Workers**, confirm status reads "activated and is running," then use the **Offline** checkbox (Application or Network tab) to simulate no connection. Real wifi-off testing only becomes meaningful once deployed to the live Vercel URL.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Styling | Tailwind CSS (CDN); `ccc-design-system.css` extracted as a reusable stylesheet but not yet linked into any page |
| Building diagram | Native SVG isometric renderer — no library (`renderIsoBuilding()` in `calculator.html`) |
| Excel parsing | SheetJS / xlsx-js-style (CDN) |
| Offline / caching | Service Worker + Cache API (`sw.js`, network-first) |
| Hosting | Vercel |
| Source control | GitHub (private repo) |
| Price database | `prices.json` + 14 category JSONs in `/data/` |
| Auth + price saves | Vercel Serverless Functions |
| Master Estimator state | All `localStorage`, not `sessionStorage` — see full key table below. This is a change from the pre-rebuild design (`sessionStorage['urc_ces_session']`), made so a person's worksheet survives closing the browser, matching how the grid/scorecard/meta state is expected to be used. |
| Currency | Philippine Peso (₱) |

### Storage keys (all `localStorage`)

| Key | Shape | Purpose |
|---|---|---|
| `urc_ces_grid_state` | `{ itemKey: [line, ...] }` | The worksheet itself |
| `urc_ces_meta` | `{ project, plant, type, preparedBy, date, meanSpendingDate }` | Header metadata bar — **single source of truth** for project details on both Save Estimate buttons |
| `urc_ces_collapsed_categories` | `string[]` | Which category ids are collapsed |
| `urc_ces_active_tab` | `'grid' \| 'contingency' \| 'undefinedCost'` | Last tab viewed, restored on reload |
| `urc_ces_contingency_selections` | `{ criterionId: choiceIndex }` | Contingency Scorecard picks |
| `urc_ces_undefined_selections` | `{ criterionId: choiceIndex }` | Undefined Cost Scorecard picks |
| `urc_ces_contingency_subtotal` | `{ subtotal, updatedAt }` — `subtotal` is a **whole-number percentage** (`8` = 8%), not a fraction | Read by calculator.html's Financial Ledger |
| `urc_ces_undefinedCost_subtotal` | `{ subtotal, updatedAt }` — same units as above | Read by calculator.html's Financial Ledger |
| `urc_ces_cross_page` | `{ materialCost, laborCost, lumpSumCost, definedCost, categoryTotals, pricedLines, laborBreakdown, scorecards: { contingency: {subtotal, criteria}, undefinedCost: {subtotal, criteria} }, updatedAt }` | **Expanded this session** from just `{ definedCost }` into a full snapshot — both pages' Save Estimate buttons read this one object so their History records match exactly |
| `urc_ccc_calc_ready` | `'true' \| 'false'` | calc.html: Length/Width/Clear Height all > 0. Restored this session — was briefly removed, needed again now Save Estimate is dual-gated |
| `urc_ccc_ces_ready` | `'true' \| 'false'` | CES's own portion only (Defined Cost > 0 + Project + Prepared By) — does **not** factor in calc readiness; each page's button combines both flags itself |
| `urc_ccc_fx_rates` | `{ base: 'PHP', rates: {USD,EUR,JPY,SGD}, date }` | **New this session** — last successful Frankfurter API fetch, offline fallback for the Ledger's currency conversion |
| `urc_ccc_state_v10` | *(calc.html's own full state object)* | Read by CES's and calc.html's own save functions for the calculator snapshot |
| `urc_ccc_history` | `record[]` | Saved estimates — shape gained `escalationPct` this session |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html                  # Landing page — two-state hub (login form OR logged-in hub + Logout)
├── calculator.html             # Building Calculator + Footing & Pedestal + Financial Ledger (renamed from Bill of Quantities, rebuilt this session) + Save Estimate, both on one scrolling page
├── cost_estimate_scope.html    # Master Estimator — worksheet + Contingency/Undefined Cost tabs + Save Estimate
├── labor_resources.html        # DEPRECATED — labor costing now lives inside Master Estimator; nothing links here
├── contingency_scorecard.html  # SUPERSEDED — logic now lives as an in-page tab in cost_estimate_scope.html; nothing links here either. Candidate for deletion, see Known Blockers.
├── admin.html                  # Admin panel — price management + escalation tool
├── history.html                # Estimate History — NOT re-verified against this session's record shape change (escalationPct added), see Known Blockers
├── sw.js                       # Service worker — offline caching (network-first)
├── prices.json                 # Core rates used in calculations
├── ccc-design-system.css       # NEW — extracted design tokens + component classes; not yet linked into any page
├── CCC_DESIGN_LANGUAGE.md      # NEW — written style guide / AI prompt describing the app's aesthetic
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
│   └── labor_rates.json        # Labor role rates — field is named dailyRate but stores an HOURLY figure; ×8 for real daily cost, see Master Estimator detail above
├── src/
│   ├── auth.js                 # Frontend session handling (requireLogin, logout, getEmail, login w/ destination routing)
│   ├── nav.js                  # Shared sidebar nav component — still links to Contingency Score / History; the Contingency Score link needs updating or removing now that it's an in-page tab, see Known Blockers
│   └── parser.js                # loadCategory, saveBulk, savePricesJson, downloadCategory
├── api/
│   ├── auth.js                 # Vercel serverless — validates credentials, returns token
│   └── update-prices.js        # Vercel serverless — pushes any whitelisted JSON to GitHub
```

---

## Isometric Building Diagram — Implementation Detail

*Unchanged this session.*

The Live Output Summary's bar chart (Chart.js) was replaced with a native SVG isometric diagram — no charting or 3D library, just projection math in `renderIsoBuilding()`.

**Projection.** Standard 30° isometric axes: `ISO_LEFT = {x:-0.866, y:0.5}` (Length axis), `ISO_RIGHT = {x:0.866, y:0.5}` (Width axis), height moves straight up on screen. A single uniform `scale` is derived per-render from `Math.min(340 / planSpan, 160 / heightSpan)` so the drawing always fits its `viewBox` regardless of building proportions.

**Mezzanine.** Height is `H × (stories − 0.5) / stories`. The slab grows along the length as % Mezzanine increases, clamped 0–100 before it reaches the drawing math.

**Reactive to both calculator modules.** `renderIsoBuilding()` is called inside `updateUI()`.

**Current scope:** only reflects Building Calculator's Dimension fields. Footing/Pedestal corner posts were prototyped and removed by request — see git history if revisited.

---

## Data Fetch Pattern

All JSON fetches try two sources in order:
1. **Relative path** (`/prices.json`, `/data/xxx.json`) — works on Vercel
2. **Raw GitHub fallback** (`https://raw.githubusercontent.com/GianSibayan/URC-Civil-Cost-Calculator/main/...`) — fallback for local dev or CDN cache misses

---

## Local Development

The app has two environments: **production** (Vercel, `main` branch) and **local dev** (Live Server, `local-dev` branch). All intern UI work happens locally on `local-dev` and is merged to `main` when ready for deployment.

### Running locally

No build step, no installs required:

1. Open the repo in VS Code
2. Right-click `index.html` → **Open with Live Server**
3. App opens at `localhost:5500`
4. Enter any email and password — the localhost bypass in `src/auth.js` auto-logs you in
5. Material prices load via the GitHub raw URL fallback automatically

### Branches

- **`main`** — production branch; Vercel auto-deploys every push here; do not push directly
- **`local-dev`** — all intern development work goes here; merge to `main` when ready for production

### Working Locally on "local-dev" branch

**First time setup:**
```bash
git clone https://github.com/GianSibayan/URC-Civil-Cost-Calculator.git
cd URC-Civil-Cost-Calculator
git checkout local-dev
```

**Pulling latest changes from teammates:**
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

Plain HTML/JS — no frameworks, no compilers, no `npm install`. Open any `.html` file directly in a browser (via Live Server), or deploy to Vercel as-is. Framework preset in Vercel dashboard must be set to **Other** (not Vite, not Next.js). This constraint is why `ccc-design-system.css` is plain hand-written CSS rather than using Tailwind's `@apply` — that directive needs a build step and won't work through the Tailwind CDN's runtime JIT compiler.

---

## Known Blockers / Pending Items

1. **`labor_resources.html` disposition undecided** — deprecated in practice (nothing links to it, nothing reads its storage keys) but not deleted. Decide: delete it, or leave it dormant as a reference.
2. **`contingency_scorecard.html` disposition undecided** — same situation. Its logic now lives as an in-page tab in Master Estimator; the standalone page is orphaned.
3. **`src/nav.js` still links to the old Contingency Score page** — needs updating now that it's an in-page tab inside Master Estimator, not a separate destination.
4. **Fallback labor rates may be inconsistent with the real database.** The hardcoded fallback object in `fetchLaborRates()` (e.g. `ncr: 695`, `mason: 700`, `welder: 815`) was not adjusted for the "field is actually hourly" fix — if these numbers were already meant to represent daily figures, they'll now compute unrealistically high (e.g. ₱5,560/day) when the ×8 multiplier is applied. Worth verifying against the real `admin.html`-sourced data.
5. **`sw.js`'s `ASSETS_TO_CACHE` needs a review pass** — `contingency_scorecard.html` is superseded, and Master Estimator's own dependencies changed (it no longer needs a separate labor page to be pre-cached for its labor lines to work, since labor pricing is now bundled into its own fetch).
6. **`sw.js` was not re-verified against the new Frankfurter API fetch this session.** The documented network-first + cache-everything strategy *should* transparently cover it (it's a normal CORS GET, not opaque), and there's an independent `localStorage` fallback (`urc_ccc_fx_rates`) either way — but this was reasoned from the README, not confirmed by reading `sw.js` directly this session.
7. **`ccc-design-system.css` and `CCC_DESIGN_LANGUAGE.md` are still not integrated into any page.** They exist as reference/target files. This session only did one small, deliberately narrow alignment — calculator.html's input focus-ring color now matches the shared blue accent (`--ccc-accent-ring`) — everything else (radii, spacing, tab shapes, actual `.ccc-*` class usage) is untouched. A full migration (starting with `cost_estimate_scope.html`, since it's the source the system was extracted from, or `calculator.html` given its Financial Ledger is now the newest/most design-conscious part of that page) means swapping inline Tailwind/custom-CSS class strings for the new semantic classes carefully, page by page, verifying nothing visually shifts. `calculator.html` in particular uses entirely bespoke classes (`.dim-input`, `.struct-select`, `.field-row`) with no relationship to `.ccc-*` — a bigger lift than migrating CES, which is already Tailwind-utility-based.
8. **calc.html's header "Export" button does nothing** — `pointer-events-none`/`opacity-40` with no `onclick`, confirmed dead this session. Export to Excel already lives in CES. Safe one-line removal whenever convenient.
9. **Save Estimate readiness flags don't update live across tabs.** `urc_ccc_calc_ready` / `urc_ccc_ces_ready` are recalculated on each page's own load and interaction, but a change written in one open tab won't refresh a *different* tab's button state until that tab's own state next changes. Not an issue for normal single-tab navigation; could surprise someone deliberately working both pages side by side in two tabs.
10. ~~`history.html` not re-verified against this session's record shape change~~ — **resolved.** `escalationPct` and the `ces` section's fields were confirmed directly against `confirmSaveEstimate()` in both `cost_estimate_scope.html` and `calculator.html`: both save paths produce structurally identical `ces: {...}` objects, so `history.html` renders correctly regardless of which page's Save button was clicked. `escalationPct` is now actually rendered (previously saved but never displayed).
11. **Stretch + Estimated Total Cost formulas** (Building Calculator) — dependent on `BuildingsBenchmarking rev 3.9 07.xlsm` on Sir Tony's machine. Currently manual input fields.
12. **3 extra Total Bay Spacing outputs** — formula unclear, needs Sir Tony clarification.
13. **Tab 3 PhilConstruct unit rates** — pending Sir Tony sharing the rate list; currently `0` in `prices.json`.
14. **Forms Area formula** (Footing Calculator) — needs verification.
15. **Shared estimate history** — saved estimates currently live in each user's local browser; GitHub-backed shared history via `api/save-history.js` not yet implemented.
16. **Admin write actions not yet gated for offline** — editing/saving price rows and running Annual Escalation both POST to `api/update-prices.js`, which fails silently offline with no user-facing warning.
17. **No network-first timeout** in `sw.js` — a `Promise.race()` timeout wrapper is planned but not yet added.
18. **`goBackMain()` cleanup** — now unused by `src/nav.js`. `history.html`'s inline copy was found to still call `Auth.logout()` — shadowing `nav.js`'s fixed version and silently reintroducing the auto-logout-on-Main-Page bug for that page specifically — and has been **removed this session**. Still needs a repo-wide check for remaining copies in `calculator.html`, `cost_estimate_scope.html`, and `labor_resources.html`, none of which were touched this session — don't assume the bug is gone app-wide just because it's gone from History.
19. **Real-device offline test pending** — only verified via DevTools' simulated Offline mode so far.
20. **Isometric diagram doesn't reflect Footing & Pedestal** — intentionally simplified, see Implementation Detail section above.
21. **Page header title is a placeholder** — `#header-title` currently reads "Summary (tent name)" on the older pages.
22. **Old test records in `urc_ccc_history` won't render correctly** against the rebuilt `history.html` — clear that key once if testing with stale data.
23. **History's Labor by Role is aggregated Person-Days, not real per-line Headcount × Days — and History has no full itemized scope-item list at all.** Root cause: `getLaborBreakdown()` in `cost_estimate_scope.html` (line ~627) collapses each labor line's headcount/days into a role-level Person-Days total *before* the record is ever saved, and both save paths (`confirmSaveEstimate()` in `cost_estimate_scope.html`/`calculator.html`, plus `updateTotals()`'s `urc_ces_cross_page` snapshot) only ever call that aggregated version — the raw per-line detail doesn't survive to be un-aggregated later. Separately, CES's own BOQ side panel (`~line 1330`) already builds a full itemized per-line list live (material/labor/lump-sum tags per WBS item) but never serializes it. Discussed and explicitly **deferred, not attempted** — fixing it means capturing a new itemized-line array in three places across two files (both `confirmSaveEstimate()` implementations, plus `updateTotals()`), then rendering it in `history.html`. Worth scoping as its own session rather than folding into a styling pass, given the save-path duplication this repo already has to keep in sync by hand (see item #1 in Team/Handover notes on `urc_ces_cross_page`).

---

## Handover (For Future Interns)

1. Ask to add your URC email to the `USERS` env var in Vercel dashboard
2. Ask to add you as a GitHub repo collaborator (repo is private under `GianSibayan`)
3. Clone the repo and checkout `local-dev` for local development (see Git Workflow above)
4. All price list data lives in `/data/` — edit via `admin.html`, never directly on GitHub
5. Run escalation in `admin.html` → Annual Escalation at the start of each new year
6. Sir Tony owns the Excel reference file and PhilConstruct rate list — confirm any formula questions with him in the Monday 11AM drumbeat
7. When editing `sw.js`, keep the precache list (`ASSETS_TO_CACHE`) in sync with any new pages/data files added to the app
8. Before touching `cost_estimate_scope.html`'s styling, read `CCC_DESIGN_LANGUAGE.md` — it documents the intended aesthetic and the reasoning behind it, so changes stay consistent instead of drifting

---

## Team

| Role | Name |
|---|---|
| Backend, API, Logic, GitHub/Vercel | Gian Eugene P. Sibayan |
| Frontend UI, Figma, Logic, HTML/CSS | Althea Antonio, Paolo Sarmiento |
| Project Owner | Engr. Tony Pabilan |
| Direct Supervisor | Engr. Emir Manansala |

*ESD Global Engineering Internship Batch, URC / JG Summit Holdings*