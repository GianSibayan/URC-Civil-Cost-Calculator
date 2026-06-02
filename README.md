# Civil Cost Calculator (CCC)
> Engineering Services Department — Universal Robina Corporation / JG Summit Holdings

A web-based civil project cost estimation tool built to replace the department's existing Excel-based calculator. Engineers input building parameters and receive a detailed cost estimate covering materials, labor, engineering fees, and contingency costs.

## Status
🚧 In active development — Week 3, May 2026

## Features (Planned)
- Building parameter input form (dimensions, floor area, height, mezzanine, cantilever, etc.)
- Real-time cost breakdown by category
- Admin panel for price reference management
- Excel upload for bulk price updates via SheetJS
- Manual price editing per material
- PDF export of estimates
- GitHub-backed prices.json as single source of truth

## Tech Stack
| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Excel Parsing | SheetJS (xlsx) |
| Hosting | Vercel |
| Data Layer | prices.json (GitHub) |
| Price Updates | Vercel Serverless Functions + GitHub API |

## Project Structure
```
civil-cost-calculator/
├── index.html          # Main estimator UI
├── admin.html          # Admin panel (price management)
├── prices.json         # Material price reference data
├── src/
│   ├── calculator.js   # Core estimation logic
│   ├── parser.js       # SheetJS Excel parsing
│   └── admin.js        # Admin panel logic
├── assets/
│   └── style.css       # Shared styles
└── api/
    └── update-prices.js # Vercel serverless function
```

## Getting Started
No build step required. Open `index.html` in a browser or deploy directly to Vercel.

## Intern Handoff
All logic is in plain HTML/JS — no frameworks, no proprietary dependencies. Future batches can maintain and extend without additional tooling or licenses.

---
Developed by: Gian Eugene P. Sibayan — GE Intern, ESD
Supervised by: Engr. Tony (Project Owner), Engr. Emir Manansala
