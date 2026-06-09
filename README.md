# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool built to replace the department's existing Excel-based calculator (`WAREHOUSE_BUILDING_CALCULATOR.xlsx`). Engineers input building parameters and receive detailed cost estimates. Admins manage the price database through a protected panel.

## Status
🚧 In active development — June 2026

---

## What This App Does

Four modules, all in one app:

**1. Building Calculator** — Engineer inputs dimensions (length, width, clear height, stories, mezzanine %), structure selections (structure type, roof, wall cladding, slab thickness), bay spacing, and capacity parameters. App auto-calculates floor area, building volume, total bay spacing, storage area, rack levels, and total pallet positions live as you type.

**2. Footing & Pedestal Calculator** — Engineer inputs footing/pedestal dimensions and selects concrete class. App auto-calculates concrete volume, rebar weight, excavation volume, formwork area, labor rate, and total cost in ₱ using rates from `prices.json`.

**3. Cost Estimate Scope** — A full line-item breakdown of every construction cost category across multiple buildings (site clearance, yard utilities, building shell, interior finishing, mechanical, electrical, engineering management, risk funds, etc.). Engineer inputs a lump sum cost per line item; app sums by category and applies escalation and place factors to produce a Total Predicted Cost.

**4. Benchmark Data** — Read-only reference table showing historical real-world project costs (P&G data, 11 international projects) for engineers to sanity-check their estimates.

---

## Access & Auth

- All users log in with a **URC email + password**
- No public access — login required to use any part of the app
- User credentials stored in Vercel environment variables (`USERS`)
- Once logged in, full access to calculator and admin panel
- Session stored in `sessionStorage` — clears on browser close
- Password changes: contact Gian (Vercel owner) to update

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Excel Parsing | SheetJS (xlsx) — CDN |
| Hosting | Vercel |
| Source Control | GitHub (private repo) |
| Price Database | `prices.json` + 14 category JSONs in `/data/` |
| Auth + Price Updates | Vercel Serverless Functions |
| Currency | Philippine Peso (₱) |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html              # Landing / login page
├── calculator.html         # Main app — calculator tabs
├── admin.html              # Admin panel — price management
├── prices.json             # Footing & Pedestal rates + Tab 3 unit rates
│                           # concrete classes, rebar, labor, escalation factor, etc.
├── data/                   # Price list reference JSONs (14 files)
│   ├── concreting_materials.json
│   ├── timber_formworks.json
│   ├── roofing.json
│   ├── steel_truss.json
│   ├── painting_works.json
│   ├── electrical.json
│   ├── masonry.json        # Includes concrete proportion table
│   ├── fencing.json
│   ├── ceiling.json
│   ├── plumbing.json
│   ├── rebars.json
│   ├── concrete_mix.json
│   ├── equipment.json      # Rate ranges (min/max per hour)
│   └── pipes.json          # 3 sub-tables: nominal, seamless, ERW welded
├── assets/
│   └── style.css           # Global styles
├── src/
│   ├── script.js           # All calculation logic
│   │                       # Fetches prices.json on load
│   ├── parser.js           # Category JSON loading, saving, export
│   │                       # Handles all 14 /data/ JSONs + prices.json
│   └── auth.js             # Frontend session token handling
├── api/
│   ├── auth.js             # Vercel function — validates email + password
│   └── update-prices.js    # Vercel function — pushes any JSON file to GitHub
│                           # Accepts filename param, validated against whitelist
└── README.md
```

---

## Vercel Environment Variables

Set these in the Vercel dashboard before deploying:

| Variable | Purpose |
|---|---|
| `USERS` | JSON string of allowed users — `[{"email":"...","password":"..."}]` |
| `GITHUB_TOKEN` | Personal access token with repo write access |
| `GITHUB_REPO` | `GianSibayan/URC-Civil-Cost-Calculator` |
| `ADMIN_SECRET` | Secret used for session token validation |

> Note: `GITHUB_FILE_PATH` is no longer used — `update-prices.js` now accepts the target filename in the request body and validates it against an internal whitelist.

---

## How Prices Work

### `prices.json`
Single source of truth for rates used in calculations:
- **Footing & Pedestal rates** — concrete class prices, rebar price/kg, excavation cost/m³, forms price/m², labor cost/day, overhead & profit rate, escalation factor, place factor
- **Tab 3 unit rates** — PhilConstruct rates per line item (pending confirmation from Sir Tony, currently all 0)

### `/data/` folder (14 JSONs)
Construction price list reference data sourced from `CONSTRUCTION_PRICE_LIST_2.xlsx`. Used as a reference panel in the admin panel and future Tab 3 material helper. Not used in live calculations yet.

Each file has its own schema:
- **Simple** (10 files) — `{ name, unit, price_php }`
- **rebars.json** — `{ spec, size, length, price_php }`
- **concrete_mix.json** — `{ product, curing_time, price_php }`
- **equipment.json** — `{ name, category, unit, rate_min_php, rate_max_php }`
- **masonry.json** — `{ prices: [...], concrete_proportion_table: [...] }`
- **pipes.json** — `{ nominal_size_unit_price, seamless_galvanized_steel, erw_welded_galvanized_steel }`

Admins update prices via `admin.html` — edit inline per row or use "Save all changes". All changes are pushed to GitHub via Vercel serverless function and take effect on the next page load for all users. Each category can also be exported as Excel from the admin panel.

---

## Known Blockers

1. **Stretch + Estimated Total Cost formulas** (Tab 1) — dependent on `BuildingsBenchmarking rev 3.9 07.xlsm` stored locally on Sir Tony's machine. Currently manual input fields.
2. **3 extra Total Bay Spacing outputs** (Tab 1) — formula unclear, needs Sir Tony clarification.
3. **Tab 3 PhilConstruct unit rates** — all currently set to 0 in `prices.json` pending Sir Tony sharing the rate list.
4. **Forms Area formula** (Tab 2) — needs verification with Sir Tony.
5. **Benchmark Data** — Mean Spending Date, Business Area, Functionality rows broken due to missing linked `.xlsm` file. Cosmetic only.

---

## No Build Step

Plain HTML/JS — no frameworks, no compilers, no `npm install`. Open `index.html` in a browser or deploy directly to Vercel. Framework preset in Vercel dashboard must be set to **Other** (not Vite).

---

## Handover (For Future Interns)

1. Ask Gian to add your URC email to `USERS` env variable in Vercel dashboard
2. Ask Gian to add you as a GitHub repo collaborator
3. Read `CLAUDE.md` in the repo for full dev context
4. Read the Known Blockers section above — confirm status with Sir Tony
5. Sir Tony owns the Excel reference file and PhilConstruct rate list
6. All price list data lives in `/data/` — edit via `admin.html`, not directly in GitHub

---

## Team

| Role | Name |
|---|---|
| Backend, API, Logic, GitHub/Vercel | Gian Eugene P. Sibayan — GE Intern |
| Frontend UI, Figma, HTML/CSS | Althea — GE Intern |
| Project Owner | Engr. Tony Pabilan |
| Direct Supervisor | Engr. Emir Manansala |

*ESD Global Engineering Internship Batch, URC / JG Summit Holdings*