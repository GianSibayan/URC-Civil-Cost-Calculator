# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool built to replace the department's existing Excel-based workflow (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`). Engineers input building parameters and receive detailed cost estimates. Admins manage the price database through a protected panel.

## Status
🚧 In active development — June 2026 | History tab implemented (localStorage); GitHub-backed shared history planned

---

## What This App Does

Six modules across five HTML pages:

**1. Building Calculator** (`calculator.html`)
Engineer inputs dimensions (length, width, clear height, stories, mezzanine %), structure selections (structure type, roof, wall cladding, slab thickness), bay spacing, and capacity parameters. App auto-calculates floor area, building volume, total connection nodes, storage area, rack levels, and total pallet positions live. Right panel shows a live bar chart and Bill of Quantities breakdown.

**2. Footing & Pedestal Calculator** (`calculator.html`)
Engineer inputs footing/pedestal dimensions and selects concrete class. App auto-calculates concrete volume, rebar weight, excavation volume, formwork area, labor rate, and total cost in ₱ using rates fetched from `prices.json`.

**3. Cost Estimate Scope** (`cost_estimate_scope.html`)
Structured line-item form replicating the `COST ESTIMATE SCOPE` sheet from the Excel reference. Organized into tab sections by scope category (Yard & Underground, Yard Utilities, Plant Utilities, Substation & Power, RM Warehouse, Building Shell, Interior Finishing, Electrical, Mechanical).

**Scope item assignment workflow:**
1. Tick a scope item checkbox on the left → it becomes the active assignment target (row highlights blue, right panel shows item name and enables Save Price)
2. On the right, select a material category from the dropdown, check materials, set quantities, and build up a cart
3. Click **Save Price** → current Cart Total is saved as that item's price; the full cart (materials + quantities) is stored to that item; cart clears for the next item
4. Tick another scope item and repeat

Per-item data stored in `scopeItemData` keyed by `${catId}__${sectionIdx}__${itemIdx}`. Category totals and tab badges update in real-time after each save. All saved state (prices, carts, totals) persists across page navigations via `sessionStorage['urc_ces_session']`. A cross-page cache (`localStorage['urc_ces_cross_page']`) is also written on every save so that Labor & Resources and the Save Estimate flow can read CES totals across tabs. Material prices shown in the cart are escalation-adjusted client-side using `getYearMultiplier()` from `prices.json` meta — base JSONs always store 2026 values.

**4. Labor & Resources** (`labor_resources.html`)
Engineer enters headcount and days per labor type (regional workers, skilled trades, senior engineers, consultants) at fixed daily rates. App computes row totals and a grand total live. Equipment costs and profit margin inputs. The Bill of Quantities panel includes a **Material Costs** row pulled live from the CES cross-page cache (`localStorage['urc_ces_cross_page']`) via `loadMaterialsFromCES()` — grand total reflects Material + Labor + Equipment + Profit. Separate localStorage cache so labor state persists independently from the calculator.

**5. Admin Panel** (`admin.html`)
Protected price management interface. Admins can view, edit, save individual rows, add rows, import from Excel/CSV, and export all 14 category price lists. Core rates (concrete class prices, rebar, excavation, labor, escalation/place factors) are edited directly. Includes an Annual Escalation tool (see below).

**6. Estimate History** (`history.html`)
Displays all saved estimates in a row-based layout. Each row shows a dark header bar (project name, engineer name, timestamp) with an Expand/Collapse toggle. Collapsed view shows three mini summary cards — Building Calculator metrics, Cost Estimate Scope totals, and Labor & Resources breakdown. Expanded view shows full detail: a 2-column key-value grid for building dimensions, a category totals table for CES, a role breakdown table for labor, and a combined grand total bar. Shows amber-bannered demo data when no records exist. Delete per record (with confirmation) and Clear All available. Currently backed by `localStorage['urc_ccc_history']`; GitHub-backed shared storage via `api/save-history.js` is the planned next upgrade.

---

## Cross-Page Save Estimate Flow

The **Save Estimate** button appears in the header of all three calculator pages (`calculator.html`, `cost_estimate_scope.html`, `labor_resources.html`). It is disabled (greyed out) until all three pages have been sufficiently filled. Ready flags are written to localStorage by each page:

| Flag | Key | Condition |
|---|---|---|
| Calculator ready | `urc_ccc_calc_ready` | Length, Width, Clear Height all > 0 |
| CES ready | `urc_ccc_ces_ready` | At least one scope item has a saved price |
| Labor ready | `urc_ccc_labor_ready` | Grand total > 0 |

All three flags must be `"true"` for the button to enable — checked by `checkSaveButton()` which runs on every state change and on page load. Once enabled, clicking Save Estimate opens a modal prompting for **Project Name** and **Engineer Name**. On confirm, `confirmSaveEstimate()` reads from all three stored caches (not in-memory state), builds a single combined record, and writes it to `localStorage['urc_ccc_history']`.

The combined record schema:
```json
{
  "id": "ccc_hist_<timestamp>",
  "savedAt": "<ISO string>",
  "projectName": "...",
  "engineerName": "...",
  "calculator": { "snapshot": { ...all inputs }, "summary": { ...computed metrics } },
  "ces": { "categoryTotals": { ...per category }, "pricedItems": N, "grandTotal": N },
  "labor": { "roles": [...], "globalEquipment": N, "globalProfit": N, "laborCost": N, "equipmentCost": N, "profitCost": N, "grandTotal": N, "totalHeads": N },
  "grandTotal": N
}
```

`confirmSaveEstimate()` is identical across all three pages and reads exclusively from localStorage caches — not from in-memory variables — so it works regardless of which page the user saves from.

---

## Access & Auth

- All users log in with a **URC email + password**
- No public access — login required for all pages
- User credentials stored in Vercel environment variable (`USERS`)
- Session stored in `sessionStorage` — clears on browser close
- `Auth.logout()` clears session and redirects to `index.html`
- Password changes: contact Gian (Vercel owner) to update the `USERS` env var

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Styling | Tailwind CSS (CDN) |
| Charts | Chart.js (CDN) |
| Excel parsing | SheetJS / xlsx (CDN) |
| Hosting | Vercel |
| Source control | GitHub (private repo) |
| Price database | `prices.json` + 14 category JSONs in `/data/` |
| Auth + price saves | Vercel Serverless Functions |
| CES session state | `sessionStorage['urc_ces_session']` — prices, carts, totals per scope item |
| CES cross-page cache | `localStorage['urc_ces_cross_page']` — category totals readable by Labor & Save flow |
| Calculator cache | `localStorage['urc_ccc_state_v10']` — all building/footing inputs |
| Labor cache | `localStorage['urc_ccc_labor_2026']` — labor state, equipment, profit |
| Ready flags | `localStorage['urc_ccc_calc_ready']`, `['urc_ccc_ces_ready']`, `['urc_ccc_labor_ready']` |
| Estimate history | `localStorage['urc_ccc_history']` — array of combined records, newest first |
| Currency | Philippine Peso (₱) |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html                  # Landing / login page
├── calculator.html             # Building + Footing calculator tabs
├── cost_estimate_scope.html    # Cost Estimate Scope page
├── labor_resources.html        # Labor & Resources rates page
├── history.html                # Estimate History page — saved records viewer
├── admin.html                  # Admin panel — price management + escalation tool
├── prices.json                 # Core rates used in calculations:
│                               #   concrete class prices, rebar, excavation,
│                               #   forms, labor, overhead rate, escalation factor,
│                               #   place factor, escalation history, price snapshots
├── data/                       # 14 price list JSONs (sourced from CONSTRUCTION_PRICE_LIST_2.xlsx)
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
│   └── pipes.json              # 3 sub-tables: nominal, seamless, ERW welded
├── src/
│   ├── auth.js                 # Frontend session handling (requireLogin, logout, getEmail)
│   └── parser.js               # loadCategory, saveBulk, savePricesJson, downloadCategory
├── api/
│   ├── auth.js                 # Vercel serverless — validates credentials, returns token
│   └── update-prices.js        # Vercel serverless — pushes any whitelisted JSON to GitHub
├── assets/
│   └── style.css
└── vercel.json                 # Framework preset: "Other" (no build step)
```

---

## Vercel Environment Variables

Set these in the Vercel dashboard (Settings → Environment Variables) before deploying:

| Variable | Value |
|---|---|
| `USERS` | JSON string — `[{"email":"...","password":"..."}]` |
| `GITHUB_TOKEN` | Classic PAT with full `repo` scope |
| `GITHUB_REPO` | `GianSibayan/URC-Civil-Cost-Calculator` |
| `ADMIN_SECRET` | Secret string for session token signing |

> After adding or changing env vars, redeploy for them to take effect: Deployments → latest → `...` → Redeploy.

> `GITHUB_FILE_PATH` is no longer used — `update-prices.js` accepts the filename in the request body and validates against an internal whitelist.

---

## How Prices Work

### `prices.json`
Single source of truth for all rates used in live calculations:
- **`tab1_tab2`** — concrete class prices per m³ (keyed by class e.g. `C30/37`), rebar price/kg, excavation cost/m³, forms price/m², labor cost/day, overhead & profit rate, escalation factor, place factor, steel density, rebar weights per meter
- **`meta`** — last_updated, escalation_history (array), price_snapshots (object keyed by year)

### `/data/` folder — 14 category JSONs
Construction price list reference data. Each file has its own schema:

| File | Schema |
|---|---|
| concreting_materials, timber_formworks, roofing, steel_truss, painting_works, electrical, fencing, ceiling, plumbing | `{ name, unit, price_php }` |
| `rebars.json` | `{ spec, size, length, price_php }` |
| `concrete_mix.json` | `{ product, curing_time, price_php }` |
| `equipment.json` | `{ name, category, unit, rate_min_php, rate_max_php }` |
| `masonry.json` | `{ prices: [{name, unit, price_php}], concrete_proportion_table: [...] }` |
| `pipes.json` | `{ nominal_size_unit_price, seamless_galvanized_steel, erw_welded_galvanized_steel }` |

Admins update prices via `admin.html`. All saves push to GitHub via the Vercel serverless function and take effect on the next page load for all users.

---

### Annual Price Escalation (client-side, non-destructive)
The Admin Panel includes an **Annual Escalation** tool (sidebar → Annual Escalation):

1. Select the **active year** and enter the **escalation rate %** per year
2. Click **Apply** — saves only `active_year` and `year_rates` to `prices.json` meta (one GitHub write)

**How scaling works:**
- All 14 category JSONs always store **2026 base values** — they are never modified by escalation
- Every page that displays prices calls `getYearMultiplier()` which reads `active_year` and `year_rates` from `prices.json` meta and computes: `price × (1 + rate/100)^(activeYear − 2026)`
- `scalePrice()` applies this multiplier client-side at render time in admin, calculator, CES, and labor pages
- To "revert": change the active year back to 2026 in admin — the base JSON values are unchanged

This is deliberately non-destructive. The database is always the 2026 truth; the year setting is just a display multiplier.

---

## Data Fetch Pattern

All JSON fetches try two sources in order:
1. **Relative path** (`/prices.json`, `/data/xxx.json`) — works on Vercel
2. **Raw GitHub fallback** (`https://raw.githubusercontent.com/GianSibayan/URC-Civil-Cost-Calculator/main/...`) — fallback for local dev or CDN cache misses

---

## No Build Step

Plain HTML/JS — no frameworks, no compilers, no `npm install`. Open any `.html` file directly in a browser, or deploy to Vercel as-is. Framework preset in Vercel dashboard must be set to **Other** (not Vite, not Next.js).

---

## Known Blockers / Pending Items

1. **Stretch + Estimated Total Cost formulas** (Building Calculator) — dependent on `BuildingsBenchmarking rev 3.9 07.xlsm` on Sir Tony's machine. Currently manual input fields.
2. **3 extra Total Bay Spacing outputs** — formula unclear, needs Sir Tony clarification.
3. **Tab 3 PhilConstruct unit rates** — pending Sir Tony sharing the rate list; currently `0` in `prices.json`.
4. **Forms Area formula** (Footing Calculator) — needs verification.
5. **Shared estimate history** — history is currently localStorage only (per-browser, per-device). GitHub-backed shared storage via `api/save-history.js` + `/data/history.json` is designed and ready to implement; see README section above for the full approach.
6. **CES four-part cost estimation** — Sir Tony requested restructuring CES into per-item breakdown of material / labor / equipment / profit margin. Currently cart total is a single lump price per scope item.
7. **Footing & Pedestal nav** in `calculator.html` — tab routing needs a flow fix (known, deferred).
8. **Labor & Resources** data not yet fed back into the main cost breakdown in the calculator sidebar.

---

## Handover (For Future Interns)

1. Ask to add your URC email to the `USERS` env var in Vercel dashboard
2. Ask to add you as a GitHub repo collaborator (repo is private under `GianSibayan`)
3. All price list data lives in `/data/` — edit via `admin.html`, never directly on GitHub
4. Run escalation in `admin.html` → Annual Escalation at the start of each new year
5. Sir Tony owns the Excel reference file and PhilConstruct rate list — confirm any formula questions with him in the Monday 11AM drumbeat
6. Estimate history is in `localStorage['urc_ccc_history']` — if upgrading to shared GitHub storage, see the Cross-Page Save Estimate Flow section above for the full record schema

---

## Team

| Role | Name |
|---|---|
| Backend, API, Logic, GitHub/Vercel | Gian Eugene P. Sibayan |
| Frontend UI, Figma, Logic, HTML/CSS | Althea Antonio, Paolo Sarmiento |
| Project Owner | Engr. Tony Pabilan |
| Direct Supervisor | Engr. Emir Manansala |

*ESD Global Engineering Internship Batch Hatdog 2026, URC / JG Summit Holdings*