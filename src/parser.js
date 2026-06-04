// src/parser.js
// SheetJS Excel/CSV parsing logic for admin price uploads
// Reads uploaded .xlsx or .csv file and maps values to prices.json structure
//
// Depends on SheetJS loaded via CDN in admin.html:
// <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>

const Parser = {

  // ============================================================
  // MAIN ENTRY POINT
  // Call this when admin uploads a file in admin.html
  // Returns a parsed prices object ready to save, or null on error
  // ============================================================
  async parseFile(file) {
    if (!file) return null;

    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      return await this.parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return await this.parseExcel(file);
    } else {
      showToast('Unsupported file type. Please upload .xlsx or .csv only.', 'error');
      return null;
    }
  },

  // ============================================================
  // PARSE CSV
  // Expected format: two columns — Key, Value
  // Example:
  //   rebar_price_per_kg, 72
  //   labor_cost_per_day, 650
  //   concrete_C30/37,    4500
  // ============================================================
  async parseCSV(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim() !== '');
          const extracted = {};

          lines.forEach((line, index) => {
            // Skip header row if present
            if (index === 0 && isNaN(line.split(',')[1])) return;

            const parts = line.split(',');
            if (parts.length < 2) return;

            const key = parts[0].trim();
            const value = parseFloat(parts[1].trim());

            if (key && !isNaN(value)) {
              extracted[key] = value;
            }
          });

          const prices = this.mapToPricesJson(extracted);
          resolve(prices);

        } catch (e) {
          console.error('CSV parse error:', e);
          showToast('Failed to parse CSV file. Check format and try again.', 'error');
          resolve(null);
        }
      };

      reader.onerror = () => {
        showToast('Failed to read file.', 'error');
        resolve(null);
      };

      reader.readAsText(file);
    });
  },

  // ============================================================
  // PARSE EXCEL (.xlsx)
  // Expected format: Sheet named "Prices" with two columns:
  //   Column A: Key (string)
  //   Column B: Value (number)
  // Falls back to first sheet if "Prices" sheet not found
  // ============================================================
  async parseExcel(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });

          // Try to find "Prices" sheet first, fallback to first sheet
          let sheetName = workbook.SheetNames.find(
            name => name.toLowerCase() === 'prices'
          );
          if (!sheetName) sheetName = workbook.SheetNames[0];

          const sheet = workbook.Sheets[sheetName];
          const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

          const extracted = {};

          rows.forEach((row, index) => {
            // Skip header row
            if (index === 0 && isNaN(row[1])) return;
            if (!row[0] || row[1] === undefined) return;

            const key = String(row[0]).trim();
            const value = parseFloat(row[1]);

            if (key && !isNaN(value)) {
              extracted[key] = value;
            }
          });

          const prices = this.mapToPricesJson(extracted);
          resolve(prices);

        } catch (e) {
          console.error('Excel parse error:', e);
          showToast('Failed to parse Excel file. Check format and try again.', 'error');
          resolve(null);
        }
      };

      reader.onerror = () => {
        showToast('Failed to read file.', 'error');
        resolve(null);
      };

      reader.readAsArrayBuffer(file);
    });
  },

  // ============================================================
  // MAP EXTRACTED KEY-VALUE PAIRS TO prices.json STRUCTURE
  // Keys must match exactly — case sensitive
  // Unrecognized keys are ignored
  // ============================================================
  mapToPricesJson(extracted) {
    // Start with current prices loaded in memory
    // (PRICES is loaded by script.js on page load)
    if (!window.PRICES) {
      showToast('Price data not loaded. Please refresh and try again.', 'error');
      return null;
    }

    // Deep clone current prices so we don't mutate the original
    const updated = JSON.parse(JSON.stringify(window.PRICES));

    // Update meta
    updated.meta.last_updated = new Date().toISOString().split('T')[0];
    updated.meta.updated_by = Auth.getEmail() || 'admin';

    // --- TAB 1 & 2 RATES ---
    const t = updated.tab1_tab2;

    if (extracted['rebar_price_per_kg'] !== undefined)
      t.rebar_price_per_kg = extracted['rebar_price_per_kg'];

    if (extracted['steel_density_kg_per_m3'] !== undefined)
      t.steel_density_kg_per_m3 = extracted['steel_density_kg_per_m3'];

    if (extracted['excavation_cost_per_m3'] !== undefined)
      t.excavation_cost_per_m3 = extracted['excavation_cost_per_m3'];

    if (extracted['forms_price_per_m2'] !== undefined)
      t.forms_price_per_m2 = extracted['forms_price_per_m2'];

    if (extracted['labor_cost_per_day'] !== undefined)
      t.labor_cost_per_day = extracted['labor_cost_per_day'];

    if (extracted['overhead_profit_rate'] !== undefined)
      t.overhead_profit_rate = extracted['overhead_profit_rate'];

    if (extracted['escalation_factor'] !== undefined)
      t.escalation_factor = extracted['escalation_factor'];

    if (extracted['place_factor'] !== undefined)
      t.place_factor = extracted['place_factor'];

    // Concrete class prices
    // Keys: concrete_C16/20, concrete_C20/25, etc.
    Object.keys(t.concrete_classes).forEach((cls) => {
      const key = `concrete_${cls}`;
      if (extracted[key] !== undefined) {
        t.concrete_classes[cls].price_per_m3 = extracted[key];
      }
    });

    // Rebar weights per meter
    // Keys: rebar_10mm, rebar_12mm, etc.
    Object.keys(t.rebar_weights_per_meter).forEach((size) => {
      const key = `rebar_${size}`;
      if (extracted[key] !== undefined) {
        t.rebar_weights_per_meter[size] = extracted[key];
      }
    });

    // --- TAB 3 RATES ---
    // Flatten all tab3 categories and match keys directly
    const tab3 = updated.tab3;
    Object.keys(tab3).forEach((category) => {
      if (typeof tab3[category] !== 'object') return;
      Object.keys(tab3[category]).forEach((key) => {
        if (extracted[key] !== undefined) {
          tab3[category][key] = extracted[key];
        }
      });
    });

    return updated;
  },

  // ============================================================
  // GENERATE DOWNLOAD TEMPLATE
  // Creates and downloads a blank Excel template for admins to fill
  // ============================================================
  downloadTemplate() {
    if (!window.PRICES) {
      showToast('Price data not loaded. Please refresh.', 'error');
      return;
    }

    const rows = [['Key', 'Value', 'Description']];

    // Tab 1 & 2 rates
    const t = window.PRICES.tab1_tab2;
    rows.push(['--- TAB 1 & 2 RATES ---', '', '']);
    rows.push(['rebar_price_per_kg', t.rebar_price_per_kg, 'Rebar price per kilogram']);
    rows.push(['excavation_cost_per_m3', t.excavation_cost_per_m3, 'Excavation cost per cubic meter']);
    rows.push(['forms_price_per_m2', t.forms_price_per_m2, 'Formwork price per square meter']);
    rows.push(['labor_cost_per_day', t.labor_cost_per_day, 'Labor cost per worker per day']);
    rows.push(['overhead_profit_rate', t.overhead_profit_rate, 'Overhead and profit rate (decimal, e.g. 0.15 = 15%)']);
    rows.push(['escalation_factor', t.escalation_factor, 'Cost escalation factor']);
    rows.push(['place_factor', t.place_factor, 'Location adjustment factor']);

    rows.push(['--- CONCRETE CLASS PRICES ---', '', '']);
    Object.entries(t.concrete_classes).forEach(([cls, data]) => {
      rows.push([`concrete_${cls}`, data.price_per_m3, `Concrete ${cls} — ${data.use}`]);
    });

    rows.push(['--- TAB 3 UNIT RATES (PhilConstruct) ---', '', '']);
    const tab3 = window.PRICES.tab3;
    Object.entries(tab3).forEach(([category, items]) => {
      if (typeof items !== 'object' || category === 'notes') return;
      rows.push([`--- ${category.toUpperCase()} ---`, '', '']);
      Object.entries(items).forEach(([key, value]) => {
        rows.push([key, value, '']);
      });
    });

    // Build workbook
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Prices');

    // Set column widths
    ws['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 50 }];

    XLSX.writeFile(wb, 'URC_CCC_Prices_Template.xlsx');
    showToast('Template downloaded.', 'success');
  },

  // ============================================================
  // DOWNLOAD CURRENT PRICES AS EXCEL
  // ============================================================
  downloadCurrentPrices() {
    if (!window.PRICES) {
      showToast('Price data not loaded. Please refresh.', 'error');
      return;
    }

    // Reuse template structure but fill with current values
    this.downloadTemplate();
    showToast('Current prices downloaded as Excel.', 'success');
  },
};