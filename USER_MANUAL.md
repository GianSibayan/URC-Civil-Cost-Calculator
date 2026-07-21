# URC Civil Cost Calculator — User Manual

This manual guides engineers through using the Civil Cost Calculator (CCC) to produce a complete cost estimate for a civil construction project. Follow the pages in order — Quantities Takeoff → Master Estimator — then save your estimate.

---

## Table of Contents
1. [Logging In](#1-logging-in)
2. [Navigating the App](#2-navigating-the-app)
3. [Building Calculator](#3-building-calculator)
4. [Footing & Pedestal Calculator](#4-footing--pedestal-calculator)
5. [Master Estimator Worksheet](#5-master-estimator-worksheet)
6. [Contingency & Undefined Cost Scorecards](#6-contingency--undefined-cost-scorecards)
7. [Saving an Estimate](#7-saving-an-estimate)
8. [Estimate History](#8-estimate-history)
9. [Logging Out](#9-logging-out)
10. [Using CCC Without a Connection](#10-using-ccc-without-a-connection)
11. [Tips & Notes](#11-tips--notes)

---

## 1. Logging In

1. Open the app URL in your browser: `https://urc-civil-cost-calculator.vercel.app`
2. If you're not currently logged in, you'll land directly on the login form — enter your **URC email address** and **password**, then click **Login**
3. If you're already logged in from earlier in your browser session, you'll instead land on the **hub view** — see [Section 2](#2-navigating-the-app) — with no need to log in again

> If your credentials don't work, contact Gian (gian.e.sibayan@gmail.com) to have your account added.

Your session stays active while the browser tab is open. Closing the browser or tab logs you out automatically. You can also log out manually at any time — see [Section 9](#9-logging-out).

---

## 2. Navigating the App

### The Landing Hub

Once logged in, the app's main URL shows a hub with three options:
- **Calculator** — opens the Building Calculator
- **Access Price List** — opens the Admin Panel (price management)
- **Logout** — ends your session (see [Section 9](#9-logging-out))

### The Sidebar

Once inside the calculator pages, the **left sidebar** is always visible. Use it to move between pages:

| Sidebar Item | What It Opens |
|---|---|
| Master Estimator | Scope line-item cost builder, plus Contingency and Undefined Cost scorecards as tabs within the same page |
| Quantities Takeoff | Building dimensions, structure, and footing inputs |
| History | All saved estimates |
| Main Page | Returns you to the landing hub — **this does not log you out.** You'll stay signed in and simply see the hub view described above. |

> **Note:** the sidebar's separate "Labor Database Ref." and "Contingency Score" links from earlier versions of this app are no longer the way to reach those tools. Labor costing and both scorecards now live **inside Master Estimator itself** — see Sections 5 and 6. If those old sidebar links are still visible for you, they're leftover and shouldn't be used; ask whoever's maintaining the app if you're not sure.

The **Save Estimate** button lives in the header of **both** Quantities Takeoff and Master Estimator now — see [Section 7](#7-saving-an-estimate) for how the two work together.

> **Note:** Main Page previously logged users out automatically when clicked. This has been changed — Main Page is now pure navigation, and logging out is a separate, deliberate action (see [Section 9](#9-logging-out)).

---

## 3. Building Calculator

**Purpose:** Input your building's physical dimensions and structural specifications. The app computes floor area, gross area, building volume, pallet positions, and connection nodes automatically.

### Step-by-Step

**Tab: Building**

1. Click **Quantities Takeoff** in the sidebar
2. Make sure the **Building** tab is selected at the top

**Dimensions panel (left side)**

3. Enter the following under **Building Dimensions:**
   - **Length** — total building length in meters
   - **Width** — total building width in meters
   - **Clear Height** — interior clear height from floor to lowest obstruction, in meters
   - **No. of Stories** — number of floor levels (usually 1 for a warehouse)
   - **% Mezzanine** — percentage of floor area that has a mezzanine level (enter 0 if none)

4. Under **Structure Selections**, choose from the dropdowns:
   - **Structure Type** — e.g. Steel Rigid Frame, Concrete, Tilt-Up
   - **Roof Type** — e.g. Standing Seam, Corrugated
   - **Wall Cladding** — e.g. Metal Panel, Masonry
   - **Slab Thickness** — e.g. 100mm, 150mm

5. Under **Bay Spacing**, enter:
   - **Bay Spacing (L)** — distance between frames along the length, in meters
   - **Bay Spacing (W)** — distance between frames along the width, in meters

6. Under **Capacity**, enter:
   - **Dock Doors** — number of loading dock doors
   - **Drive-in Doors** — number of drive-in doors
   - **Rack Levels**, **Pallet Size**, **Aisle Width** — for storage capacity calculation

**Results (right side)**

The right panel updates live as you type. It shows:
- Floor Area, Gross Area, Building Volume, Perimeter
- Total Connection Nodes, Storage Area
- Rack Levels, Total Pallet Positions
- A live isometric diagram of the building
- The **Financial Ledger** — see below

**Switching between Building Calculator's own sections**

The pill tabs next to the **Building Calculator** heading (**Dimension**, **Structure**, **Capacity**) switch between that module's own input sections.

**Getting to Footing & Pedestal**

Footing & Pedestal is the next section down on the same scrolling page. See [Section 4](#4-footing--pedestal-calculator).

### The Financial Ledger

The Financial Ledger sits at the bottom of the right panel. Everything on it except **Escalation** is read automatically from Master Estimator — there's nothing to fill in here except that one field:

| Row | Where it comes from |
|---|---|
| Material Costs | Sum of every material line in Master Estimator |
| Labor Costs | Sum of every labor line in Master Estimator |
| Raw Total | Material + Labor (+ lump sum) — Master Estimator's Defined Cost |
| Undefined Cost | Master Estimator's Undefined Cost Scorecard result |
| **Escalation** | **Type a percentage here directly** — the only editable field on the Ledger |
| Contingency | Master Estimator's Contingency Scorecard result |
| **Estimated Grand Total** | Raw Total × (1 + Undefined% + Escalation% + Contingency%) |

Since Material Costs, Labor Costs, Raw Total, Undefined Cost, and Contingency all come from Master Estimator, fill in the worksheet there first (or at least enter something) if you want to see real numbers instead of ₱0.00 here.

### Currency conversion

Below the Grand Total, a **Convert to** dropdown lets you see the total in USD, EUR, JPY, or SGD alongside the ₱ figure. The exchange rate updates automatically from a live source when you have a connection, and a small note under the converted amount shows the date the rate is from. If you're offline, it falls back to the last rate it successfully fetched — if it's never fetched one yet (e.g. very first time opening the app with no connection), it'll show "Rates unavailable" instead of a wrong number.

---

## 4. Footing & Pedestal Calculator

**Purpose:** Compute concrete volume, rebar weight, excavation, formwork, and total cost for individual footings and pedestals.

### Step-by-Step

1. Scroll down from Building Calculator — **Footing & Pedestal** is the next section on the same page, with its own **Geometry** and **Materials & Costs** pill tabs
2. Under **Foundation Footprints** (Geometry tab), enter:
   - **Footing Length**, **Footing Width**, **Footing Depth** — footing dimensions in meters
   - **Pedestal Length**, **Pedestal Width**, **Pedestal Height** — pedestal dimensions in meters
3. Switch to the **Materials & Costs** tab and select the **Concrete Class** from the dropdown (e.g. C30/37)
4. Results compute automatically: Concrete Volume, Rebar Weight, Excavation Volume, Formwork Area, Total Cost in ₱

> Concrete prices are fetched from the price database and apply the current year escalation rate automatically.

---

## 5. Master Estimator Worksheet

**Purpose:** Build an itemized cost for every scope line item in the project — materials, labor, and lump-sum items all in one worksheet — and produce a formatted Bill of Quantities.

### The header bar

At the top of the page, above the worksheet, fill in:
- **Project Title**, **Plant**, **Estimate Type** (e.g. Feasibility, Budgetary, Definitive), **Prepared By**, **Date**, **Mean Spending Date**

These carry through to your Excel export and to your saved History record — fill them in early, since **Save Estimate needs Project Title and Prepared By** to be enabled (see [Section 7](#7-saving-an-estimate)).

### The three tabs

Next to the "Scope Items Grid" label are two more tabs — **Contingency Scorecard** and **Undefined Costs Scorecard**. Clicking either one swaps the content area in place (no page navigation, nothing you've entered elsewhere is lost) — see [Section 6](#6-contingency--undefined-cost-scorecards) for those.

### Building the worksheet

1. Categories (Yard & Underground, RM Warehouse, Indirect Costs, etc.) are collapsible — click a dark category bar to expand or collapse it. Only the first category is expanded by default; this keeps the page fast even with hundreds of scope items in the worksheet.
2. Find the scope item (WBS row) you want to price.
3. Click **Selection** on that row — this opens a search/filter popover:
   - Type to search by name
   - Use the **All / Labor / [material category]** buttons to narrow the list to one category at a time (only one can be selected at once — search ignores this filter and always looks everywhere)
   - Click the material or labor role you want
4. Fill in the **Qty** cell:
   - For a **material** line, enter a plain quantity — Unit and Unit Cost fill in automatically
   - For a **labor** line, the Qty cell splits into **Headcount** and **Days** — enter both (e.g. 3 workers for 5 days), and Unit Cost fills in as the real daily rate
5. Optionally enter a **Lump Sum** amount on any line — this adds directly to that line's Total Cost, whether or not Selection/Qty are filled. You can use Lump Sum on its own (no material or labor picked) for a flat-quote item like bonds or mobilization.
6. Click **+** to add another line to the same scope item, or **✕** to remove one. A scope item can have as many material, labor, and lump-sum lines as it needs — they're independent, not paired.
7. The **Bill Of Quantities** panel on the right shows a live cost breakdown as you work. It has three views:
   - **A single scope item** — click that item's WBS code or Scope Description cell. You'll see its lines grouped as **Mat** (materials), **Lab** (labor), and **Lump Sum**, in that order, with only the groups that actually have something in them.
   - **A whole category** — click the dark category header bar, or the light-blue row just under it. Either one shows every priced item in that category, grouped the same way, with a category subtotal at the bottom. (For the categories split into Building Shell / Interior Finishing / Building Mechanical / Building Electrical, clicking any one of those light-blue rows still shows the *whole category's* total, not just that one section.)
   - **Everything you've priced so far** — this is what you see by default, and what you return to by clicking the ✕ in the panel or clicking anywhere outside the grid/panel area. Every category you've started pricing shows up as its own card, in the same Mat/Lab/Lump Sum layout, with a Grand Total at the bottom.

   > Material and labor names are sometimes too long to fully show on screen — hover over any line (in the panel, or the Selection cell in the grid itself) to see the full name in a small tooltip.
8. Each section has a **TOTAL** row at the bottom summing every item in it.

### Searching the worksheet

The search bar above the grid (next to the trash icon) searches both category names and scope item descriptions — type a few letters and the matching category/section auto-expands while non-matches hide, so you don't have to hunt through collapsed sections.

### Clearing the worksheet

The trash icon button (grey, top right of the grid) clears every line in the worksheet after a confirmation prompt. This cannot be undone.

### Exporting

**Export to Excel**, top-right of the page, downloads a formatted `.xlsx` Bill of Quantities using your header bar's Project Title/Plant/Prepared By/Date.

---

## 6. Contingency & Undefined Cost Scorecards

**Purpose:** Score qualitative project risk and definition-completeness to arrive at the Contingency % and Undefined Cost % used in your estimate's grand total — replacing guesswork with a structured, description-based pick.

### How scoring works (same for both scorecards)

Each scorecard is broken into a few **criteria** (Contingency: Site, Resources, Schedule, Pricing. Undefined Cost: Project Complexity, Technology, Completeness of Definition). For each criterion, you're shown **four real descriptions**, each with its own percentage value. **Click the one description that best matches your project.** It highlights, and its value counts toward that scorecard's subtotal.

The subtotal at the bottom of each scorecard is the **sum** of your picks — not an average. Pick one description per criterion; you don't need to (and shouldn't try to) blend or average across the four options for a single row.

### Step-by-Step

1. In Master Estimator, click the **Contingency Scorecard** tab (or **Undefined Costs Scorecard**)
2. For each criterion listed, read the four descriptions and click the one that matches your project's actual situation
3. The subtotal updates live as you go — you don't need every criterion answered to see a running number, but an unscored criterion contributes 0 until you pick something
4. Switch to the other scorecard tab and repeat

Your picks are saved automatically as you go — leaving the tab or the page and coming back restores everything exactly as you left it.

> Both scorecards' subtotals feed into your Estimated Grand Total (visible in the Save Estimate confirmation, see [Section 7](#7-saving-an-estimate)) and are captured in full detail — including exactly which description you picked — in your saved History record.

---

## 7. Saving an Estimate

A **Save Estimate** button lives in the header of **both** Quantities Takeoff (Building Calculator) and Master Estimator — click whichever page you're already on, they do the same thing. It's greyed out on both until **all** of these are true:

| Condition | Where to Satisfy It |
|---|---|
| Length, Width, and Clear Height filled | Quantities Takeoff → Building tab |
| Worksheet has cost | At least one line (material, labor, or lump sum) added anywhere in Master Estimator |
| Project Title filled | Master Estimator's header bar |
| Prepared By filled | Master Estimator's header bar |

Project Title and Prepared By are **only ever entered on Master Estimator's header** — even when you save from Quantities Takeoff, that's where they're read from. If they're blank, fill them in on Master Estimator first, then come back.

Once every condition above is met, the button turns black on both pages.

### Saving

1. Click **Save Estimate** (either page)
2. A confirmation window appears, showing your Project Title, Prepared By, Defined Cost, Contingency %, Undefined Cost %, **Escalation %**, and the computed Estimated Grand Total — this is a preview, not a form to fill in; if anything shows blank or zero, go back and check the condition it depends on above
3. Click **Save to History**
4. A confirmation toast appears and the record is saved

The record is identical no matter which page's button you clicked — both read from the same underlying data.

> Save Estimate works the same whether or not you have an internet connection — this data is stored entirely in your browser.
>
> If you have both pages open in separate browser tabs at once, filling something in on one tab won't immediately update the Save button's greyed-out state on the *other* open tab — switch to that tab and interact with it (or just reload it) to refresh its button.

---

## 8. Estimate History

1. Click **History** in the sidebar

Each saved estimate appears as a row with a dark header bar showing the project name, engineer name, and timestamp.

### Collapsed View (default)

Four summary cards are shown side by side:
- **Building Calculator** — dimensions, floor area, structure type, concrete volume (if you filled that page in)
- **Cost Estimate Scope** — lines priced, active categories, material cost, Lump Sum, Defined Cost
- **Labor** — roles used, total person-days, labor cost
- **Scorecards** — Undefined Cost %, Escalation %, Contingency %, and Combined % (the sum of all three — this is the actual percentage load applied on top of Defined Cost to reach the Grand Total)

### Expanded View

Click **Expand** on any row to see the full detail, including:
- Building Dimensions grid — Footing is labeled Length × Width × **Depth**, Pedestal is Length × Width × **Height** (the two use a different third dimension, so it's spelled out explicitly to avoid mixing them up)
- Cost Estimate Scope — category totals, the material/labor/lump-sum split, Defined Cost, and the three final percentages (Undefined Cost, Escalation, Contingency) that feed the Grand Total
- **Labor by Role** — each role you used, its rate, total person-days (headcount × days summed across every scope item that used it — not a single crew size, since the same role can show up differently on different lines), and subtotal
- **Estimated Grand Total**

> **Note:** the expanded view shows each scorecard's *final percentage* only — not which description you picked for each criterion (Site, Resources, Schedule, etc.). If you need to double-check exactly which description was selected, that's still visible live in Master Estimator's own Contingency/Undefined Cost Scorecard tabs while you're building the estimate; History now just shows you the resulting numbers.

Click **Collapse** to close the detail view.

### Deleting a Record

Click the **trash icon** on the right side of the row header. A confirmation dialog will appear — confirm to permanently delete that record.

### Clear All

Click **Clear All** in the top-right of the History page to delete all saved records. This cannot be undone.

> If no estimates have been saved yet, the page shows demo data with an amber banner — a preview that disappears once you save your first real estimate.

---

## 9. Logging Out

**Logout is only available from the landing hub** — it is not in the sidebar on any calculator page, and not on the Admin Panel.

To log out:
1. Click **Main Page** in the sidebar (or navigate to the app's main URL)
2. On the hub view, click **Logout**

This clears your session. You'll need to enter your credentials again next time you want to log in — and since login requires a network connection, it's best to only log out when you have signal, or when you're finished working for the day.

> **Tip:** If you're moving between Master Estimator, Quantities Takeoff, Admin, and History throughout the day, there's no need to log out and back in between them — Main Page just brings you to the hub without ending your session.

---

## 10. Using CCC Without a Connection

CCC can continue working in areas with poor or no signal (e.g. on-site at a plant), with some limits.

### What works offline

- Building Calculator and Master Estimator (including both scorecards) — as long as you've opened that page at least once already while you had a connection
- All price data, including automatic year-based price escalation
- Save Estimate → History (this has always been fully local to your browser, online or not)
- Staying logged in, once you're already logged in
- The Financial Ledger's currency conversion — shows the last exchange rate it successfully fetched, with a note underneath telling you the date that rate is from, so it's clear it may not be today's rate

### What requires a connection

- **Logging in for the first time in a browser session** — even with the correct email and password, login cannot complete without a network connection. There is no offline login.
- **Admin Panel price edits and Annual Escalation saves** — these write changes back to the central price database and require a connection to complete.
- **A brand-new exchange rate** — if you've never opened the app with a connection before, the currency conversion has nothing cached yet and will show "Rates unavailable" until it can fetch one.

### Recommended workflow for field use

1. **Log in while you still have signal** — before heading to a site with poor connectivity
2. Once logged in, you can move freely between the calculator pages even if signal drops, as long as you've visited each page at least once beforehand
3. Your estimate work and Save Estimate → History continue to function normally offline
4. Save any Admin Panel price changes before you lose connection — they cannot be completed offline

---

## 11. Tips & Notes

**Your data persists.** All inputs — the worksheet, header fields, both scorecards — are saved automatically as you type. If you navigate away and come back, or close and reopen the browser, your work is still there.

**A scope item can hold any mix of lines.** Three materials and one labor line, or five labor lines and no materials, or a single lump-sum line with nothing else — there's no requirement to pair a material with a labor role on the same line, or to have both.

**Pick one description per scorecard criterion — don't try to blend them.** The percentage is the sum of your picks across criteria, not an average across the four options in a single row.

**Search ignores the category filter in the Selection popover.** If you've narrowed the popover to "Labor" only and then search for a material by name, it'll still show up — search always looks everywhere. Clear the search box to go back to your filter.

**History is per-browser.** Saved estimates are stored in your browser on your device. A colleague on a different laptop will not see your history. If you need to share an estimate, use **Export to Excel** from Master Estimator.

**Prices update automatically.** All material prices displayed in the app reflect the current year's escalation rate set by the admin.

**Session ends on browser close.** For security, your login session clears when you close the browser.

**Main Page ≠ Logout.** Clicking Main Page from any calculator page just brings you to the hub — it does not sign you out.

---

*URC Civil Cost Calculator — Engineering Services Department*
*ESD Global Engineering Internship Batch, JG Summit Holdings / Universal Robina Corporation*
