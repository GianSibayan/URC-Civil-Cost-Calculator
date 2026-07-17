// src/parser.js
// SheetJS Excel/CSV parsing logic for admin price uploads
// Also handles loading and saving all 14 category JSON files
// Includes Offline Outbox Sync Engine for saving edits without internet

// ============================================================
// OFFLINE SYNC ENGINE
// ============================================================
const OfflineSync = {
  queueRequest(endpoint, payload) {
    let outbox = JSON.parse(localStorage.getItem('ccc_offline_outbox') || '[]');
    // Add the new request to the queue
    outbox.push({ endpoint, payload, timestamp: Date.now() });
    localStorage.setItem('ccc_offline_outbox', JSON.stringify(outbox));
  },

  async flushOutbox() {
    let outbox = JSON.parse(localStorage.getItem('ccc_offline_outbox') || '[]');
    if (outbox.length === 0) return;

    // Optional: Only show toast if window.showToast exists
    if (typeof showToast === 'function') {
      showToast(`Connection restored. Syncing ${outbox.length} offline edits...`, 'info');
    }

    let pending = [];
    const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;

    for (let item of outbox) {
      try {
        const res = await fetch(item.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(item.payload),
        });

        if (!res.ok) {
          // Server rejected it (e.g. 500 error), keep in queue
          pending.push(item);
        }
      } catch (e) {
        // Network failed again while syncing, keep in queue
        pending.push(item);
      }
    }

    localStorage.setItem('ccc_offline_outbox', JSON.stringify(pending));

    if (typeof showToast === 'function') {
      if (pending.length === 0) {
        showToast('All offline data synced successfully!', 'success');
      } else {
        showToast(`Sync partial. ${pending.length} items remain in outbox.`, 'error');
      }
    }
  }
};

// Automatically flush outbox when the browser detects connection restored
window.addEventListener('online', OfflineSync.flushOutbox);


// ============================================================
// CATEGORY JSON CONFIG
// ============================================================
const CATEGORY_FILES = {
  labor_rates: {
    file: 'data/labor_rates.json',
    label: 'Labor & Resources',
    schema: 'labor_rates',
    editableFields: ['rate'],
  },
  concreting_materials: {
    file: 'data/concreting_materials.json',
    label: 'Concreting Materials',
    schema: 'simple',         
    editableFields: ['price_php'],
  },
  timber_formworks: {
    file: 'data/timber_formworks.json',
    label: 'Timber Formworks',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  roofing: {
    file: 'data/roofing.json',
    label: 'Roofing',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  steel_truss: {
    file: 'data/steel_truss.json',
    label: 'Steel Truss',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  painting_works: {
    file: 'data/painting_works.json',
    label: 'Painting Works',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  electrical: {
    file: 'data/electrical.json',
    label: 'Electrical',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  masonry: {
    file: 'data/masonry.json',
    label: 'Masonry',
    schema: 'masonry',        
    editableFields: ['price_php'],
  },
  fencing: {
    file: 'data/fencing.json',
    label: 'Fencing',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  ceiling: {
    file: 'data/ceiling.json',
    label: 'Ceiling',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  plumbing: {
    file: 'data/plumbing.json',
    label: 'Plumbing',
    schema: 'simple',
    editableFields: ['price_php'],
  },
  rebars: {
    file: 'data/rebars.json',
    label: 'Rebars',
    schema: 'rebars',         
    editableFields: ['price_php'],
  },
  concrete_mix: {
    file: 'data/concrete_mix.json',
    label: 'Concrete Mix',
    schema: 'concrete_mix',   
    editableFields: ['price_php'],
  },
  equipment: {
    file: 'data/equipment.json',
    label: 'Equipment',
    schema: 'equipment',      
    editableFields: ['rate_min_php', 'rate_max_php'],
  },
  pipes: {
    file: 'data/pipes.json',
    label: 'Pipes',
    schema: 'pipes',          
    editableFields: ['price_per_6m_php', 'price_per_length_php'],
  },
};

const Parser = {

  // ============================================================
  // LOAD A CATEGORY JSON FROM GITHUB RAW
  // ============================================================
  async loadCategory(categoryKey) {
    const config = CATEGORY_FILES[categoryKey];
    if (!config) {
      console.error(`Unknown category: ${categoryKey}`);
      return null;
    }

    const urls = [
      `/${config.file}`,
      `https://raw.githubusercontent.com/GianSibayan/URC-Civil-Cost-Calculator/main/${config.file}`,
    ];

    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (res.ok) return await res.json();
      } catch (_) { }
    }

    console.error(`Failed to load ${config.file} from all sources`);
    if (typeof showToast === 'function') showToast(`Failed to load ${config.label} prices.`, 'error');
    return null;
  },

  // ============================================================
  // SAVE A CATEGORY JSON VIA UPDATE-PRICES API
  // Includes Offline Queueing
  // ============================================================
  async saveCategory(categoryKey, data) {
    const config = CATEGORY_FILES[categoryKey];
    if (!config) {
      if (typeof showToast === 'function') showToast(`Unknown category: ${categoryKey}`, 'error');
      return false;
    }

    const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
    if (!token) {
      if (typeof showToast === 'function') showToast('Not logged in.', 'error');
      return false;
    }

    const payload = {
      filename: config.file,
      prices: data,
    };

    // If device is offline, intercept and queue
    if (!navigator.onLine) {
      OfflineSync.queueRequest('/api/update-prices', payload);
      if (typeof showToast === 'function') showToast(`Offline: ${config.label} queued for sync.`, 'info');
      return true; // Return true so the UI updates locally
    }

    try {
      const res = await fetch('/api/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (typeof showToast === 'function') showToast(result.error || 'Failed to save.', 'error');
        return false;
      }

      if (typeof showToast === 'function') showToast(`${config.label} updated successfully.`, 'success');
      return true;

    } catch (e) {
      // If network suddenly drops during fetch, catch it and queue
      OfflineSync.queueRequest('/api/update-prices', payload);
      if (typeof showToast === 'function') showToast(`Network error: ${config.label} queued for sync.`, 'info');
      return true;
    }
  },

  async updateSimpleItem(categoryKey, index, field, value) {
    const data = await this.loadCategory(categoryKey);
    if (!data) return false;

    const arr = Array.isArray(data) ? data : data.prices;
    if (!arr || arr[index] === undefined) {
      if (typeof showToast === 'function') showToast('Item not found.', 'error');
      return false;
    }

    arr[index][field] = parseFloat(value);
    const updated = Array.isArray(data) ? arr : { ...data, prices: arr };
    return await this.saveCategory(categoryKey, updated);
  },

  async updateEquipmentItem(index, rateMin, rateMax) {
    const data = await this.loadCategory('equipment');
    if (!data || !data[index]) return false;

    data[index].rate_min_php = parseFloat(rateMin);
    data[index].rate_max_php = parseFloat(rateMax);

    return await this.saveCategory('equipment', data);
  },

  async updatePipesItem(tableKey, index, field, value) {
    const data = await this.loadCategory('pipes');
    if (!data || !data[tableKey] || !data[tableKey][index]) return false;

    data[tableKey][index][field] = parseFloat(value);
    return await this.saveCategory('pipes', data);
  },

  async saveBulk(categoryKey, data) {
    return await this.saveCategory(categoryKey, data);
  },

  // ============================================================
  // ALSO SAVE prices.json (Tab 1 & Tab 2 rates)
  // Includes Offline Queueing
  // ============================================================
  async savePricesJson(prices) {
    const token = typeof Auth !== 'undefined' ? Auth.getToken() : null;
    if (!token) {
      if (typeof showToast === 'function') showToast('Not logged in.', 'error');
      return false;
    }

    const payload = {
      filename: 'prices.json',
      prices,
    };

    if (!navigator.onLine) {
      OfflineSync.queueRequest('/api/update-prices', payload);
      if (typeof showToast === 'function') showToast(`Offline: Core prices queued for sync.`, 'info');
      return true;
    }

    try {
      const res = await fetch('/api/update-prices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        if (typeof showToast === 'function') showToast(result.error || 'Failed to save prices.json.', 'error');
        return false;
      }

      if (typeof showToast === 'function') showToast('Prices updated successfully.', 'success');
      return true;

    } catch (e) {
      OfflineSync.queueRequest('/api/update-prices', payload);
      if (typeof showToast === 'function') showToast(`Network error: Core prices queued for sync.`, 'info');
      return true;
    }
  },

  // ============================================================
  // PARSE FILE UPLOAD
  // ============================================================
  async parseFile(file) {
    if (!file) return null;
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
      return await this.parseCSV(file);
    } else if (extension === 'xlsx' || extension === 'xls') {
      return await this.parseExcel(file);
    } else {
      if (typeof showToast === 'function') showToast('Unsupported file type. Please upload .xlsx or .csv only.', 'error');
      return null;
    }
  },

  async parseCSV(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          const lines = text.split('\n').filter(line => line.trim() !== '');
          const extracted = {};

          lines.forEach((line, index) => {
            if (index === 0 && isNaN(line.split(',')[1])) return;
            const parts = line.split(',');
            if (parts.length < 2) return;
            const key = parts[0].trim();
            const value = parseFloat(parts[1].trim());
            if (key && !isNaN(value)) extracted[key] = value;
          });

          const prices = this.mapToPricesJson(extracted);
          resolve(prices);
        } catch (e) {
          console.error('CSV parse error:', e);
          if (typeof showToast === 'function') showToast('Failed to parse CSV file.', 'error');
          resolve(null);
        }
      };
      reader.onerror = () => { if (typeof showToast === 'function') showToast('Failed to read file.', 'error'); resolve(null); };
      reader.readAsText(file);
    });
  },

  async parseExcel(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = window.XLSX.read(data, { type: 'array' });

          let sheetName = workbook.SheetNames.find(
            name => name.toLowerCase() === 'prices'
          );
          if (!sheetName) sheetName = workbook.SheetNames[0];

          const sheet = workbook.Sheets[sheetName];
          const rows = window.XLSX.utils.sheet_to_json(sheet, { header: 1 });
          const extracted = {};

          rows.forEach((row, index) => {
            if (index === 0 && isNaN(row[1])) return;
            if (!row[0] || row[1] === undefined) return;
            const key = String(row[0]).trim();
            const value = parseFloat(row[1]);
            if (key && !isNaN(value)) extracted[key] = value;
          });

          const prices = this.mapToPricesJson(extracted);
          resolve(prices);
        } catch (e) {
          console.error('Excel parse error:', e);
          if (typeof showToast === 'function') showToast('Failed to parse Excel file.', 'error');
          resolve(null);
        }
      };
      reader.onerror = () => { if (typeof showToast === 'function') showToast('Failed to read file.', 'error'); resolve(null); };
      reader.readAsArrayBuffer(file);
    });
  },

  mapToPricesJson(extracted) {
    if (!window.PRICES) {
      if (typeof showToast === 'function') showToast('Price data not loaded. Please refresh and try again.', 'error');
      return null;
    }

    const updated = JSON.parse(JSON.stringify(window.PRICES));
    updated.meta.last_updated = new Date().toISOString().split('T')[0];
    updated.meta.updated_by = typeof Auth !== 'undefined' ? Auth.getEmail() : 'admin';

    const t = updated.tab1_tab2;

    if (extracted['rebar_price_per_kg'] !== undefined) t.rebar_price_per_kg = extracted['rebar_price_per_kg'];
    if (extracted['steel_density_kg_per_m3'] !== undefined) t.steel_density_kg_per_m3 = extracted['steel_density_kg_per_m3'];
    if (extracted['excavation_cost_per_m3'] !== undefined) t.excavation_cost_per_m3 = extracted['excavation_cost_per_m3'];
    if (extracted['forms_price_per_m2'] !== undefined) t.forms_price_per_m2 = extracted['forms_price_per_m2'];
    if (extracted['labor_cost_per_day'] !== undefined) t.labor_cost_per_day = extracted['labor_cost_per_day'];
    if (extracted['overhead_profit_rate'] !== undefined) t.overhead_profit_rate = extracted['overhead_profit_rate'];
    if (extracted['escalation_factor'] !== undefined) t.escalation_factor = extracted['escalation_factor'];
    if (extracted['place_factor'] !== undefined) t.place_factor = extracted['place_factor'];

    Object.keys(t.concrete_classes).forEach((cls) => {
      const key = `concrete_${cls}`;
      if (extracted[key] !== undefined) t.concrete_classes[cls].price_per_m3 = extracted[key];
    });

    Object.keys(t.rebar_weights_per_meter).forEach((size) => {
      const key = `rebar_${size}`;
      if (extracted[key] !== undefined) t.rebar_weights_per_meter[size] = extracted[key];
    });

    const tab3 = updated.tab3;
    Object.keys(tab3).forEach((category) => {
      if (typeof tab3[category] !== 'object' || category === 'notes') return;
      Object.keys(tab3[category]).forEach((key) => {
        if (extracted[key] !== undefined) tab3[category][key] = extracted[key];
      });
    });

    return updated;
  },

  downloadTemplate() {
    if (!window.PRICES) {
      if (typeof showToast === 'function') showToast('Price data not loaded. Please refresh.', 'error');
      return;
    }

    const rows = [['Key', 'Value', 'Description']];
    const t = window.PRICES.tab1_tab2;

    rows.push(['--- TAB 1 & 2 RATES ---', '', '']);
    rows.push(['rebar_price_per_kg', t.rebar_price_per_kg, 'Rebar price per kilogram']);
    rows.push(['excavation_cost_per_m3', t.excavation_cost_per_m3, 'Excavation cost per cubic meter']);
    rows.push(['forms_price_per_m2', t.forms_price_per_m2, 'Formwork price per square meter']);
    rows.push(['labor_cost_per_day', t.labor_cost_per_day, 'Labor cost per worker per day']);
    rows.push(['overhead_profit_rate', t.overhead_profit_rate, 'Overhead and profit rate (decimal)']);
    rows.push(['escalation_factor', t.escalation_factor, 'Cost escalation factor']);
    rows.push(['place_factor', t.place_factor, 'Location adjustment factor']);

    rows.push(['--- CONCRETE CLASS PRICES ---', '', '']);
    Object.entries(t.concrete_classes).forEach(([cls, data]) => {
      rows.push([`concrete_${cls}`, data.price_per_m3, `Concrete ${cls} — ${data.use}`]);
    });

    rows.push(['--- TAB 3 UNIT RATES ---', '', '']);
    const tab3 = window.PRICES.tab3;
    Object.entries(tab3).forEach(([category, items]) => {
      if (typeof items !== 'object' || category === 'notes') return;
      rows.push([`--- ${category.toUpperCase()} ---`, '', '']);
      Object.entries(items).forEach(([key, value]) => {
        rows.push([key, value, '']);
      });
    });

    const ws = window.XLSX.utils.aoa_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Prices');
    ws['!cols'] = [{ wch: 45 }, { wch: 15 }, { wch: 50 }];
    window.XLSX.writeFile(wb, 'URC_CCC_Prices_Template.xlsx');
    if (typeof showToast === 'function') showToast('Template downloaded.', 'success');
  },

  downloadCategory(categoryKey, data) {
    if (!data) {
      if (typeof showToast === 'function') showToast('No data loaded to export.', 'error');
      return;
    }

    const config = CATEGORY_FILES[categoryKey];
    const label = config ? config.label : categoryKey;
    const wb = window.XLSX.utils.book_new();

    if (categoryKey === 'masonry') {
      const priceRows = [['Name', 'Unit', 'Price (PHP)']];
      data.prices.forEach(i => priceRows.push([i.name, i.unit, i.price_php]));
      const wsPrices = window.XLSX.utils.aoa_to_sheet(priceRows);
      wsPrices['!cols'] = [{ wch: 40 }, { wch: 12 }, { wch: 14 }];
      window.XLSX.utils.book_append_sheet(wb, wsPrices, 'Prices');

      const propRows = [['Mixture Class', 'Cement', 'Sand', 'Gravel', '40kg Bags', '50kg Bags', 'Sand cu.m', 'Gravel cu.m']];
      data.concrete_proportion_table.forEach(r => propRows.push([
        r.mixture_class, r.proportion.cement, r.proportion.sand, r.proportion.gravel,
        r.cement_in_bag['40kg'], r.cement_in_bag['50kg'], r.sand_cu_m, r.gravel_cu_m,
      ]));
      const wsProp = window.XLSX.utils.aoa_to_sheet(propRows);
      wsProp['!cols'] = [{ wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
      window.XLSX.utils.book_append_sheet(wb, wsProp, 'Proportion Table');

    } else if (categoryKey === 'rebars') {
      const rows = [['Spec', 'Size', 'Length', 'Price (PHP)']];
      data.forEach(i => rows.push([i.spec, i.size, i.length, i.price_php]));
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
      window.XLSX.utils.book_append_sheet(wb, ws, label);

    } else if (categoryKey === 'concrete_mix') {
      const rows = [['Product', 'Curing Time', 'Price (PHP)']];
      data.forEach(i => rows.push([i.product, i.curing_time, i.price_php]));
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 28 }, { wch: 14 }, { wch: 14 }];
      window.XLSX.utils.book_append_sheet(wb, ws, label);

    } else if (categoryKey === 'equipment') {
      const rows = [['Category', 'Item No.', 'Equipment', 'Unit', 'Min Rate (PHP)', 'Max Rate (PHP)']];
      data.forEach(i => rows.push([i.category, i.item_no, i.name, i.unit, i.rate_min_php, i.rate_max_php]));
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 48 }, { wch: 8 }, { wch: 16 }, { wch: 16 }];
      window.XLSX.utils.book_append_sheet(wb, ws, label);

    } else if (categoryKey === 'labor_rates') {
      const rows = [['ID', 'Role Name', 'Daily Rate (PHP)']];
      data.forEach(i => rows.push([i.id, i.name, i.rate]));
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 16 }];
      window.XLSX.utils.book_append_sheet(wb, ws, label);

    } else if (categoryKey === 'pipes') {
      const nomRows = [['English', 'Metric (mm)', 'Price per 6m (PHP)']];
      data.nominal_size_unit_price.forEach(i => nomRows.push([i.english, i.metric_mm, i.price_per_6m_php]));
      const wsNom = window.XLSX.utils.aoa_to_sheet(nomRows);
      wsNom['!cols'] = [{ wch: 10 }, { wch: 14 }, { wch: 20 }];
      window.XLSX.utils.book_append_sheet(wb, wsNom, 'Nominal Size');

      const seamRows = [['Item No.', 'Description', 'Price per Length (PHP)', 'Remarks']];
      data.seamless_galvanized_steel.forEach(i => seamRows.push([i.item_no, i.description, i.price_per_length_php, i.remarks]));
      const wsSea = window.XLSX.utils.aoa_to_sheet(seamRows);
      wsSea['!cols'] = [{ wch: 10 }, { wch: 36 }, { wch: 22 }, { wch: 20 }];
      window.XLSX.utils.book_append_sheet(wb, wsSea, 'Seamless');

      const erwRows = [['Item No.', 'Description', 'Price per Length (PHP)', 'Remarks']];
      data.erw_welded_galvanized_steel.forEach(i => erwRows.push([i.item_no, i.description, i.price_per_length_php, i.remarks]));
      const wsErw = window.XLSX.utils.aoa_to_sheet(erwRows);
      wsErw['!cols'] = [{ wch: 10 }, { wch: 36 }, { wch: 22 }, { wch: 20 }];
      window.XLSX.utils.book_append_sheet(wb, wsErw, 'ERW Welded');

    } else {
      const arr = Array.isArray(data) ? data : [];
      const rows = [['Name', 'Unit', 'Price (PHP)']];
      arr.forEach(i => rows.push([i.name, i.unit, i.price_php]));
      const ws = window.XLSX.utils.aoa_to_sheet(rows);
      ws['!cols'] = [{ wch: 48 }, { wch: 12 }, { wch: 14 }];
      window.XLSX.utils.book_append_sheet(wb, ws, label);
    }

    window.XLSX.writeFile(wb, `URC_CCC_${label.replace(/\s+/g, '_')}.xlsx`);
    if (typeof showToast === 'function') showToast(`${label} exported.`, 'success');
  },

  getCategoryFiles() {
    return CATEGORY_FILES;
  },
};