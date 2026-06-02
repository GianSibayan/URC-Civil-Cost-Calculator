// admin.js — Admin panel logic
// Handles auth, price editing, and Excel upload

// TODO: replace with environment-validated secret via Vercel function
const ADMIN_PASSWORD = 'esd2026'

document.getElementById('loginBtn').addEventListener('click', () => {
  const input = document.getElementById('adminPassword').value
  if (input === ADMIN_PASSWORD) {
    document.getElementById('authSection').style.display = 'none'
    document.getElementById('adminContent').style.display = 'block'
    loadPriceList()
  } else {
    document.getElementById('authError').style.display = 'block'
  }
})

async function loadPriceList() {
  const res = await fetch('./prices.json')
  const prices = await res.json()
  renderPriceList(prices)
}

function renderPriceList(prices) {
  const list = document.getElementById('priceList')
  list.innerHTML = ''
  Object.entries(prices).forEach(([key, item]) => {
    if (key === '_meta') return
    const row = document.createElement('div')
    row.className = 'price-row'
    row.innerHTML = `
      <span class="price-label">${item.label}</span>
      <input type="number" class="price-input" data-key="${key}" value="${item.price}" step="0.01" />
      <span class="price-unit">${item.unit}</span>
    `
    list.appendChild(row)
  })
}

document.getElementById('priceSearch').addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase()
  document.querySelectorAll('.price-row').forEach(row => {
    const label = row.querySelector('.price-label').textContent.toLowerCase()
    row.style.display = label.includes(query) ? 'flex' : 'none'
  })
})

document.getElementById('uploadBtn').addEventListener('click', async () => {
  const file = document.getElementById('excelUpload').files[0]
  if (!file) {
    document.getElementById('uploadStatus').textContent = 'Please select a file first.'
    return
  }
  try {
    const prices = await Parser.parseExcel(file)
    document.getElementById('uploadStatus').textContent = 'Parsed successfully. Review and save prices.'
    console.log('Parsed prices:', prices)
    // TODO: merge parsed prices into price list and push to GitHub via Vercel function
  } catch (err) {
    document.getElementById('uploadStatus').textContent = 'Error: ' + err.message
  }
})
