import type { Transaction, CategoryTotal, ReportData } from './types'

export function generateReportData(
  transactions: Transaction[],
  categories: string[]
): ReportData {
  // Get month/year from first transaction
  const firstDate = new Date(transactions[0]?.date || new Date())
  const month = firstDate.toLocaleDateString('en-US', { month: 'long' })
  const year = firstDate.getFullYear()

  // Calculate totals by category and payment method
  const categoryMap = new Map<string, CategoryTotal>()
  const paymentMethodTotals: Record<string, number> = {}
  let grandTotal = 0

  for (const t of transactions) {
    const category = t.category || 'Misc'
    const pm = t.paymentMethod

    // Update category totals
    if (!categoryMap.has(category)) {
      categoryMap.set(category, {
        category,
        total: 0,
        byPaymentMethod: {},
      })
    }
    const catData = categoryMap.get(category)!
    catData.total += t.amount
    catData.byPaymentMethod[pm] = (catData.byPaymentMethod[pm] || 0) + t.amount

    // Update payment method totals
    paymentMethodTotals[pm] = (paymentMethodTotals[pm] || 0) + t.amount

    // Grand total
    grandTotal += t.amount
  }

  // Sort pivot data by total spend (descending)
  const pivotData = Array.from(categoryMap.values()).sort(
    (a, b) => Math.abs(b.total) - Math.abs(a.total)
  )

  // Generate insights
  const insights = generateInsights(transactions, pivotData, paymentMethodTotals, grandTotal)

  return {
    month,
    year,
    transactions,
    categories,
    insights,
    pivotData,
    totalByPaymentMethod: paymentMethodTotals,
    grandTotal,
  }
}

function generateInsights(
  transactions: Transaction[],
  pivotData: CategoryTotal[],
  paymentMethodTotals: Record<string, number>,
  grandTotal: number
): string[] {
  const insights: string[] = []

  // Top spending category
  const topCategory = pivotData[0]
  if (topCategory && topCategory.total > 0) {
    const topMerchants = getTopMerchants(transactions, topCategory.category, 3)
    const merchantNote = topMerchants.length > 0 ? ` — mostly ${topMerchants.join(', ')}` : ''
    insights.push(
      `${topCategory.category} at $${Math.abs(topCategory.total).toFixed(0)} is the top category${merchantNote}`
    )
  }

  // Food + Drinks combined if significant
  const foodCategories = ['Food', 'Drinks', 'Dining Out', 'Groceries']
  const foodTotal = pivotData
    .filter(p => foodCategories.includes(p.category))
    .reduce((sum, p) => sum + p.total, 0)
  
  if (foodTotal > 0 && grandTotal > 0) {
    const foodPercent = Math.round((foodTotal / grandTotal) * 100)
    if (foodPercent > 30) {
      insights.push(
        `Food-related spending combined = $${foodTotal.toFixed(0)}, over ${foodPercent}% of total spend`
      )
    }
  }

  // Unusual single transaction
  const sortedByAmount = [...transactions].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  const largestTxn = sortedByAmount[0]
  if (largestTxn && Math.abs(largestTxn.amount) > grandTotal * 0.1) {
    const isRefund = largestTxn.amount < 0
    insights.push(
      `${largestTxn.category} at $${Math.abs(largestTxn.amount).toFixed(0)} — ${largestTxn.description.substring(0, 20)}${isRefund ? ' is a refund/credit' : ' is a one-time payment'}`
    )
  }

  // Payment method breakdown
  const pmEntries = Object.entries(paymentMethodTotals).sort((a, b) => b[1] - a[1])
  if (pmEntries.length > 1 && grandTotal > 0) {
    const topPM = pmEntries[0]
    const topPercent = Math.round((topPM[1] / grandTotal) * 100)
    if (topPercent > 70) {
      const lessUsed = pmEntries.slice(1).map(([name]) => name).join(' and ')
      insights.push(
        `${topPM[0]} carries ${topPercent}% of all spending — ${lessUsed} barely used`
      )
    }
  }

  // Total baseline
  insights.push(
    `Total spending this month: $${grandTotal.toFixed(2)}`
  )

  return insights.slice(0, 5)
}

function getTopMerchants(
  transactions: Transaction[],
  category: string,
  count: number
): string[] {
  const merchantTotals = new Map<string, number>()
  
  for (const t of transactions) {
    if (t.category === category) {
      // Clean up merchant name
      const merchant = t.description
        .replace(/^(TST\*|SQ\*|DOORDASH|UBER|LYFT|GRUBHUB|SEAMLESS)/i, '')
        .split(/\s+/)[0]
        .replace(/[^a-zA-Z]/g, '')
      
      if (merchant.length > 2) {
        merchantTotals.set(merchant, (merchantTotals.get(merchant) || 0) + t.amount)
      }
    }
  }

  return Array.from(merchantTotals.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([name]) => name)
}

export function formatCurrency(amount: number): string {
  const isNegative = amount < 0
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return isNegative ? `-$${formatted}` : `$${formatted}`
}
