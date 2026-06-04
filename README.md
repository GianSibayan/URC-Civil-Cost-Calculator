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

**3. Cost Estimate Scope** — A full line-item breakdown of every construction cost category (site clearance, yard utilities, building shell, interior finishing, mechanical, electrical, engineering management, risk funds, etc.). Engineer inputs quantities per line item; app multiplies by PhilConstruct unit rates from `prices.json` and sums to a grand total with escalation and place factors applied.

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
| Price Database | `prices.json` on GitHub |
| Auth + Price Updates | Vercel Serverless Functions |
| Currency | Philippine Peso (₱) |

---

## Project Structure

```
URC-Civil-Cost-Calculator/
├── index.html              # Landing / login page
├── calculator.html         # Main app — 4 calculator tabs
├── admin.html              # Admin panel — price management
├── prices.json             # Single source of truth for ALL rates
│                           # Tab 1 & 2: concrete, rebar, labor, etc.
│                           # Tab 3: PhilConstruct unit rates per line item
├── assets/
│   └── style.css           # Global styles
├── src/
│   ├── script.js           # All calculation logic (Tab 1, 2, 3, 4)
│   │                       # Fetches prices.json on load
│   ├── parser.js           # SheetJS Excel/CSV parsing for admin uploads
│   └── auth.js             # Frontend session token handling
├── api/
│   ├── auth.js             # Vercel function — validates email + password
│   └── update-prices.js    # Vercel function — pushes prices.json to GitHub
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
| `GITHUB_FILE_PATH` | `prices.json` |

---

## How prices.json Works

`prices.json` is the single source of truth for all rates used across the app.

- **Tab 1 & 2 rates** — concrete class prices, rebar price/kg, excavation cost/m³, forms price/m², labor cost/day, overhead & profit rate, escalation factor, place factor
- **Tab 3 unit rates** — PhilConstruct rates per line item (pending confirmation from Sir Tony)

Admins update prices via `admin.html` — either manually per field or by uploading an Excel/CSV. Changes are pushed to GitHub via Vercel serverless function and take effect on the next page load for all users.

---

## Known Blockers

1. **Stretch + Estimated Total Cost formulas** (Tab 1) — dependent on `BuildingsBenchmarking rev 3.9 07.xlsm` stored locally on Sir Tony's machine. Currently manual input fields.
2. **3 extra Total Bay Spacing outputs** (Tab 1) — formula unclear, needs Sir Tony clarification.
3. **Tab 3 PhilConstruct unit rates** — all currently set to 0 in `prices.json` pending Sir Tony sharing the rate list.
4. **Forms Area formula** (Tab 2) — needs verification with Sir Tony.
5. **Benchmark Data** — Mean Spending Date, Business Area, Functionality rows broken due to missing linked `.xlsm` file. Cosmetic only.

---

## No Build Step

Plain HTML/JS — no frameworks, no compilers, no `npm install`. Open `index.html` in a browser or deploy directly to Vercel.

---

## Handover (For Future Interns)

1. Ask Gian to add your URC email to `USERS` env variable in Vercel dashboard
2. Ask Gian to add you as a GitHub repo collaborator
3. Read `CCC_FLOW.md` and `CCC_SPEC.md` in the repo for full context
4. Read the Known Blockers section above — confirm status with Sir Tony
5. Sir Tony owns the Excel reference file and PhilConstruct rate list

---

## Team

| Role | Name |
|---|---|
| Backend, API, Logic, GitHub/Vercel | Gian Eugene P. Sibayan — GE Intern |
| Frontend UI, Figma, HTML/CSS | Althea — GE Intern |
| Project Owner | Engr. Tony Pabilan |
| Direct Supervisor | Engr. Emir Manansala |

*ESD Global Engineering Internship Batch, URC / JG Summit Holdings*