# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool built to replace the department's existing Excel-based workflow (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`). Engineers input building parameters and receive detailed cost estimates. Admins manage the price database through a protected panel.

## Status
🚧 In active development — July 2026 | **Building Calculator's Total Nodes formula was mathematically wrong** — found while reconciling `calculator.html` against the source Excel. `(L/spacingL) + (W/spacingW)` is a sum, but the real number of footings in a rectangular column grid is `(bays along L + 1) × (bays along W + 1)`, a product — grid intersections, not a sum. For a 100m×500m test building at 10m×12m bay spacing that's 52 footings (old formula) vs. 473 (correct); everything scaled off Nodes — Concrete Volume, Rebar Weight, Excavation Volume, Forms Area — was underestimated by roughly 9× on that case. Fixed in `calculator.html`, in the new companion spreadsheet (see below), and at the source: `WAREHOUSE_BUILDING_CALCULATOR.xlsx`'s `BUILDING CALCULATOR!I20` had the same bug (calc.html inherited it from there originally), all three cross-checked to produce identical numbers off identical inputs | **No. of Stories now actually does something** — collected since the beginning, never read by any formula in either the app or the source Excel. Now multiplies Gross Area and Building Volume (`MAX(Stories, 1)`, so an unset/zero value doesn't zero the whole building out), confirmed with a 3-story test case — Gross Area/Volume scale exactly ×3, Total Nodes correctly unaffected since footing count doesn't depend on floor count | **Total Pallet Slots rebuilt around actual industry references, not the previous area-based guess.** The old formula mixed two incompatible methods — an aisle-allowance % factor *and* Isle Width baked directly into the footprint denominator, double-counting aisle space against itself. Researched real warehouse-capacity references (pallet dimensions, forklift aisle-width bands by type, space-utilization benchmarks, rack vertical-clearance standards — 13 sources cited in the companion Excel's new References tab) and rebuilt on the standard method: `Pallets = (Floor Area × Space Utilization %) ÷ Pallet Footprint × Levels`. **Pallet Width brought back** as a real input (previously an orphaned, unused field called "Pallet Size" — a real pallet footprint needs Depth × Width, not Depth alone) | **Top Clearance added** — Rack Levels previously only subtracted Bottom Clearance from Rack Height; now also subtracts a ceiling/sprinkler buffer (OSHA 29 CFR 1910.159(c)(10): 18in/0.46m minimum below sprinkler deflectors, cited) | **Isle Width now classifies the aisle type** (VNA / Narrow Aisle / Wide Aisle, against cited forklift-type width bands) instead of feeding the footprint formula directly, plus a new Suggested Storage Efficiency Range cross-check so a typed Storage Efficiency % can be sanity-checked against a real benchmark instead of guessed blind | **New: Practical Pallet Capacity** — Total Pallet Slots × a new Operational Buffer % input (cited guidance: plan for 80-90% of theoretical max, not the raw number, to leave room for inbound/outbound flow) | **Found and fixed a second, separate bug surfaced by the above**: `calculator.html`'s "save to history" function had its own independent copy of the Nodes/area calculation, still running the old broken (sum, not product) formula after the live display was fixed — meaning a saved estimate's history record would've silently disagreed with what was on screen at save time. Now shares the corrected logic | **Footing & Pedestal is now a 4th tab in the same pill bar as Dimension/Structure/Capacity**, not its own separate module with its own header and Geometry/Materials sub-tabs — collapsed into one flat section (9 fields total, comparable to Capacity's 10) since it doesn't need the extra structural weight once it's not eating a whole separate page section. Frees vertical page space | **All input tooltips rebuilt as a proper hover-bubble component** (`.tip`/`.tip-bubble` CSS — dark bubble, arrow, positioned below the field) instead of native browser `title` attributes, extended to every input across all four tabs plus the pill tabs themselves — previously only some Capacity fields had any tooltip at all | **"Formula:" text prefix dropped from every Live Output Summary caption** — just the formula now, e.g. "Length × Width" instead of "Formula: Length × Width" | **New file: `URC_CCC_Building_Calculator.xlsx`** — a clean Excel mirror of `calculator.html`'s Building Calculator + Live Output Summary (Dimension/Structure/Capacity/Footing & Pedestal all reproduced as named-range-driven formulas, not hardcoded numbers), built so the math can be sanity-checked without reading JS, and to host a References tab (13 cited sources: pallet dimensions, aisle-width standards, space-utilization benchmarks, OSHA clearance rules) that has no business cluttering the actual app UI. Every formula in both files verified to produce identical output off identical test inputs | **`WAREHOUSE_BUILDING_CALCULATOR.xlsx` — the source Excel this whole app replaces — also got real bugs fixed directly**, found while reconciling it against `calculator.html`: `BASIS!E16` (Pallets/m²) was hardcoded to `1/(4.5×1)` instead of linking to the actual Isle Width/Pallet Depth cells; `BASIS!E19` (Rack Levels) allowed fractional levels (3.57) instead of flooring to a whole number; `FOOTING PEDESTAL CALCULATOR!D21`'s concrete-price lookup returned the wrong price for C25/30 (a hardcoded IF-chain disagreed with its own reference table two rows below — replaced with a real `INDEX/MATCH` against the table so it can't drift again); Excavation Volume and Forms Area cells existed as labels with no formula behind them at all (now computed); Concrete Volume/Rebar Weight only ever priced one footing+pedestal, never scaled by how many footings the building actually needs (now scaled by the corrected Total Nodes). All edits made via direct XML surgery, not a normal save-through-Excel, specifically to avoid Excel/LibreOffice's lossy round-trip stripping the file's dashboard-style shape/textbox labels — verified the shapes, and an unrelated external-workbook link elsewhere in the file, both survived intact | **Major bug found and fixed: the 5 buildings (RM Warehouse/Making/Converting/PUB/Admin) were never actually independently priceable.** `commonShell`/`commonInterior`/`commonMechanical`/`commonElectrical` are each declared once and were reused by array *reference* across all 5 buildings' section definitions in `SCOPE_CATEGORIES`, so `hydrateScopeStructure()`'s `if (!item.id) item.id = ...` only ever ran once per shared item object — whichever building got processed first (RM Warehouse) — and the other four buildings silently inherited RM Warehouse's ids, meaning they were reading/writing the exact same `gridState` entries for every Building Shell/Interior Finishing/Building Mechanical/Building Electrical row. Surfaced by investigating a Financial Ledger vs. BOQ Grand Total mismatch: `getCostBreakdown()` walks `Object.keys(gridState)` so a shared entry counts once (correct); `buildFullBreakdownData()` walks the `SCOPE_CATEGORIES` tree structurally and was revisiting that same shared entry once per building — inflated for anything priced under those four sections. Confirmed with a direct object-identity check (`rm.sections[0].items[0] === making.sections[0].items[0]` → `true`) before touching anything, fixed with a new `cloneItems()` helper giving each building its own item copies, then re-verified with a Node test asserting `getCostBreakdown().definedCost === buildFullBreakdownData().grandTotal` on synthetic data (diverged before the fix, exact after). **Consequence for already-saved data:** RM Warehouse keeps its ids and its pricing (it was always processed first); Making/Converting/PUB/Admin Building's Shell/Interior/Mechanical/Electrical rows now read as unpriced, since what displayed there before was never independently theirs — just a mirror of RM Warehouse. They need real pricing entered now that they're genuinely separate — see Known Blockers | **Structural Components gained an 11th component, `Indirect Costs & Overhead`** — the previous 10 silently excluded Indirect Costs entirely (its codes are letters — `H`, `Const`, `Tax`, etc. — so none of the 10 `match()` functions ever caught them), meaning its cost was missing from the Structural Components card while still counting toward the BOQ Grand Total beneath it, so the two totals disagreed by exactly the Indirect Costs total. New component matches `catLabel === 'Indirect Costs'`, same mechanism as Sitework/Others/Other Buildings. Verified with a Node test: the sum of all 11 components now equals the BOQ Grand Total exactly (previously 10 components summed to Grand Total *minus* Indirect Costs by design — now nothing is excluded) | **All 11 Structural Component descriptions rewritten** to name the actual WBS items each one pulls from (e.g. Sitework now spells out grading/drainage, retention basins, fire systems, paving types, utilities, and power distribution) instead of a vague one-liner — cross-checked against the real WBS item list so nothing's overstated or left out | **`labor_rates.json` expanded from 15 to 30 roles** — added 15 specific installation trades (Painter, Steelman, Tile Setter, Glazier, Roofer, HVAC Technician, Fire Protection/Sprinkler Fitter, Scaffolder, Rigger, Drywall Installer, Ceiling Installer, Waterproofer, Elevator/Escalator Technician, Low-Voltage/Communications Technician, Landscaper) so CES's Selection popover can pick a real trade instead of falling back to generic Carpenter/Mason/Electrician for work those don't really cover. Sourced from DMCI's 2024 manpower rate schedule (private-contractor reference, closest match to this data's existing scale) and general PH construction daily-rate references (PhilCon Prices, TheProjectEstimate.com) for most roles; **HVAC Technician, Fire Protection/Sprinkler Fitter, Elevator Technician, and Low-Voltage Technician are flagged as estimated, not directly sourced** — PH project day-rate data for these specific trades wasn't findable, so they're derived from salaried-annual compensation figures (SalaryExpert PH) discounted toward the existing trade-rate scale, and should be checked against a real subcontractor quote before being trusted for an actual estimate. Existing 15 roles/ids untouched, nothing already saved breaks. The hardcoded `LABOR_DB` fallback in `cost_estimate_scope.html` (used only when the JSON fetch fails) updated to match by hand | **Found and fixed a stale, incorrect comment claiming the labor database's `dailyRate` field is actually hourly and needs ×8 for a real daily cost** — present in `cost_estimate_scope.html` (`computeLineCost()`), a disabled comment in `admin.html`'s Labor Rates tab, and repeated as documented fact earlier in this README (Master Estimator's Data model, corrected below). Checked the actual code: neither `computeLineCost()` nor `getCostBreakdown()` multiply by 8 anywhere, the admin table's own column header already reads "Rate (₱/Day)", and CES's Selection popover/grid trigger button both display it as "₱{rate}/day" — everything was already internally consistent as a plain daily rate; only the comment (and Known Blocker #4, below) was wrong. This resolves Known Blocker #4 | **Open question raised, not resolved:** whether RM Warehouse/Making/Converting/PUB/Admin Building are meant to be 5 physically distinct buildings on the project site (which CES's structure assumes, and which the source Excel's identical five-way split supports) or something else — `calculator.html`'s Building Dimensions Calculator only has one set of dimension inputs, so it doesn't currently back any of the 5 buildings' quantities individually. Worth confirming with Sir Tony directly; added as a new Known Blocker | **New page: `estimate_summary.html`** — a fourth calculator page, linked in `src/nav.js` directly below Master Estimator, built specifically because Sir Tony kept getting bounced between CES's BOQ panel and calculator.html's Financial Ledger to see the full picture of an estimate. Read-only by design (a report, not a second place to edit numbers) — three cards stacked top to bottom: **Financial Ledger** + **Structural Components** side by side (`grid grid-cols-1 lg:grid-cols-2`, `items-start` so the shorter card doesn't stretch to match the taller one), then **Bill Of Quantities — Full Breakdown** underneath at full width. Every card shares the same shell (`bg-white border border-neutral-300 rounded-xl`, black-outlined white badge titles) and auto-refreshes on a `storage` event listener (fires in *other* tabs when CES/calc.html write updated numbers) plus a `focus` listener as a fallback, so it stays live without polling | **Master Estimator now serializes its full line-item breakdown, not just category totals** — `buildFullBreakdownData()` (new, called inside `updateTotals()`) walks every priced WBS item across every category and writes `urc_ces_full_breakdown` (`{ categories: [{ label, subtotal, items: [{ code, desc, subtotal, mat, lab, lump }] }], grandTotal, updatedAt }`) on every edit. This is what makes the Summary page's BOQ possible without duplicating CES's ~400-item `SCOPE_CATEGORIES` data model into a second file — verified with a Node test harness feeding it realistic multi-category sample data before wiring the actual UI to it | **Bill Of Quantities on the Summary page went through two redesigns before landing.** First pass: three explicit filter buttons (All Categories / By Category / By WBS Item), matching CES's implicit click-to-drill levels but made visible — dropped after feedback that "All Categories" already contains everything, so the other two modes weren't earning their keep. Second (current) pass: one view, a single search box (identical behavior to CES's own "Search categories or scope items...") filtering a two-column card grid — category-name matches keep the whole category, item-text matches isolate just that item | **Structural Components** (new card on the Summary page) — the same priced WBS costs, regrouped by physical building system instead of scope category, using **10 components**: Sitework, Substructure, Superstructure, Roofing, Exterior Enclosure, Interior Finishes, Mechanical/MEP, Electrical, Equipment & Furnishings, Other Buildings. Every building (RM Warehouse, Making, Converting, PUB, Admin) uses the identical `commonShell`/`commonInterior`/`commonMechanical`/`commonElectrical` WBS codes, so a component's total is a straight sum of a fixed code list (e.g. Substructure = codes 105+110+120) **summed across all five buildings** — verified this covers every direct-cost WBS code with a Node test asserting the sum of all 10 components equals the full BOQ total minus Indirect Costs (deliberately excluded — it's overhead, not a physical building component). First draft only covered 7 components and silently dropped Site Clearance/Others/Other Buildings entirely (their costs existed in the BOQ but weren't reachable through any component) — caught by testing coverage explicitly, not assumed complete | **WBS items are now individually editable** in `cost_estimate_scope.html` — "+ Add WBS Item" per section, inline-editable Scope Description on every row, and add/remove, but **default items' WBS codes are locked** (`isCustomItem = itemKey.startsWith('custom-')` gates whether the code cell renders as an `<input>` or plain text) so the Structural Components code-matching above can't silently drift if someone edits "110" to something else. Every item — default or custom — gets a stable `id` decoupled from array position (`${categoryId}__${sectionIndex}__${itemIndex}` for defaults, matching their old positional key exactly for backward compatibility with worksheets saved before this feature existed; `custom-${timestamp}-${random}` for new ones), so inserting/removing a row can never reattach another row's saved cost data to the wrong item — this was verified with a Node regression test that specifically removes a *middle* item from a section and asserts its neighbors' costs are untouched, the exact scenario that would silently corrupt data under a plain-array-index key | **Default items can no longer be removed at all** (not just code-locked) — the ✕ button is hidden entirely for non-custom items, with a matching guard in `removeItem()` itself as a backstop. This was tightened mid-session after a default item (Site Clearance) got accidentally deleted before the lock existed, which surfaced a second, more interesting bug: **`scopeOverrides.removed` can now only ever contain stale pre-lock entries** — since default removal is blocked and every custom item's deletion routes through `scopeOverrides.added`'s filter instead, nothing can legitimately reach that list anymore. `hydrateScopeStructure()` stopped honoring it and self-clears it on load, which auto-restored the accidentally-deleted default without requiring any manual fix — reasoned through and confirmed with a Node test asserting a stale `removed` entry both restores its item *and* empties the list for next time | **Four scope groups added to CES**, copied verbatim from the "COST ESTIMATE SCOPE" sheet in `WAREHOUSE_BUILDING_CALCULATOR.xlsx` after discovering CES's WBS — while a faithful port of the bulk of that sheet (`commonShell`/`commonInterior`/`commonMechanical`/`commonElectrical` and the Yard/Utilities/Substation categories all matched code-for-code) — was silently missing **Site Clearance** (new category, first in the list), **Others** (Truck Dock Doors/Levelers, Furnishings, Canopies, Racks, WMS — codes 510–950), **Other Buildings** (Transformer Building through Waste Water Treatment — codes 610–699), and **Engineering & Construction Management** + a small trailing **Others** group (Maintaining Production/Premium Time/Taxes), both added as new sections inside the existing Indirect Costs category alongside Construction Indirects | **Contingency and Undefined Cost scorecards rewritten from picking a description to typing a percentage on every row** — per Sir Tony's direction. Previously: one click per criterion, selecting one of 4 preset point values, summed across criteria (verified against the source spreadsheet's real `SUM` formula at the time). Now: **every individual description is its own row with its own 0–100 input** (`scorecardRows()` flattens each criterion's `choices[]` into individually-scoreable rows — Contingency's 4 criteria × 4 descriptions = 16 total rows), hard-clamped to [0, 100] in `setScoreValue()` (defends against a stray "1000" typo) and clamped again in `scorecardSubtotal()` as a second line of defense, and the subtotal is the **average across every row in the whole scorecard**, blanks counted as 0 — not the sum. This is a deliberate methodology change from what the source Excel does, confirmed directly from the person who owns the estimate, not re-derived from the spreadsheet | **New Escalation Scorecard tab** — third tab alongside Contingency/Undefined Cost, same per-row-input/average mechanism, currently one placeholder criterion (`ESCALATION_CRITERIA`) clearly labeled "awaiting criteria from Sir Tony" since the real rubric doesn't exist yet; fully wired end-to-end (types, averages, feeds the Financial Ledger) so swapping in the real criteria later is a data change, not a rebuild | **Escalation moved from a manual entry on calculator.html to CES's new scorecard** — `getEscalationPct()` in CES now reads the Escalation Scorecard directly instead of reaching into calc.html's saved state; calculator.html's own Escalation row changed from an editable `<input>` to a read-only badge matching Undefined Cost/Contingency's existing treatment, sourced from the new `urc_ces_escalation_subtotal` key (and `urc_ces_cross_page.scorecards.escalation` for the History snapshot/save-modal preview) — same pattern as the other two scorecards, so there's exactly one place any of the three percentages ever gets set | **Selection popover, BOQ side panel, and Full Screen button all gained explicit, findable controls** aimed at "the person using this is not always a young engineer" (a recurring note from Gian this session) — the BOQ panel's collapse toggle changed from a bare `»` glyph to a labeled **Hide** button with an icon, matching the existing Full Screen button's icon+text treatment; both buttons live in the grid toolbar | **`calculator.html`'s Footing & Pedestal is now quantities-only, no pricing** — Concrete Class, Concrete Price/m³ (which had an actual bug: its hardcoded price lookup disagreed with its own reference table for C25/30), Excavation Cost/m³, Labor Rate/m³, Rebar Price/kg, Overhead Profit, Forms Price/m², and Labor Cost/day were all removed. Reasoning: CES's own Foundations WBS row (present once per building, five times total — RM Warehouse/Making/Converting/PUB/Admin, one each) is the one place a peso figure for foundations should ever exist; computing a second, parallel total here would double-count. **Rebar Weight, Excavation Volume, and Forms Area added** to the Live Output Summary sidebar (matching Concrete Volume's existing style/formula-caption pattern) — quantities the source Excel also never finished, now computed here (`Rebar Weight = Concrete Volume × Rebar Ratio × Steel Density`, `Excavation Volume = Footing L × W × Excavation Depth × Nodes`, `Forms Area = perimeter × depth/height for both footing and pedestal × Nodes`) | **Real bug found and fixed in Total Pallet Slots**: the "Isle Width" (Aisle Width) input has existed in the Capacity tab this whole time — collected, persisted, synced — and was never once read by the actual formula; "Pallet Size" was substituted in its place, which isn't the same thing the source formula calls for (`Row Width = Pallet Depth + Aisle Width`). Fixed to use Isle Width correctly; confirmed with a direct before/after test that the output number now visibly changes when Isle Width changes, which it didn't before. **"Pallet Size" is now the orphaned field** (found, not fixed — flagged, not silently removed, since removing a user-facing input is a bigger call than fixing a formula) | *(prior session, unchanged since)* **CES's BOQ side panel rebuilt into three views** (`cost_estimate_scope.html`) — the right-panel "Bill Of Quantities" card previously only ever showed a single scope item's lines, or an empty "click a scope item" placeholder; it now has three interchangeable views, all sharing the same card layout: **item** (click a WBS code or Scope Description cell — unchanged trigger, `selectItem()`), **category roll-up** (click the dark category header bar *or* the light-blue section row beneath it — `toggleCategory()` / `selectCategoryBreakdown()`, both roll up to the same category-wide total; a deliberate simplification for the four categories with multiple distinct sections — RM Warehouse, Making, Converting, PUB, Admin Building — where clicking one section's row, e.g. "Interior Finishing," still shows the whole category's total rather than that section alone), and **all-categories overview** (`renderAllBreakdownPanel()`, ~line 1487 — every priced category as its own card, now the default view on page load and whenever you click ✕ or click anywhere outside the grid/BOQ workspace, replacing the old static empty state) | **Lines regrouped by type instead of tagged inline** (`buildGroupedLinesHtml()`, ~line 1377) — each WBS item's lines used to render individually with a small MAT/LAB/LS badge per line; that's gone, replaced with a "Mat" heading listing every material line, then "Lab" for labor, then "Lump Sum" for flat-rate lines with no material/labor picked — materials always first, labor second, lump sum last, and a group is omitted entirely if it has no lines | **Hover tooltips added** — every line in the BOQ panel and the grid's Selection button now carry the full untruncated text as a native `title` attribute, since both routinely truncate long material/labor names | **Live across whichever view is open, not just the selected item** — every grid edit (Selection change, Qty, Headcount/Days, Lump Sum, add/remove line) now re-renders the current BOQ view unconditionally; previously this only fired if the edited item happened to be the one selected, which was fine when "nothing selected" meant an empty panel, but not now that "nothing selected" means the aggregated all-categories overview needs to stay live too | **Category cards match the grid's category header color exactly** (`bg-slate-700`) — an intermediate attempt used `bg-blue-900`, didn't match, corrected same session; **WBS/item labels are plain black** (`text-neutral-900`) — an intermediate attempt at dark blue (`text-blue-900`) was tried first per an earlier request in the session, then explicitly reverted to black on follow-up feedback | **A horizontally resizable BOQ panel (drag the left edge to widen it, overlaying rather than reflowing the grid) was prototyped and explicitly reverted at request** — noted here so it isn't mistaken for a missing feature or re-attempted unprompted | **Technical note:** the outside-click-to-reset handler uses `event.composedPath()`, not `e.target.closest()` — clicking a category header re-renders the grid mid-click (`renderGrid()` replaces the tbody's contents), which detaches the clicked row from the DOM before the event finishes bubbling; `closest()` on an already-detached node silently returns nothing, so the handler reads `composedPath()` instead, since that's captured before the mutation happens | **Display-only — no change to what gets saved.** This session touched only how the BOQ panel renders; the itemized per-line detail it shows still isn't serialized into saved History records (see Known Blockers #23, unchanged) | *(two sessions ago, unchanged since)* **`history.html` audited and cleaned up** (was the top gap left by last session's Financial Ledger work — the record shape had changed and the page was never re-verified against it): scorecard per-criterion descriptions removed from the expanded view, replaced with three plain percentage rows (Undefined Cost / Escalation / Contingency) folded directly into the Cost Estimate Scope card | **Escalation % now actually renders in History** — `escalationPct` has been written at the top level of every saved record since last session but was never displayed, and the Grand Total formula label was silently missing the term entirely (`Defined Cost × (1 + Contingency % + Undefined Cost %)` instead of the real formula); both fixed, confirmed directly against `confirmSaveEstimate()` in both files rather than assumed from this doc | **Lump Sum relocated from the Labor card to the Cost Estimate Scope card** (both collapsed and expanded) — Lump Sum is addable to any line (material, labor, or standalone), not labor-specific, so it was mis-scoped | **Removed a duplicate `goBackMain()`** inline in `history.html` that called `Auth.logout()` and was defined *after* `nav.js` loads — meaning it silently shadowed `nav.js`'s already-fixed pure-navigation version and reintroduced the auto-logout-on-Main-Page bug for this page specifically, even though the app was believed fixed everywhere | Retheme pass: dark bars (row header, Grand Total) `bg-slate-700` → true grey `bg-neutral-700`; scorecard percentages and Defined Cost de-colored; Clear All changed from red to grey; fixed low-contrast grey-on-dark text in the Grand Total bar; tightened Building Dimensions' cell padding/font size; Footing/Pedestal now labeled with their actual dimension order (`L×W×D` / `L×W×H` — they don't share a third dimension) | **Known limitation root-caused and deliberately deferred, not fixed this session**: Labor by Role in History still shows aggregated Person-Days, not real per-line Headcount × Days, and History still has no full itemized scope-item list (only category-level totals + role-aggregated labor) — both trace back to `getLaborBreakdown()` collapsing per-line headcount/days *before* the record is ever saved; CES's own BOQ side panel already renders a full itemized per-line list live, it just never gets serialized. Fixing this needs a new itemized-line array captured in three places across two files (see Known Blockers) — scoped, discussed, intentionally not attempted this session | *(three sessions ago, unchanged since)* **calculator.html's Financial Ledger is now built**: renamed from "Bill of Quantities," reads Material Cost / Labor Cost / Raw Total / Undefined Cost % / Contingency % live from Master Estimator via `urc_ces_cross_page`, computes **Estimated Grand Total = Raw Total × (1 + Undefined% + Escalation% + Contingency%)** | **Live currency conversion** added to the Financial Ledger — a "Convert to" dropdown (USD/EUR/JPY/SGD) fetches real-time rates from the free Frankfurter API (base PHP, keyless, CORS-enabled), caches the last successful fetch to `localStorage` for offline use; the old manual Exchange Rate/Amount-to-Convert Currency tab is **removed** | **Save Estimate now lives in both calculator.html and Master Estimator** — the button only enables once *both* pages are filled in (`urc_ccc_calc_ready` AND `urc_ccc_ces_ready`), Project Title/Prepared By always read from CES's header regardless of which page's button is clicked, and both pages build an identical History record off one shared `urc_ces_cross_page` snapshot (now carries category totals, labor-by-role, and full scorecard detail, not just Defined Cost) | **Fixed a real percentage bug**: Contingency/Undefined scorecard subtotals are whole-number percentages (e.g. `8` = 8%) not fractions — the Ledger was briefly displaying/computing them 100× too large | Fixed a dropdown-overflow bug on the Structure section (`Skylights / Windows`) caused by a fixed-width `.struct-select`; unified calculator.html's input focus-ring color to the same blue accent CES uses | *(four sessions ago, unchanged since)* Master Estimator rebuilt end-to-end: multi-line-per-WBS-item data model, shared floating Selection popover, collapsible categories, Contingency/Undefined Cost scorecards as in-page tabs, `contingency_scorecard.html` superseded, design system extracted (`CCC_DESIGN_LANGUAGE.md` / `ccc-design-system.css`, still not wired into either page), `labor_resources.html` being phased out

---

## What This App Does

**1. Building Calculator** (`calculator.html`)
Engineer inputs dimensions (length, width, clear height, stories, mezzanine %), structure selections (structure type, roof, wall cladding, slab thickness), bay spacing, and capacity parameters. App auto-calculates floor area, building volume (now correctly scaled by No. of Stories, see Status), total connection nodes, rack levels, pallet footprint, an aisle-width classification (VNA / Narrow Aisle / Wide Aisle), and both theoretical-max and practical (buffered) pallet capacity live — the capacity model was rebuilt this session against cited industry references, see Status and the companion Excel's References tab. Right panel (Live Output Summary) shows a live isometric SVG diagram of the building — envelope box, story-division lines, and a mezzanine slab that grows toward the opposite wall as % Mezzanine increases — plus the **Financial Ledger**.

The old standalone Currency Conversion tab (manual base/target/exchange-rate/amount fields) is **removed** — currency conversion now lives inside the Financial Ledger itself as a live, API-driven "Convert to" dropdown under the Grand Total.

**2. Footing & Pedestal Calculator** (`calculator.html`)
Engineer inputs footing/pedestal dimensions, rebar ratio, and steel density. App auto-calculates concrete volume, rebar weight, excavation volume, and formwork area. **Quantities only as of this session — no pricing.** Concrete Class, Concrete Price/m³, Excavation Cost/m³, Labor Rate/m³, Rebar Price/kg, Overhead Profit, Forms Price/m², and Labor Cost/day were all removed; CES's own Foundations WBS row (present once per building — RM Warehouse, Making, Converting, PUB, Admin Building each get their own) is the one place a peso figure for foundations should ever exist, and computing a second parallel total here would double-count it.

Building Calculator and Footing & Pedestal are on the **same continuously scrolling page**, and — **changed this session** — share one pill tab bar (Dimension / Structure / Capacity / Footing), rather than Footing & Pedestal having its own separate module header and Geometry/Materials sub-tabs.

**3. Master Estimator Worksheet** (`cost_estimate_scope.html`)

Structured line-item cost builder replicating the Cost Estimate Scope sheet from the Excel reference, organized by scope category (Site Clearance, Yard & Underground, Yard Utilities, Plant Utilities, Substation & Power, RM Warehouse, Making, Converting, PUB, Admin Building, Others, Other Buildings, Indirect Costs). Also hosts the **Contingency**, **Undefined Cost**, and **Escalation** Scorecards as in-page tabs, and the **Save Estimate → History** flow (shared with calculator.html — see below). WBS items are individually editable — add, remove, and edit description on any row — but default items' WBS codes and their ability to be removed at all are both locked, so nothing that other pages key off of (Structural Components on Estimate Summary, in particular) can silently drift.

**4. Estimate Summary** (`estimate_summary.html`) — *NEW*

A read-only report page combining what used to require flipping between Master Estimator's BOQ panel and calculator.html's Financial Ledger: the Financial Ledger, a **Structural Components** breakdown (the same costs, regrouped by physical building system — Substructure, Superstructure, Roofing, etc. — instead of by scope category), and the full Bill Of Quantities, all in one place. Nothing here is editable; every number is sourced from CES or calculator.html, never recomputed.

**5. Labor & Resources** (`labor_resources.html`) — *deprecated, not deleted*
Previously a standalone page for entering headcount/days per labor role, feeding a separate cost stream into the old Save Estimate flow. **Labor costing now happens directly inside Master Estimator** (each scope-item line can be a Labor line — role, headcount, and days, priced from the same rate database). This file still exists in the repo and has not been edited, but nothing currently links to it or reads its old storage keys (`urc_ccc_labor_2026`, `urc_ccc_labor_ready`). Decide whether to delete it outright or leave it dormant — see Known Blockers.

**6. Master Estimator's Scorecards** (in-page tabs inside `cost_estimate_scope.html`)
Three qualitative scoring tools — **Contingency**, **Undefined Cost**, and **Escalation** (new this session) — each broken into criteria, each criterion broken further into individual reference descriptions, and **every description is its own row with its own typed 0–100 percentage** (changed this session from clicking one preset description per criterion). The subtotal is the **average** across every row in the scorecard, not a sum, hard-capped at 100 on every individual input. Escalation currently has one placeholder criterion pending real guidance from Sir Tony — functional end-to-end already, just waiting on the actual rubric. The old standalone `contingency_scorecard.html` page remains superseded — see Known Blockers.

**7. Admin Panel** (`admin.html`)
Protected price management interface. Admins can view, edit, save individual rows, add rows, import from Excel/CSV, and export all 14 category price lists. Core rates (concrete class prices, rebar, excavation, labor, escalation/place factors) are edited directly. Includes an Annual Escalation tool. *Unchanged this session*, except see the labor-rate-unit note under Known Blockers.

**8. Estimate History** (`history.html`)
Renders saved estimate records: Building Calculator snapshot, Master Estimator's full cost/category/labor breakdown, all three scorecards with the exact description picked per criterion, and `escalationPct`. *Not touched this session — Escalation's source changed (CES's scorecard, not calc.html's manual field) and the scorecard shape changed (per-row, not per-criterion) — verify `history.html` still renders new saves correctly before relying on it.*

---

## Master Estimator — Implementation Detail

### Data model

```js
// gridState[itemKey] = array of lines. itemKey is now item.id, not a live positional
// computation — see "WBS item editability" below for why that distinction matters.
gridState['yard-underground__0__0'] = [
  { matId: 'concreting_materials_3', qty: '10', labId: '', headcount: '', days: '', lumpSum: '' },
  { matId: '', qty: '', labId: 'mason', headcount: '2', days: '3', lumpSum: '500' }
];
```

Each **scope item** (a WBS row like "1.1.1 Site grading & drainage") can hold **any number of lines**, added/removed independently — not a fixed one-material-one-labor pair per row like the previous iteration. A line is exactly one of:

- **Material** — `matId` + `qty`. Unit and Unit Cost come from the matching category JSON in `/data/`.
- **Labor** — `labId` + `headcount` + `days`. Cost = `headcount × days × dailyRate`. `dailyRate` is a plain per-day figure — confirmed this session (see Status): neither `computeLineCost()` nor `getCostBreakdown()` apply any ×8 conversion, `admin.html`'s Labor Rates tab column header reads "Rate (₱/Day)", and the Selection popover/grid trigger button both display it as "₱{rate}/day". An earlier version of this doc claimed the field was actually hourly and needed ×8 — that was wrong, and has been removed from the code comments that repeated it.
- **Lump Sum** — a flat `lumpSum` amount, addable on top of *any* line (including a line with no material or labor selected at all, for pure flat-quote items like bonds/insurance/mobilization).

`Total Cost` per line = `(qty × unitCost)` or `(headcount × days × dailyRate)`, **plus** `lumpSum` either way.

### WBS item editability

Every WBS item — default or custom — has a stable `item.id`, assigned once by `hydrateScopeStructure()` at page load and never recomputed from array position again:

- **Default items** (anything in the hardcoded `SCOPE_CATEGORIES` literal) get `id = ${categoryId}__${sectionIndex}__${itemIndex}` — deliberately identical in shape to the old purely-positional key, so worksheets saved before this feature existed keep resolving to the same `gridState` entries.
- **Custom items** (added via "+ Add WBS Item") get `id = custom-${Date.now()}-${random}` — a format that can never collide with a default's id.

This matters because `gridState`, `selectedItem`, and every total calculation are all keyed by `item.id`, never by an item's current position in its array. Inserting or removing a row shifts array positions but never changes any *other* item's `id` — the exact thing a plain positional key would get wrong (removing item 3 of 6 would otherwise silently reattach item 4's saved cost data to whatever is now sitting in slot 3).

**What's editable and what's locked:**

| | Description | WBS Code | Remove |
|---|---|---|---|
| Default item | ✅ editable | 🔒 locked, plain text | 🔒 locked, no ✕ shown |
| Custom item | ✅ editable | ✅ editable, `<input>` | ✅ removable, with confirm if it has priced lines |

The code lock exists because Estimate Summary's Structural Components feature sums specific WBS codes (e.g. `105`/`110`/`120` → Substructure) across all five buildings — if a default item's code could drift, that sum would silently miss it. The full removal lock came later, after a default item was accidentally deleted before code-locking alone turned out not to be enough protection — see the `scopeOverrides.removed` note below.

**Persistence — `urc_ces_scope_overrides`:**
```js
{ added: [{ id, catId, sectionIdx, code, desc }], edited: { [itemId]: { code, desc } }, removed: [itemId] }
```
`added` and `edited` still work as designed. **`removed` is now effectively dead** — since default items can't reach it (blocked before the removal logic even runs) and every custom item's deletion is tracked by filtering it out of `added` instead, nothing can legitimately add a new entry to `removed` anymore. `hydrateScopeStructure()` no longer filters by it at all, and clears it out on every load — which also means any default item removed *before* this fix existed (in someone's already-populated browser) reappears automatically, no manual recovery step needed.

### Grid layout

Columns: `WBS | Scope Description | Selection | Qty | Unit | Unit Cost (₱) | Lump Sum (₱) | Total Cost (₱) | Add Row`. WBS code and Scope Description use `rowspan` to merge across a scope item's multiple lines. Every line gets both `✕` (remove) and `+` (insert a new blank line directly below it) — not just the last line.

The Quantity cell reshapes itself based on line type: a single right-aligned number for Material, a split `Headcount | Days` pair (same font/alignment/weight as the Material input, just blue instead of amber — color is data-type signal only, never used to differentiate control state) for Labor.

Each **section** (e.g. "Yard & Underground", which is both the category and its only section) gets one inline **TOTAL** row at the bottom, summing every item in that section — not one total per WBS item. Category headers are collapsible (see Performance below); a collapsed category shows its total inline in the header bar.

### BOQ side panel — three views

The right-panel "Bill Of Quantities" card (`#boq-panel`) is one shared layout — header (code/label + ✕), a scrollable lines area, a subtotal bar — driven by three render functions dispatched from `renderBreakdownPanel()` (~line 1437) based on two module-level flags, `selectedItem` and `selectedCategory` (at most one is ever non-null):

| View | Trigger | Renders | Header shown? |
|---|---|---|---|
| **Item** | Click a WBS code or Scope Description cell | `renderItemBreakdownPanel()`, ~1445 — that item's lines, grouped | Yes — `WBS x.x.x` / description |
| **Category** | Click the dark category header bar, or the light-blue section row beneath it | `renderCategoryBreakdownPanel()`, ~1463 — every priced item in the category, grouped per item | Yes — `CATEGORY` / category label |
| **All categories** (default) | Page load; click ✕; click anywhere outside the grid/BOQ workspace | `renderAllBreakdownPanel()`, ~1487 — every priced category, each its own card, each listing its priced items | No — considered redundant with the category cards below it |

**Category and section clicks both roll up to the whole category**, not just the clicked section — `toggleCategory()` (the dark bar's handler) and `selectCategoryBreakdown()` (the light-blue row's handler, also called by `toggleCategory()`) both land on the same category-wide render. For the five categories with a single section whose title matches the category label (Yard & Underground, Yard Utilities, Plant Utilities, Substation & Power, Indirect Costs) this is invisible — the two rows say the same thing anyway. For the four categories built from `commonShell`/`commonInterior`/`commonMechanical`/`commonElectrical` (RM Warehouse, Making, Converting, PUB, Admin Building), clicking just the "Building Electrical" section row still shows the *entire* category's total, not that section alone — a deliberate simplification, not a bug, but worth knowing if a per-section total is ever requested.

**Lines are grouped by type, not tagged per-line.** `buildGroupedLinesHtml()` (~1377) splits a WBS item's priced lines into three buckets — `matId` set → **Mat**, `labId` set → **Lab**, neither set (pure lump sum) → **Lump Sum** — and renders each bucket under its own small heading via `buildBreakdownLineRow()` (~1352), in that fixed order, skipping any bucket with nothing in it. This replaced an earlier per-line design where every row carried its own small MAT/LAB/LS color badge inline; the badge is gone, the grouping heading does that job instead. `buildItemGroupHtml()` (~1407) wraps one WBS item's groups under a `WBS code — description` label (`text-neutral-900`, plain black) for use inside the category and all-categories views; the item view skips that label since the panel's own header already shows it.

**Tooltips.** Every rendered line (`buildBreakdownLineRow()`) and the grid's own Selection button both carry the line's full text as a native `title` attribute — both routinely truncate (long material names, long labor-role + headcount/days strings), and hovering is currently the only way to read the untruncated version. `escapeHtml()` (~1345) sanitizes text going into these `title` attributes.

**Colors.** Category cards in the all-categories view use `bg-slate-700` with white text — matched deliberately to the grid's own dark category header bar, same color, so a category's boundary reads the same way in both places. WBS/item labels are plain black (`text-neutral-900`).

**Live regardless of which view is open.** `updateSelection()`, `updateLine()`, `addLineAfter()`, and `removeLine()` all call `renderBreakdownPanel()` unconditionally after every edit now (previously gated behind `if (selectedItem === itemKey)`, which was correct back when the default state was an empty placeholder that nothing needed to react to — it isn't now that the default state aggregates the whole worksheet).

**Outside-click detection uses `event.composedPath()`, not `e.target.closest()`.** Clicking a category header calls `renderGrid()` as part of its own handler, which replaces the entire `<tbody>` — including the row that was just clicked — before the click event finishes bubbling to the document-level listener. A detached node's `closest()` call silently returns nothing (its `parentNode` chain is cut), so the listener instead reads `composedPath()`, which is captured before any handler runs and stays accurate regardless of DOM mutations later in the same event.

> A horizontally resizable version of this panel (drag its left edge to widen it, overlaying rather than reflowing the grid underneath) was built and tested this session, then explicitly reverted at request. If a resizable BOQ panel comes up again, it's not a forgotten feature — it was tried and pulled back out on purpose.

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

### Scorecards (Contingency, Undefined Cost, Escalation)

All three live as **in-page tabs** inside `cost_estimate_scope.html` (`tab-panel-contingency` / `tab-panel-undefined` / `tab-panel-escalation`), not separate pages — switching tabs swaps the visible content area only; the header metadata bar stays put, and the BOQ side panel + grid search/Clear controls hide themselves since none of that applies to a scorecard.

**Mechanism, rewritten this session per direct instruction from the estimate's owner — every individual row is now its own typed percentage, averaged, not the old pick-one-description-per-criterion-and-sum design:**

- `scorecardRows(criteria)` flattens each criterion's `choices[]` into individually-scoreable rows: Contingency's 4 criteria × 4 descriptions each = 16 total rows, Undefined Cost's 3 × 4 = 12. A criterion with zero choices (Escalation's current placeholder) counts as exactly one row, keyed by the criterion's own id directly.
- Every row gets its own `<input type="number">`, 0–100, referencing the original description text as guidance only — the description no longer carries its own fixed point value the way it used to.
- `setScoreValue(scorecardType, rowId, rawValue)` **hard-clamps every input to [0, 100]** the moment it's typed (`Math.max(0, Math.min(100, value))`), specifically so a stray "1000" doesn't get through. `scorecardSubtotal()` clamps again as a second line of defense.
- The subtotal is `scorecardSubtotal()` = **the average across every row in the whole scorecard**, blanks counted as 0 — never a sum. This is a deliberate methodology change confirmed directly with Sir Tony, not re-derived from `Sample_TEMPLATE_1.xlsx`'s formulas (which do sum, and remain accurate documentation of the *old* mechanism, superseded here).
- **Escalation is a new third scorecard**, same mechanism, currently one placeholder criterion (`ESCALATION_CRITERIA`) explicitly labeled as awaiting real criteria from Sir Tony. Fully wired end-to-end already — typing a value there flows through to the Financial Ledger on both `calculator.html` and Estimate Summary exactly like Contingency/Undefined Cost — so dropping in the real criteria list later is a data change, not a rebuild.
- Selections persist as one unified object, `urc_ces_scorecard_selections` = `{ contingency: {}, undefinedCost: {}, escalation: {} }`, keyed by row id — **replaces** the old separate `urc_ces_contingency_selections` / `urc_ces_undefined_selections` keys, which no longer exist. Each scorecard's subtotal is still written to its own cross-page key (`urc_ces_contingency_subtotal`, `urc_ces_undefinedCost_subtotal`, and now `urc_ces_escalation_subtotal`) for `calculator.html` and Estimate Summary to read. **Units are unchanged**: `subtotal` is a whole-number percentage (`8` means 8%), not a fraction.
- **Escalation itself moved off `calculator.html`.** It used to be a manually-typed field directly on the Financial Ledger; `getEscalationPct()` in CES now reads the Escalation Scorecard instead, and calculator.html's own Escalation row is a read-only badge sourced from `urc_ces_escalation_subtotal` — matching how Contingency/Undefined Cost already worked. There is now exactly one place any of the three percentages gets set, on any page.

This replaces both the old Contingency Scorecard's free-form 0–100-per-category "Score Input" design *and* last session's sum-of-picked-descriptions design (see prior README/manual and the old `contingency_scorecard.html`) — two rewrites of the same feature, for two different reasons, documented here so the history isn't confusing later.

### Save Estimate → History

**Save Estimate now lives in both `calculator.html` and `cost_estimate_scope.html`** — the button in either page's header enables only once *both* pages are filled in:

- `urc_ccc_calc_ready` (calc.html: Length, Width, Clear Height all > 0) **and**
- `urc_ccc_ces_ready` (CES: Defined Cost > 0, Project Title + Prepared By both filled)

Each page recalculates and writes its own flag as the person types; each page's Save button reads both flags before enabling. There's no cross-tab listener — if both pages are open in separate tabs simultaneously, a flag written in one tab won't live-update the other tab's button until that tab's own state next changes (see Known Blockers).

Project Title, Prepared By, Plant, Estimate Type, Date, and Mean Spending Date are **always read from CES's header metadata** (`urc_ces_meta`) — never re-entered in calculator.html. Its confirmation modal mirrors those fields read-only, plus a live preview of Defined Cost, Contingency %, Undefined Cost %, **Escalation %** (now read from CES's Escalation Scorecard via `urc_ces_cross_page`, same as the other two — no longer calc.html's own field, see Scorecards above), and the Estimated Grand Total (`Defined Cost × (1 + Undefined% + Escalation% + Contingency%)`).

**One shared snapshot, two Save buttons.** To make the two buttons produce byte-identical History records, `urc_ces_cross_page` was expanded from just `{ definedCost }` into a full snapshot — category totals, labor-by-role breakdown, priced-line count, and all **three** scorecards' subtotal *and* full per-row detail (see Storage Keys). CES's own `confirmSaveEstimate()` still computes its portion live for freshness; calculator.html's copy reads the same cross-page snapshot instead of recomputing CES's numbers itself. **Both copies must be kept in sync by hand** — there's no shared module system (no build step), so this is duplicated logic across two files. If `urc_ces_cross_page`'s shape changes again, update both `confirmSaveEstimate()` functions together.

On confirm (from either page), the record is pushed to `urc_ccc_history` (unchanged key) with `escalationPct` now included alongside the existing fields.

### Excel export

`exportToExcelBOQ()` still works — unchanged this session. Handles multi-line items (one exported row per line), pulls the header block (Project Title, Plant, Prepared By, Date) from the metadata bar instead of a hardcoded placeholder.

---

## Building Calculator — Financial Ledger Implementation Detail

The right-panel card formerly called "Bill of Quantities" is now the **Financial Ledger** — rebuilt this session to match the bottom summary section of `Sample_TEMPLATE_1.xlsx` (`SAMPLE 1` sheet, rows 82–96), confirmed against its actual formulas rather than guessed:

```
Raw Total                = Material Cost + Labor Cost (+ Lump Sum, via CES's Defined Cost)
Undefined Cost Subtotal  = Raw Total × Undefined%      (from CES's Undefined Cost scorecard)
Escalation                = Raw Total × Escalation%    (from CES's Escalation scorecard)
Risk Funds (Contingency) = Raw Total × Contingency%    (from CES's Contingency scorecard)
Estimated Grand Total    = Raw Total + Undefined Cost + Escalation + Risk Funds
                          = Raw Total × (1 + Undefined% + Escalation% + Contingency%)
```

**Everything on this card is read-only now, sourced entirely from CES.** Material Cost, Labor Cost, and Raw Total come from `urc_ces_cross_page`; Undefined %, Escalation %, and Contingency % all come from their respective `urc_ces_*_subtotal` keys. Escalation used to be the one live input here — it moved to its own CES scorecard this session (see Master Estimator's Scorecards, above), so there is now exactly one page and one place any of the three adjustment percentages ever gets typed. The admin.html year-based auto-escalation concept remains unrelated (that tool re-prices `prices.json` line items, not this formula).

**Two different "Undefined Cost" concepts exist in the source material, and they are not the same thing:** the Excel's bottom-section "UNDEFINED ALLOWANCES" line items (Field Instructions / Unlisted Items / Post Start-up, each a manually-typed %) are a *different* rubric from CES's "Undefined Cost" scorecard tab (Project Complexity / Technology / Completeness of Definition, an AACE-style estimate-classification scoring system). The scorecard is understood to be the intended **replacement** for the old manual line-item %s — both feed the same slot in the Grand Total formula, just via a more structured method — consistent with why the Contingency scorecard replaced its own old free-form 0–100 input. Worth confirming this reading with Sir Tony if it ever comes into question.

### Footing & Pedestal — quantities only, no pricing

Rebuilt this session after tracing through both `WAREHOUSE_BUILDING_CALCULATOR.xlsx`'s FOOTING PEDESTAL CALCULATOR sheet and CES's WBS structure directly. The source Excel never actually computed a final ₱ total for footing/pedestal either — every rate existed (Concrete Price/m³, Rebar Price/kg, Excavation Cost/m³, Forms Price/m², Labor Cost/day, Overhead/Profit%) but nothing multiplied them together, in the Excel or in the app. Rather than finish that rollup, **all pricing was removed instead** — CES's Foundations WBS row (one per building: RM Warehouse, Making, Converting, PUB, Admin Building each get their own) is the one place a peso figure for foundations should exist; a parallel total here would double-count it.

What's left computes quantities only, shown in the Live Output Summary sidebar alongside Concrete Volume:

```
Concrete Volume    = (Footing Vol + Pedestal Vol) × Nodes                          [unchanged]
Rebar Weight       = Concrete Volume × Rebar Ratio × Steel Density                 [new this session]
Excavation Volume  = Footing Length × Footing Width × Excavation Depth × Nodes     [new this session]
Forms Area         = (2×(FL+FW)×FD + 2×(PL+PW)×PH) × Nodes                         [new this session]
```

Excavation Volume assumes the dig matches the footing's own footprint exactly — no working-clearance margin added, since none was specified anywhere in the source material. Worth confirming with whoever reviews the numbers if a wider dig is standard practice. Forms Area assumes formwork on the vertical sides only (no formwork on the underside, which rests on excavated soil, or the open top).

**Nodes itself was wrong until this session** — see Status. All four formulas above were quietly underscaled for any building with more than a handful of bays, since Nodes used to be a sum of bay-spacing divisions instead of an actual footing-grid count. Formulas unchanged; the Nodes value feeding them is now correct.

### Storage Capacity — researched, cited, and rebuilt this session

The old Total Pallet Slots formula was a single number with no supporting reasoning behind any of its inputs — Storage Efficiency % and Isle Width were both feeding the same "how much floor area is actually usable" concept in two different, conflicting ways (see Status). Rebuilt around the standard warehouse-capacity method, cited on the companion Excel's References tab (13 sources: pallet-dimension standards, forklift aisle-width bands, space-utilization benchmarks, OSHA rack-clearance rules):

```
Rack Levels                = FLOOR((Rack Height − Bottom Clearance − Top Clearance) / Rack Level Height)   [Top Clearance new]
Pallet Footprint           = Pallet Depth × Pallet Width                                                    [Pallet Width new]
Aisle Width Classification = VNA / Narrow Aisle / Wide Aisle, from Isle Width against cited forklift bands  [new]
Total Pallet Slots         = FLOOR(Floor Area × Storage Efficiency % × (1 − Dock/Staging %) ÷ Pallet Footprint × Rack Levels)
Practical Pallet Capacity  = FLOOR(Total Pallet Slots × Operational Buffer %)                                [new]
```

Every number here is a secondary industry source (equipment vendor pages, logistics blogs, OSHA-citing safety guides) — a reasonable starting point for sanity-checking the model, not a substitute for URC's actual rack vendor specs or Engr. Emir's sign-off. Flagged as such directly on the References tab.

One open question raised, not resolved: Total Nodes' `(bays+1)×(bays+1)` grid-intersection formula is the mathematically correct way to count footings in a rectangular column grid, and is what this session's fix implements — but nobody with structural engineering authority has confirmed that's actually how footings get laid out for these buildings in practice. Worth a direct check with Sir Tony/Engr. Emir before the number gets trusted for real material takeoffs.

### Live currency conversion

A "Convert to" dropdown (USD / EUR / JPY / SGD) sits under the Estimated Grand Total. `loadFxRates()` fetches live rates from [Frankfurter](https://frankfurter.dev) (`https://api.frankfurter.dev/v1/latest?base=PHP&symbols=USD,EUR,JPY,SGD`) on page load — free, keyless, CORS-enabled, ECB reference rates, confirmed to cover all four target currencies. Base is always PHP (everything in the Ledger is computed in ₱); there's no manual exchange-rate entry anymore.

**Offline behavior, two layers deep:**
1. `sw.js`'s documented network-first + cache-everything-on-success strategy should transparently cache this GET like any other request — **not independently re-verified this session**, see Known Blockers.
2. Independently of that, the last successful fetch is written to `localStorage['urc_ccc_fx_rates']` and used as a fallback if the live fetch fails for any reason. If neither layer has a rate yet (e.g. first-ever load with no connection), the converted-total line shows "Rates unavailable" rather than a stale or wrong number.

The old Currency Conversion tab (Base Currency / Target Currency / Exchange Rate / Amount to Convert, manual entry) is **removed** from Building Calculator entirely — it's fully superseded by this.

---

## Estimate Summary (`estimate_summary.html`) — Implementation Detail

New page this session, linked in `src/nav.js` directly below Master Estimator. Built to stop Sir Tony from having to flip between CES's BOQ panel and calculator.html's Financial Ledger to see the whole picture — everything on this page is read-only, sourced from data CES and calculator.html already write, nothing is recomputed here.

### Layout

Three cards, top to bottom: **Financial Ledger** and **Structural Components** side by side (`grid grid-cols-1 lg:grid-cols-2 gap-6 items-start` — the `items-start` matters, without it the shorter card stretches to match the taller one's height, leaving a visible empty gap), then **Bill Of Quantities — Full Breakdown** underneath at full width. All three cards share one shell (`bg-white border border-neutral-300 rounded-xl`), and all three titles are rendered as black-outlined white badges (`border-2 border-black rounded-lg bg-white`) rather than plain text — a deliberate accessibility call given who actually uses this page day to day.

### Data sources — nothing computed locally

| Card | Reads from |
|---|---|
| Financial Ledger | `urc_ces_cross_page` (Material/Labor/Raw Total), `urc_ces_contingency_subtotal`, `urc_ces_undefinedCost_subtotal`, `urc_ces_escalation_subtotal` |
| Structural Components | `urc_ces_full_breakdown` |
| Bill Of Quantities | `urc_ces_full_breakdown` |

Auto-refreshes via a `storage` event listener (fires in this tab when a *different* tab writes to any watched key — the exact scenario of CES open in one tab, this page open in another) plus a `focus` listener as a fallback for browsers that don't fire `storage` reliably. There's also a manual **Refresh** button in the header for anyone who'd rather just press something.

### `urc_ces_full_breakdown` — the new key that makes the BOQ/Structural Components possible

CES's `buildFullBreakdownData()` (new, called inside `updateTotals()` so it's written on every grid edit) walks every priced category → WBS item → line and serializes:
```js
{ categories: [{ label, subtotal, items: [{ code, desc, subtotal, mat: [{label, total}], lab: [...], lump: [...] }] }], grandTotal, updatedAt }
```
This exists specifically so Estimate Summary doesn't need to duplicate `SCOPE_CATEGORIES` (CES's ~400-item static data structure) or read `gridState` directly into a second file — CES computes the full itemized breakdown once, this page just renders it.

### Bill Of Quantities

Went through two designs before landing here. First: three explicit view-mode buttons (All Categories / By Category / By WBS Item), mirroring CES's own implicit click-to-drill levels but made visible as buttons. Dropped after feedback that once "All Categories" shows everything, the other two modes weren't earning their keep — scrolling through a full list already lets you find what you want. Current design: **one view, a search box** (`onBoqSearchInput()`, same placeholder text and behavior as CES's own grid search) filtering a fixed two-column card grid (`grid grid-cols-1 md:grid-cols-2`). A category-name match keeps that whole category; an item-level match (code or description) isolates just that item within its category card.

### Structural Components

The same priced WBS costs as the BOQ above, regrouped by physical building system instead of scope category — **11 components**: Sitework, Substructure, Superstructure, Roofing, Exterior Enclosure, Interior Finishes, Mechanical/MEP, Electrical, Equipment & Furnishings, Other Buildings, and **Indirect Costs & Overhead** (added this session — see Status). Each component is a matching rule against `STRUCTURAL_COMPONENTS`, one of two kinds:

- **Category-label match** (Sitework: `Site Clearance`/`Yard & Underground`/`Yard Utilities`/`Plant Utilities`/`Substation & Power`; Equipment & Furnishings: `Others`; Other Buildings: `Other Buildings`; Indirect Costs & Overhead: `Indirect Costs`) — the whole category's items count toward that component, code ignored entirely.
- **WBS-code match** (everything else) — a fixed list or numeric range of codes. Since every building (RM Warehouse, Making, Converting, PUB, Admin) shares the exact same `commonShell`/`commonInterior`/`commonMechanical`/`commonElectrical` codes, a component like Substructure (`105`/`110`/`120`) sums that code **across all five buildings** in one pass.

This only stays correct because CES locks default items' WBS codes (see Master Estimator's WBS item editability, above) — if a code could drift, a component's total could silently miss an item. It also depends on each building's items actually being independent of each other, which they weren't until this session's `cloneItems()` fix (see Status) — before that, a shared item counted once per `gridState` key but got revisited once per building in the BOQ/component totals, inflating both. Verified with a Node test asserting the sum of all 11 components equals the full BOQ total exactly, with every priced item matching exactly one component (zero double-counts, zero orphans). Indirect Costs was excluded from the first 10-component version entirely (its codes are letters, not numbers, so no rule ever caught it) — an earlier draft before that only had 7 components and silently dropped Site Clearance, Others, and Other Buildings too. Both gaps were caught by writing an explicit coverage test, not assumed complete.

Descriptions for all 11 components were rewritten this session to name the actual WBS items each one pulls from (e.g. Sitework spells out grading/drainage, retention basins, fire systems, paving types, utilities, and power distribution) rather than a vague one-line summary.

The four borderline WBS-code calls flagged under Known Blockers (`125`/`175`/`195`/`199`, all currently grouped under Exterior Enclosure) are unchanged this session — raised in conversation, not yet moved.

Rendered as a plain vertical list (`divide-y`), not a grid of cards — matches how CES's own BOQ panel and grid rows are laid out, after an earlier card-grid attempt was flagged as visually inconsistent with the rest of the app.

### Escalation, Undefined Cost, Contingency — read-only here too

None of the three percentage fields are editable on this page, same reasoning as calculator.html: exactly one place each of them ever gets set (their respective CES scorecard), everywhere else just displays the result.

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

**Labor-by-role note (limitation confirmed, intentionally left as-is this session):** the old shape assumed one central labor roster (`{ role, rate, count, days }` from a single page). Now that labor lines are scattered across many different scope items, a role's headcount and days can't be meaningfully summed into one pair (3 masons on one item + 1 mason on another isn't "4 masons"). Labor is instead aggregated by **Person-Days** (`headcount × days`, summed — the one honestly-additive unit) with a pre-computed subtotal per role, not re-derived from summed count × summed days. This session traced the root cause precisely: `getLaborBreakdown()` in `cost_estimate_scope.html` (line ~627) collapses headcount/days into Person-Days *before* the record is ever saved, and it's called from both `confirmSaveEstimate()` and `updateTotals()`'s cross-page snapshot — by the time anything reaches `history.html`, per-line headcount/days are already gone. Separately, CES's own BOQ side panel (`renderAllBreakdownPanel()`, ~line 1487) already renders full itemized detail live — per scope item, per category, and as an all-categories overview, grouped by Mat/Lab/Lump Sum — but that itemized detail is never serialized into the saved record either, only category-level totals and role-aggregated labor are. Fixing both properly (real per-line Headcount × Days, and a full itemized scope-item list in History) would require capturing a new itemized array at save time in **three places across two files** — `confirmSaveEstimate()` in both `cost_estimate_scope.html` and `calculator.html`, plus `updateTotals()`'s `urc_ces_cross_page` snapshot. Scoped and discussed; **deliberately deferred**, not attempted this session. See Known Blockers.

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
| `urc_ces_grid_state` | `{ itemKey: [line, ...] }` | The worksheet itself — `itemKey` is now `item.id`, see WBS item editability above |
| `urc_ces_meta` | `{ project, plant, type, preparedBy, date, meanSpendingDate }` | Header metadata bar — **single source of truth** for project details on both Save Estimate buttons, and read by Estimate Summary's meta bar |
| `urc_ces_collapsed_categories` | `string[]` | Which category ids are collapsed |
| `urc_ces_active_tab` | `'grid' \| 'contingency' \| 'undefinedCost' \| 'escalation'` | Last tab viewed, restored on reload — gained `'escalation'` this session |
| `urc_ces_scope_overrides` | `{ added: [{id, catId, sectionIdx, code, desc}], edited: {[itemId]: {code, desc}}, removed: [itemId] }` | **New this session** — custom WBS items and edits to default items' description. `removed` is now effectively dead (see WBS item editability above) but the shape is kept for backward compatibility |
| `urc_ces_scorecard_selections` | `{ contingency: {rowId: value}, undefinedCost: {rowId: value}, escalation: {rowId: value} }` | **New this session, replaces** `urc_ces_contingency_selections` and `urc_ces_undefined_selections` (both gone) — `rowId` is per-description now (`${criterionId}__${choiceIndex}`), not per-criterion, and `value` is a typed 0–100, not a choice index |
| `urc_ces_contingency_subtotal` | `{ subtotal, updatedAt }` — `subtotal` is a **whole-number percentage** (`8` = 8%), an **average** now, not a sum | Read by calculator.html's and Estimate Summary's Financial Ledger |
| `urc_ces_undefinedCost_subtotal` | `{ subtotal, updatedAt }` — same units/mechanism as above | Read by calculator.html's and Estimate Summary's Financial Ledger |
| `urc_ces_escalation_subtotal` | `{ subtotal, updatedAt }` — same units/mechanism as above | **New this session** — Escalation moved off calculator.html entirely, this is its one source now |
| `urc_ces_full_breakdown` | `{ categories: [{label, subtotal, items: [{code, desc, subtotal, mat, lab, lump}]}], grandTotal, updatedAt }` | **New this session** — full itemized breakdown, written on every grid edit; powers Estimate Summary's Bill Of Quantities and Structural Components without duplicating `SCOPE_CATEGORIES` into a second file |
| `urc_ces_boq_collapsed` | `'true' \| 'false'` | **New this session** — whether the BOQ side panel is collapsed to its thin strip |
| `urc_ces_cross_page` | `{ materialCost, laborCost, lumpSumCost, definedCost, categoryTotals, pricedLines, laborBreakdown, scorecards: { contingency: {subtotal, criteria}, undefinedCost: {subtotal, criteria}, escalation: {subtotal, criteria} }, updatedAt }` | `scorecards.escalation` **added this session**; `criteria` inside each scorecard is now one entry per row (per description), not per criterion |
| `urc_ccc_calc_ready` | `'true' \| 'false'` | calc.html: Length/Width/Clear Height all > 0 |
| `urc_ccc_ces_ready` | `'true' \| 'false'` | CES's own portion only (Defined Cost > 0 + Project + Prepared By) — does **not** factor in calc readiness; each page's button combines both flags itself |
| `urc_ccc_fx_rates` | `{ base: 'PHP', rates: {USD,EUR,JPY,SGD}, date }` | Last successful Frankfurter API fetch, offline fallback for the Ledger's currency conversion |
| `urc_ccc_state_v10` | *(calc.html's own full state object)* | **Lost `escalationPct`, `concreteClass`, `concretePriceM3`, `excavationCostM3`, `laborRateM3`, `rebarPriceKg`, `overheadProfit`, `formsPriceM2`, `laborCostDay` this session** — all dead fields with no input to write them anymore, cleaned up rather than left inert. Still holds `currencyTarget`, dimension/structure/capacity/footing-pedestal-quantity fields |
| `urc_ccc_history` | `record[]` | Saved estimates — `escalationPct` now sourced from CES's scorecard rather than calc.html's old field; scorecard `criteria` arrays are per-row now, not per-criterion |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html                  # Landing page — two-state hub (login form OR logged-in hub + Logout)
├── calculator.html             # Building Calculator + Footing & Pedestal + Financial Ledger (renamed from Bill of Quantities, rebuilt this session) + Save Estimate, both on one scrolling page
├── cost_estimate_scope.html    # Master Estimator — worksheet + Contingency/Undefined Cost/Escalation tabs + Save Estimate
├── estimate_summary.html       # NEW — read-only combined view: Financial Ledger + Structural Components + full BOQ, sourced entirely from CES/calc.html
├── labor_resources.html        # DEPRECATED — labor costing now lives inside Master Estimator; nothing links here
├── contingency_scorecard.html  # SUPERSEDED — logic now lives as an in-page tab in cost_estimate_scope.html; nothing links here either. Candidate for deletion, see Known Blockers.
├── admin.html                  # Admin panel — price management + escalation tool
├── history.html                # Estimate History — NOT re-verified against this session's record shape change (escalationPct added), see Known Blockers
├── sw.js                       # Service worker — offline caching (network-first)
├── prices.json                 # Core rates used in calculations
├── ccc-design-system.css       # NEW — extracted design tokens + component classes; not yet linked into any page
├── CCC_DESIGN_LANGUAGE.md      # NEW — written style guide / AI prompt describing the app's aesthetic
├── URC_CCC_Building_Calculator.xlsx  # NEW — clean Excel mirror of calculator.html's Building Calculator + Live Output Summary, named-range-driven formulas, plus a References tab (13 cited sources backing the Storage Capacity model). Reference/sanity-check tool, not a data source the app reads from.
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
│   └── labor_rates.json        # Labor role rates (30 roles as of this session) — field is named dailyRate and genuinely stores a per-day figure, no ×8 needed, see Master Estimator detail above
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
4. ~~Fallback labor rates may be inconsistent with the real database.~~ — **resolved, and the premise was wrong.** Checked directly this session: `dailyRate` was never actually hourly — no ×8 conversion happens anywhere in the real code (`computeLineCost()`, `getCostBreakdown()`), the admin table's own column header already reads "Rate (₱/Day)", and both the Selection popover and grid trigger button display it as "₱{rate}/day". The fallback object in `cost_estimate_scope.html` already matched `labor_rates.json` correctly. Only the code comments (and this doc, now corrected) claimed otherwise — fixed at the source.
5. **`sw.js`'s `ASSETS_TO_CACHE` needs a review pass** — `contingency_scorecard.html` is superseded, and Master Estimator's own dependencies changed (it no longer needs a separate labor page to be pre-cached for its labor lines to work, since labor pricing is now bundled into its own fetch).
6. **`sw.js` was not re-verified against the new Frankfurter API fetch this session.** The documented network-first + cache-everything strategy *should* transparently cover it (it's a normal CORS GET, not opaque), and there's an independent `localStorage` fallback (`urc_ccc_fx_rates`) either way — but this was reasoned from the README, not confirmed by reading `sw.js` directly this session.
7. **`ccc-design-system.css` and `CCC_DESIGN_LANGUAGE.md` are still not integrated into any page.** They exist as reference/target files. This session only did one small, deliberately narrow alignment — calculator.html's input focus-ring color now matches the shared blue accent (`--ccc-accent-ring`) — everything else (radii, spacing, tab shapes, actual `.ccc-*` class usage) is untouched. A full migration (starting with `cost_estimate_scope.html`, since it's the source the system was extracted from, or `calculator.html` given its Financial Ledger is now the newest/most design-conscious part of that page) means swapping inline Tailwind/custom-CSS class strings for the new semantic classes carefully, page by page, verifying nothing visually shifts. `calculator.html` in particular uses entirely bespoke classes (`.dim-input`, `.struct-select`, `.field-row`) with no relationship to `.ccc-*` — a bigger lift than migrating CES, which is already Tailwind-utility-based.
8. **calc.html's header "Export" button does nothing** — `pointer-events-none`/`opacity-40` with no `onclick`, confirmed dead this session. Export to Excel already lives in CES. Safe one-line removal whenever convenient.
9. **Save Estimate readiness flags don't update live across tabs.** `urc_ccc_calc_ready` / `urc_ccc_ces_ready` are recalculated on each page's own load and interaction, but a change written in one open tab won't refresh a *different* tab's button state until that tab's own state next changes. Not an issue for normal single-tab navigation; could surprise someone deliberately working both pages side by side in two tabs.
10. ~~`history.html` not re-verified against this session's record shape change~~ — **resolved.** `escalationPct` and the `ces` section's fields were confirmed directly against `confirmSaveEstimate()` in both `cost_estimate_scope.html` and `calculator.html`: both save paths produce structurally identical `ces: {...}` objects, so `history.html` renders correctly regardless of which page's Save button was clicked. `escalationPct` is now actually rendered (previously saved but never displayed).
11. **Stretch + Estimated Total Cost formulas** (Building Calculator) — dependent on `BuildingsBenchmarking rev 3.9 07.xlsm` on Sir Tony's machine. Currently manual input fields.
12. ~~3 extra Total Bay Spacing outputs~~ — **resolved by finding it was never actually in the app.** Dug into `WAREHOUSE_BUILDING_CALCULATOR.xlsx`'s BUILDING CALCULATOR sheet directly this session — the 3 duplicate/unlabeled "Total Bay Spacing" cells exist only in that Excel file, with no formula behind any of them there either. `calculator.html` never replicated that bug; it computes "Total Pallet Slots" instead. That said, a **real, separate bug was found and fixed** in that formula — see the Isle Width note under this session's Status entry.
13. **Tab 3 PhilConstruct unit rates** — pending Sir Tony sharing the rate list; currently `0` in `prices.json`.
14. ~~Forms Area formula (Footing Calculator) — needs verification~~ — **resolved.** Added this session: `Forms Area = (2×(FL+FW)×FD + 2×(PL+PW)×PH) × Nodes`, assuming vertical-side formwork only. See Footing & Pedestal Implementation Detail above.
15. **Shared estimate history** — saved estimates currently live in each user's local browser; GitHub-backed shared history via `api/save-history.js` not yet implemented.
16. **Admin write actions not yet gated for offline** — editing/saving price rows and running Annual Escalation both POST to `api/update-prices.js`, which fails silently offline with no user-facing warning.
17. **No network-first timeout** in `sw.js` — a `Promise.race()` timeout wrapper is planned but not yet added.
18. **`goBackMain()` cleanup** — now unused by `src/nav.js`. `history.html`'s inline copy was found to still call `Auth.logout()` — shadowing `nav.js`'s fixed version and silently reintroducing the auto-logout-on-Main-Page bug for that page specifically — and has been removed. Still needs a repo-wide check for remaining copies in `calculator.html`, `cost_estimate_scope.html`, and `labor_resources.html` — not checked this session either, don't assume the bug is gone app-wide just because it's gone from History.
19. **Real-device offline test pending** — only verified via DevTools' simulated Offline mode so far.
20. **Isometric diagram doesn't reflect Footing & Pedestal** — intentionally simplified, see Implementation Detail section above.
21. **Page header title is a placeholder** — `#header-title` currently reads "Summary (tent name)" on the older pages.
22. **Old test records in `urc_ccc_history` won't render correctly** against the rebuilt `history.html` — clear that key once if testing with stale data.
23. **History's Labor by Role is aggregated Person-Days, not real per-line Headcount × Days — and History has no full itemized scope-item list at all.** Root cause: `getLaborBreakdown()` in `cost_estimate_scope.html` collapses each labor line's headcount/days into a role-level Person-Days total *before* the record is ever saved. Separately, CES's own BOQ side panel already builds full itemized detail live but never serializes it into `urc_ces_full_breakdown` **at save time** — that key exists now (new this session) but only for Estimate Summary's live view, it isn't captured into `urc_ccc_history` records. Fixing both properly means capturing a new itemized-line array at save time in `confirmSaveEstimate()` (both files) and `updateTotals()`, then rendering it in `history.html`. Still deliberately deferred.
24. **`history.html` not re-verified against this session's scorecard/Escalation changes.** Scorecard `criteria` arrays in saved records are now one entry per description row, not one per criterion (see Storage Keys) — `escalationPct` now comes from CES's Escalation Scorecard rather than calc.html's old manual field. Neither was confirmed against `history.html`'s actual rendering code this session; check before relying on it for a save made after this update.
25. **Escalation Scorecard has only one placeholder criterion** — functional end-to-end (types, averages, feeds every Financial Ledger correctly) but not a real rubric yet. Swap in the actual criteria once Sir Tony provides them; no code changes needed beyond editing `ESCALATION_CRITERIA`'s data.
26. ~~"Pallet Size" input (Capacity tab, calculator.html) is now orphaned.~~ — **resolved.** Renamed/repurposed to Pallet Width and given a real job: Pallet Footprint = Pallet Depth × Pallet Width, part of this session's Storage Capacity rebuild (see Status). No longer orphaned.
27. ~~"No. of Stories" still doesn't factor into Building Volume~~ — **resolved.** Now multiplies both Gross Area and Building Volume (`MAX(Stories, 1)`), see Status. Its relevance for warehouse-type buildings (typically single-story with a mezzanine, not literally multiple floors) is a separate, still-open question — the field does something correct now if used, but whether it should be used for a typical warehouse project is still worth asking Sir Tony.
28. **Structural Components' code-to-component mapping was Claude's own grouping, not Sir Tony's** — based on UniFormat II (the industry-standard elemental classification this closely resembles) adapted down for a warehouse/plant context, since only one example (Footing & Pedestal → Substructure) was ever given directly. Reasonable and defensible, but worth a sanity check with him once he sees it, especially the borderline calls: `115 Superstructure Slabs` grouped with the frame (Superstructure) not the foundation (Substructure) — unchanged, still worth confirming — and, all still grouped under Exterior Enclosure and flagged in conversation this session but not yet moved: `125 Floor and wall caulk`, `175 Interior Load-bearing Wall & Fire Walls` (kept with Exterior Enclosure despite the word "Interior" in its name — it's filed under Building Shell in the source, not Interior Finishing), `195 Stair and Elevator Enclosures`, and `199` (Building Shell's generic "Others" catch-all). Separately, **Indirect Costs now has its own 11th component** (`Indirect Costs & Overhead`, added this session) rather than being silently excluded — that part of the original concern is resolved.
29. **Whether RM Warehouse/Making/Converting/PUB/Admin Building are meant to be 5 physically distinct buildings is unconfirmed.** CES's structure assumes they are (each gets its own full WBS set, matching the source Excel's identical five-way split), but `calculator.html`'s Building Dimensions Calculator has only one set of dimension inputs and doesn't model any of the 5 individually — so today, only whichever building the engineer has in mind while filling out Building Calculator gets dimension-driven quantities; the other 4 (or all 5, if they're not really distinct) get priced by hand in CES with no calculator backing them. Raised this session, not resolved — needs Sir Tony's confirmation, or a check of whether `WAREHOUSE_BUILDING_CALCULATOR.xlsx`'s own Building Calculator sheet has the same one-building limitation.
30. **Making/Converting/PUB/Admin Building's Building Shell/Interior Finishing/Building Mechanical/Building Electrical rows need real pricing entered.** Direct consequence of this session's `cloneItems()` fix (see Status #1) — whatever displayed under those 4 buildings before the fix was never independently theirs, just a mirror of RM Warehouse via the shared-array bug. They now read as genuinely blank. Not a bug to fix — a data-entry gap to fill, and only worth doing once Known Blocker #29 above is answered (no point pricing 4 buildings independently if they're not supposed to be independent).
31. **Four new labor rates need a real sanity check before being trusted for an estimate**: HVAC Technician (₱950/day), Fire Protection/Sprinkler Fitter (₱900/day), Elevator/Escalator Technician (₱1,300/day), Low-Voltage/Communications Technician (₱800/day) — added this session to `labor_rates.json`, but PH *project day-rate* data for these specific trades wasn't findable; the figures were derived from salaried-annual compensation data (SalaryExpert PH) discounted toward the existing trade-rate scale, not sourced the same way the other 11 new roles were (DMCI's 2024 manpower schedule / general PH construction daily-rate guides). Check against a real subcontractor quote or Sir Tony before relying on them.
32. **Total Nodes' `(bays+1)×(bays+1)` grid-intersection formula (this session's fix, see Status and Building Calculator — Storage Capacity) is mathematically correct for counting footings in a rectangular grid, but hasn't been confirmed against how URC actually lays out footings in practice.** Worth a direct check with Sir Tony/Engr. Emir before Concrete Volume/Rebar Weight/Excavation Volume/Forms Area — everything scaled by Nodes — gets used for a real material takeoff.
33. **Storage Capacity's cited references (companion Excel's References tab, 13 sources) are secondary industry sources — equipment vendor pages, logistics blogs, OSHA-citing safety guides — not URC's own rack vendor specs.** Good enough to ground the model in real numbers instead of guesses, not a substitute for Engr. Emir's sign-off on the actual benchmarks (pallet dimensions, aisle widths, space-utilization %, vertical clearances) before they drive a real estimate.
34. **`WAREHOUSE_BUILDING_CALCULATOR.xlsx`'s Cost Estimate box (Building Calculator sheet) is still a genuine empty stub** — "STRETCH" and "Estimated Total Cost" labels with no formula or data behind either, found this session while reconciling the source Excel against `calculator.html`. Nothing to port since there's nothing there to port; needs Sir Tony's input on what it was originally meant to compute before anyone can fill it in. Separately, `COST ESTIMATE SCOPE!F9:F16` in the same workbook has pre-existing `#REF!` errors, confirmed present before this session's changes and unrelated to them — flagged, not touched.

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