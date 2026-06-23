# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool built to replace the department's existing Excel-based workflow (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`). Engineers input building parameters and receive detailed cost estimates. Admins manage the price database through a protected panel.

## Status
🚧 In active development — June 2026

---

## What This App Does

Five modules across four HTML pages:

**1. Building Calculator** (`calculator.html`)
Engineer inputs dimensions (length, width, clear height, stories, mezzanine %), structure selections (structure type, roof, wall cladding, slab thickness), bay spacing, and capacity parameters. App auto-calculates floor area, building volume, total connection nodes, storage area, rack levels, and total pallet positions live. Right panel shows a live bar chart and Bill of Quantities breakdown.

**2. Footing & Pedestal Calculator** (`calculator.html`)
Engineer inputs footing/pedestal dimensions and selects concrete class. App auto-calculates concrete volume, rebar weight, excavation volume, formwork area, labor rate, and total cost in ₱ using rates fetched from `prices.json`.

**3. Cost Estimate Scope** (`cost_estimate_scope.html`)
Structured line-item form replicating the `COST ESTIMATE SCOPE` sheet from the Excel reference. Organized into accordion sections by scope category (Yard & Underground, Yard Utilities, Plant Utilities, Substation, Building Shell, Interior Finishing, Electrical, Mechanical). Engineer checks off items in scope. Material cart with live DB lookup from the 14 category JSONs. Subtotals by category, grand total, and adjusted total (× escalation factor × place factor from `prices.json`).

**4. Labor & Resources** (`labor_resources.html`)
Engineer enters headcount and days per labor type (regional workers, skilled trades, senior engineers, consultants) at fixed daily rates. App computes row totals and a grand total live. Equipment costs and profit margin inputs. Separate localStorage cache so it persists independently from the calculator.

**5. Admin Panel** (`admin.html`)
Protected price management interface. Admins can view, edit, save individual rows, add rows, import from Excel/CSV, and export all 14 category price lists. Core rates (concrete class prices, rebar, excavation, labor, escalation/place factors) are edited directly. Includes an Annual Escalation tool (see below).

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
| Currency | Philippine Peso (₱) |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html                  # Landing / login page
├── calculator.html             # Building + Footing calculator tabs
├── cost_estimate_scope.html    # Cost Estimate Scope page (separate from calculator)
├── labor_resources.html        # Labor & Resources rates page
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

## Annual Price Escalation

The Admin Panel includes an **Annual Escalation** tool (sidebar → Tools → Annual Escalation):

1. Enter the **year** the new prices apply to (e.g. 2027) and the **escalation rate %** (e.g. 10)
2. Click **Preview Changes** — loads all 14 JSONs and `prices.json`, applies the multiplier, and shows a before→after table per category
3. Review the preview, then click **Confirm & Apply**

**What it does on confirm:**
- Multiplies every price field in all 14 category JSONs by `(1 + rate/100)`, rounded to 2 decimal places
- Multiplies core rates in `prices.json` (concrete class prices, rebar, excavation, forms, labor) by the same factor
- Saves a **price snapshot** of the pre-escalation values into `prices.json` under `meta.price_snapshots[year-1]`
- Records the escalation in `meta.escalation_history` with year, rate, date, and who applied it

**Reverting:**
Each history entry shows a **"Revert to [year]"** button if a snapshot exists. Clicking it restores all category JSONs and core rates to the snapshotted values and logs the revert in escalation history. This is the only safe rollback path — GitHub commit history is the fallback if no snapshot exists.

**Safeguard:** If escalation for the selected year was already applied, a warning banner appears before you can preview.

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
5. **Cost Estimate Scope cart integration** — right panel currently shows placeholder; shopping cart / per-item cost logic not yet wired.
6. **Footing & Pedestal nav** in `calculator.html` — tab routing needs a flow fix (known, deferred).
7. **Labor & Resources** data not yet fed back into the main cost breakdown in the calculator sidebar.

---

## Handover (For Future Interns)

1. Ask to add your URC email to the `USERS` env var in Vercel dashboard
2. Ask to add you as a GitHub repo collaborator (repo is private under `GianSibayan`)
3. All price list data lives in `/data/` — edit via `admin.html`, never directly on GitHub
4. Run escalation in `admin.html` → Annual Escalation at the start of each new year
5. Sir Tony owns the Excel reference file and PhilConstruct rate list — confirm any formula questions with him in the Monday 11AM drumbeat

---

## Team

| Role | Name |
|---|---|
| Backend, API, Logic, GitHub/Vercel | Gian Eugene P. Sibayan |
| Frontend UI, Figma, Logic, HTML/CSS | Althea Antonio, Paolo Sarmiento |
| Project Owner | Engr. Tony Pabilan |
| Direct Supervisor | Engr. Emir Manansala |

*ESD Global Engineering Internship Batch, URC / JG Summit Holdings*