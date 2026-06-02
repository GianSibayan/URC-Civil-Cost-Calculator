// parser.js — SheetJS Excel parsing module
// Handles reading uploaded Excel price reference files

// SheetJS loaded via CDN in index.html
// https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js

const Parser = (() => {

  // Parse uploaded Excel file and extract price data
  function parseExcel(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result)
          const workbook = XLSX.read(data, { type: 'array' })

          console.log('Sheets found:', workbook.SheetNames)

          // TODO: map actual sheet names from Sir Tony's Excel
          // Expected sheets: Materials, Labor, Engineering, Allowances
          const prices = {}

          workbook.SheetNames.forEach(sheetName => {
            const sheet = workbook.Sheets[sheetName]
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })
            console.log(`Sheet: ${sheetName}`, rows)
            // TODO: extract price columns per sheet structure
          })

          resolve(prices)
        } catch (err) {
          reject(new Error('Failed to parse Excel file: ' + err.message))
        }
      }

      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsArrayBuffer(file)
    })
  }

  // Validate parsed prices before applying
  function validate(prices) {
    const required = ['cement', 'rebar_10mm', 'sand', 'gravel', 'labor']
    const missing = required.filter(key => !prices[key])
    if (missing.length > 0) {
      return { valid: false, missing }
    }
    return { valid: true }
  }

  return { parseExcel, validate }
})()
