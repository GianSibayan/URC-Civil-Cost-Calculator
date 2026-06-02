// calculator.js — Core cost estimation logic
// Computes civil project cost from building parameters + price references

const Calculator = (() => {

  // Load prices from prices.json or localStorage override
  async function loadPrices() {
    try {
      const res = await fetch('./prices.json')
      const data = await res.json()
      return data
    } catch (err) {
      console.error('Failed to load prices.json', err)
      return {}
    }
  }

  // Main estimation function
  // params: { groundArea, height, mezzanine, cantilever, floors, roomCount, ... }
  // prices: loaded from prices.json
  function estimate(params, prices) {

    // TODO: finalize formula with Sir Tony
    // Below is a placeholder structure pending actual civil scope data

    const {
      groundArea = 0,
      height = 0,
      floors = 1,
      hasMezzanine = false,
      hasCantilever = false
    } = params

    const totalArea = groundArea * floors + (hasMezzanine ? groundArea * 0.5 : 0)

    // Rough volume estimates — to be calibrated with actual civil scope
    const concreteVolume = totalArea * height * 0.15
    const rebarWeight = concreteVolume * 120
    const laborDays = totalArea * 0.8

    const directCosts = {
      cement: (concreteVolume / 0.03) * (prices.cement?.price || 0),
      rebar: rebarWeight * (prices.rebar_10mm?.price || 0),
      sand: concreteVolume * 0.6 * (prices.sand?.price || 0),
      gravel: concreteVolume * 0.8 * (prices.gravel?.price || 0),
      labor: laborDays * (prices.labor?.price || 0)
    }

    const directTotal = Object.values(directCosts).reduce((a, b) => a + b, 0)

    const engineeringFee = directTotal * (prices.engineering_fee_rate?.price || 0.08)
    const undefinedAllowance = directTotal * (prices.undefined_allowance_rate?.price || 0.03)
    const subtotal = directTotal + engineeringFee + undefinedAllowance

    const contingency = subtotal * (prices.contingency_rate?.price || 0.10)
    const escalation = subtotal * (prices.escalation_rate?.price || 0.05)

    const totalEstimate = subtotal + contingency + escalation

    return {
      directCosts,
      directTotal,
      engineeringFee,
      undefinedAllowance,
      subtotal,
      contingency,
      escalation,
      totalEstimate
    }
  }

  return { loadPrices, estimate }
})()
