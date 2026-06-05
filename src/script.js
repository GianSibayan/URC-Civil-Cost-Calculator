// src/script.js
// Core brain — fetches prices.json, runs all calculations
// Hooks into calculator.html DOM elements

// ============================================================
// PRICES — loaded from GitHub prices.json on page load
// ============================================================
let PRICES = null;

async function loadPrices() {
  try {
    const res = await fetch(
      'https://raw.githubusercontent.com/GianSibayan/URC-Civil-Cost-Calculator/main/prices.json'
    );
    PRICES = await res.json();
    console.log('Prices loaded:', PRICES);
    initCalculators();
  } catch (e) {
    console.error('Failed to load prices.json:', e);
    showToast('Failed to load price data. Please refresh.', 'error');
  }
}

// ============================================================
// UTILITIES
// ============================================================

function formatPeso(value) {
  if (isNaN(value) || value === null) return '₱0.00';
  return '₱' + parseFloat(value).toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatNumber(value, decimals = 2) {
  if (isNaN(value) || value === null) return '0';
  return parseFloat(value).toLocaleString('en-PH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function getVal(id) {
  const el = document.getElementById(id);
  return el ? parseFloat(el.value) || 0 : 0;
}

function getStr(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}

function setOutput(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => toast.classList.add('show'), 10);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============================================================
// TAB 1 — BUILDING CALCULATOR
// ============================================================

function calcBuilding() {
  // --- DIMENSION INPUTS ---
  const length     = getVal('input-length');
  const width      = getVal('input-width');
  const height     = getVal('input-clearHeight');
  const stories    = getVal('input-stories');
  const mezzanine  = getVal('input-mezzanine') / 100; // convert % to decimal

  // --- STRUCTURE INPUTS ---
  const dockDoors    = getVal('input-dockDoors');
  const driveInDoors = getVal('input-driveInDoors');
  const baySpacingL  = getVal('input-baySpacingL');
  const baySpacingW  = getVal('input-baySpacingW');

  // --- CAPACITY INPUTS ---
  const rackHeight      = getVal('input-rackHeight');
  const palletSize      = getVal('input-palletSize');
  const isleWidth       = getVal('input-isleWidth');
  const bottomClearance = getVal('input-bottomClearance');
  const storageEff      = getVal('input-storageEfficiency') / 100;
  const stagingArea     = getVal('input-dockStagingArea') / 100;
  const rackLevelHeight = getVal('input-rackLevelHeight');
  const palletDepth     = getVal('input-palletDepth');

  // --- DIMENSION CALCULATIONS ---
  const floorArea     = length * width;
  const grossArea     = floorArea + (floorArea * mezzanine);
  const buildingVol   = (length * width * height) + (length * width * mezzanine * 6);
  const perimeter     = 2 * (length + width);
  const totalBaySpacing = baySpacingL > 0 && baySpacingW > 0
    ? (length / baySpacingL) + (width / baySpacingW)
    : 0;

  // --- CAPACITY CALCULATIONS ---
  // Storage area = floor area × (1 - staging%) × efficiency%
  const storageArea = floorArea * (1 - stagingArea) * storageEff;

  // Pallets per m² = 1 ÷ (pallet depth × (pallet depth + aisle width))
  const rowWidth = palletDepth + isleWidth;
  const palletsPerM2 = rowWidth > 0 ? 1 / (palletDepth * rowWidth) : 0;

  // Rack levels = (rack height - clearance) ÷ level height
  const rackLevels = rackLevelHeight > 0
    ? (rackHeight - bottomClearance) / rackLevelHeight
    : 0;

  // Total pallet positions = storage area × pallets per m² × rack levels
  const totalPalletPositions = storageArea * palletsPerM2 * rackLevels;

  // --- UPDATE DOM OUTPUTS ---
  setOutput('output-floor-area',            formatNumber(floorArea, 0) + ' m²');
  setOutput('output-gross-area',            formatNumber(grossArea, 0) + ' m²');
  setOutput('output-building-volume',       formatNumber(buildingVol, 0) + ' m³');
  setOutput('output-perimeter',             formatNumber(perimeter, 0) + ' m');
  setOutput('output-total-bay-spacing',     formatNumber(totalBaySpacing, 2));
  setOutput('output-storage-area',          formatNumber(storageArea, 2) + ' m²');
  setOutput('output-pallets-per-m2',        formatNumber(palletsPerM2, 4));
  setOutput('output-rack-levels',           formatNumber(rackLevels, 2));
  setOutput('output-total-pallet-positions',formatNumber(totalPalletPositions, 2));
}

// ============================================================
// TAB 2 — FOOTING & PEDESTAL CALCULATOR
// ============================================================

function calcFooting() {
  if (!PRICES) return;

  // --- GEOMETRY INPUTS ---
  const footingL = getVal('input-footing-length');
  const footingW = getVal('input-footing-width');
  const footingD = getVal('input-footing-depth');
  const pedestalL = getVal('input-pedestal-length');
  const pedestalW = getVal('input-pedestal-width');
  const pedestalH = getVal('input-pedestal-height');

  // --- MATERIALS INPUTS ---
  const concreteClass   = getStr('input-concrete-class');
  const rebarRatio      = getVal('input-rebar-ratio') / 100;
  const rebarPrice      = getVal('input-rebar-price');
  const excavationDepth = getVal('input-excavation-depth');
  const excavationCost  = getVal('input-excavation-cost');
  const overheadProfit  = getVal('input-overhead-profit') / 100;
  const formsPrice      = getVal('input-forms-price');
  const laborCostDay    = getVal('input-labor-cost-day');

  // --- GET CONCRETE PRICE FROM PRICES.JSON ---
  const steelDensity = PRICES.tab1_tab2.steel_density_kg_per_m3;
  const concreteClasses = PRICES.tab1_tab2.concrete_classes;
  const concretePrice = concreteClasses[concreteClass]
    ? concreteClasses[concreteClass].price_per_m3
    : 0;

  // Auto-fill concrete price display
  const concretePriceEl = document.getElementById('output-concrete-price');
  if (concretePriceEl) concretePriceEl.textContent = formatPeso(concretePrice);

  // --- VOLUME CALCULATIONS ---
  const footingVolume  = footingL * footingW * footingD;
  const pedestalVolume = pedestalL * pedestalW * pedestalH;
  const totalConcreteVol = footingVolume + pedestalVolume;

  // --- REBAR WEIGHT ---
  // Rebar weight (kg) = total concrete vol × rebar ratio × steel density
  const rebarWeight = totalConcreteVol * rebarRatio * steelDensity;

  // --- EXCAVATION VOLUME ---
  const excavationVol = footingL * footingW * excavationDepth;

  // --- LABOR RATE ---
  // Labor rate per m³ = (labor cost/day × 4 workers × 2 days) ÷ concrete vol
  const laborRate = totalConcreteVol > 0
    ? (laborCostDay * 4 * 2) / totalConcreteVol
    : 0;
  const totalLabor = laborRate * totalConcreteVol;

  // --- FORMS AREA ---
  // Perimeter of footing sides + pedestal sides
  const footingFormsArea  = 2 * (footingL + footingW) * footingD;
  const pedestalFormsArea = 2 * (pedestalL + pedestalW) * pedestalH;
  const totalFormsArea    = footingFormsArea + pedestalFormsArea;

  // --- TOTAL COST ---
  const concreteCost   = totalConcreteVol * concretePrice;
  const rebarCost      = rebarWeight * rebarPrice;
  const excavationCostTotal = excavationVol * excavationCost;
  const formsCost      = totalFormsArea * formsPrice;

  const subtotal = concreteCost + rebarCost + excavationCostTotal + formsCost + totalLabor;
  const totalCost = subtotal * (1 + overheadProfit);

  // --- UPDATE DOM OUTPUTS ---
  setOutput('output-footing-volume',    formatNumber(footingVolume, 3) + ' m³');
  setOutput('output-pedestal-volume',   formatNumber(pedestalVolume, 3) + ' m³');
  setOutput('output-concrete-volume',   formatNumber(totalConcreteVol, 3) + ' m³');
  setOutput('output-rebar-weight',      formatNumber(rebarWeight, 2) + ' kg');
  setOutput('output-excavation-volume', formatNumber(excavationVol, 3) + ' m³');
  setOutput('output-forms-area',        formatNumber(totalFormsArea, 2) + ' m²');
  setOutput('output-labor-rate',        formatPeso(laborRate) + '/m³');
  setOutput('output-total-cost',        formatPeso(totalCost));
}

// ============================================================
// TAB 3 — COST ESTIMATE SCOPE
// ============================================================
// Tab 3 logic:
// For each line item — engineer inputs a quantity
// App multiplies quantity × unit rate from prices.json
// Grand total sums all line items
// Escalation factor and place factor applied at the end
//
// NOTE: Tab 3 unit rates in prices.json are currently 0
// pending PhilConstruct data from Sir Tony.
// Until then, Tab 3 works as manual entry (quantity = cost directly)

function calcCostEstimate() {
  if (!PRICES) return;

  const tab3 = PRICES.tab3;
  let grandTotal = 0;

  // Get all cost input fields in Tab 3
  // Each input has id="tab3-input-{key}"
  // Each output has id="tab3-output-{key}"
  const inputs = document.querySelectorAll('[data-tab3-key]');

  inputs.forEach((input) => {
    const key = input.dataset.tab3Key;
    const quantity = parseFloat(input.value) || 0;

    // Find matching rate in prices.json tab3
    // Rate key matches input data-tab3-key attribute
    const rate = findTab3Rate(tab3, key);

    const lineItemCost = quantity * rate;
    grandTotal += lineItemCost;

    // Update line item cost display
    const outputEl = document.getElementById(`tab3-cost-${key}`);
    if (outputEl) outputEl.textContent = formatPeso(lineItemCost);
  });

  // Apply escalation and place factors
  const escalation = PRICES.tab1_tab2.escalation_factor || 1;
  const placeFactor = PRICES.tab1_tab2.place_factor || 1;
  const adjustedTotal = grandTotal * escalation * placeFactor;

  setOutput('tab3-output-subtotal',       formatPeso(grandTotal));
  setOutput('tab3-output-escalation',     escalation.toFixed(4));
  setOutput('tab3-output-place-factor',   placeFactor.toFixed(2));
  setOutput('tab3-output-grand-total',    formatPeso(adjustedTotal));
}

function findTab3Rate(tab3, key) {
  // Search all categories in tab3 for the matching key
  for (const category of Object.values(tab3)) {
    if (typeof category === 'object' && category[key] !== undefined) {
      return category[key];
    }
  }
  return 1; // Default rate of 1 means quantity = cost (manual entry mode)
}

// ============================================================
// INIT — wire all inputs to their calculators
// ============================================================

function initCalculators() {
  // Tab 1 — wire all inputs to calcBuilding
  const tab1Inputs = document.querySelectorAll('[data-tab="1"]');
  tab1Inputs.forEach((input) => {
    input.addEventListener('input', calcBuilding);
  });

  // Tab 2 — wire all inputs to calcFooting
  const tab2Inputs = document.querySelectorAll('[data-tab="2"]');
  tab2Inputs.forEach((input) => {
    input.addEventListener('input', calcFooting);
  });

  // Tab 2 — concrete class dropdown auto-fills price
  const concreteClassEl = document.getElementById('input-concrete-class');
  if (concreteClassEl) {
    concreteClassEl.addEventListener('change', () => {
      calcFooting();
    });
    // Pre-fill default concrete price on load
    calcFooting();
  }

  // Tab 3 — wire all quantity inputs to calcCostEstimate
  const tab3Inputs = document.querySelectorAll('[data-tab3-key]');
  tab3Inputs.forEach((input) => {
    input.addEventListener('input', calcCostEstimate);
  });

  // Run initial calculations with default values
  calcBuilding();
  calcFooting();
  calcCostEstimate();
}

// ============================================================
// ON PAGE LOAD
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  // Check login
  Auth.requireLogin();

  // Load prices then init calculators
  loadPrices();
});