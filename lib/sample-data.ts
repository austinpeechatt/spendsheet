import type { Transaction } from './types'

export const SAMPLE_TRANSACTIONS: Transaction[] = [
  { id: 's1', date: '2026-03-01', description: 'WHOLE FOODS MARKET', amount: 87.43, category: 'Groceries', paymentMethod: 'Amex', originalRow: {} },
  { id: 's2', date: '2026-03-02', description: 'UBER TRIP', amount: 24.50, category: 'Transportation', paymentMethod: 'Chase Sapphire', originalRow: {} },
  { id: 's3', date: '2026-03-03', description: 'THE DELANCEY NYC', amount: 68.00, category: 'Drinks', paymentMethod: 'Amex', originalRow: {} },
  { id: 's4', date: '2026-03-04', description: 'NETFLIX.COM', amount: 15.99, category: 'Entertainment', paymentMethod: 'Chase Freedom', originalRow: {} },
  { id: 's5', date: '2026-03-05', description: 'TRADER JOES', amount: 52.18, category: 'Groceries', paymentMethod: 'Amex', originalRow: {} },
  { id: 's6', date: '2026-03-06', description: 'SWEETGREEN', amount: 16.45, category: 'Dining Out', paymentMethod: 'Amex', originalRow: {} },
  { id: 's7', date: '2026-03-07', description: 'SPOTIFY USA', amount: 10.99, category: 'Membership', paymentMethod: 'Discover', originalRow: {} },
  { id: 's8', date: '2026-03-08', description: 'ALBERTS BEER NYC', amount: 45.00, category: 'Drinks', paymentMethod: 'Amex', originalRow: {} },
  { id: 's9', date: '2026-03-09', description: 'CVS PHARMACY', amount: 23.67, category: 'Personal Care', paymentMethod: 'Amex', originalRow: {} },
  { id: 's10', date: '2026-03-10', description: 'AMAZON PRIME', amount: 14.99, category: 'Shopping', paymentMethod: 'Chase Sapphire', originalRow: {} },
  { id: 's11', date: '2026-03-11', description: 'LYFT RIDE', amount: 18.75, category: 'Transportation', paymentMethod: 'Amex', originalRow: {} },
  { id: 's12', date: '2026-03-12', description: 'CHIPOTLE', amount: 14.25, category: 'Dining Out', paymentMethod: 'Amex', originalRow: {} },
  { id: 's13', date: '2026-03-13', description: 'TST* JOES PIZZA', amount: 32.00, category: 'Food', paymentMethod: 'Amex', originalRow: {} },
  { id: 's14', date: '2026-03-14', description: 'XOX COCKTAIL BAR', amount: 78.50, category: 'Drinks', paymentMethod: 'Amex', originalRow: {} },
  { id: 's15', date: '2026-03-15', description: 'CON EDISON', amount: 95.00, category: 'Utilities', paymentMethod: 'Chase Freedom', originalRow: {} },
  { id: 's16', date: '2026-03-16', description: 'DONATION - RED CROSS', amount: 50.00, category: 'Charity', paymentMethod: 'Capital One', originalRow: {} },
  { id: 's17', date: '2026-03-17', description: 'UNIQLO NYC', amount: 89.00, category: 'Shopping', paymentMethod: 'Amex', originalRow: {} },
  { id: 's18', date: '2026-03-18', description: 'STARBUCKS', amount: 7.85, category: 'Drinks', paymentMethod: 'Amex', originalRow: {} },
  { id: 's19', date: '2026-03-19', description: 'DOORDASH THAI VILLA', amount: 38.90, category: 'Food', paymentMethod: 'Chase Sapphire', originalRow: {} },
  { id: 's20', date: '2026-03-20', description: 'NCOURT-DP PAYMENT', amount: 180.00, category: 'Misc', paymentMethod: 'Amex', originalRow: {} },
  { id: 's21', date: '2026-03-21', description: 'EQUINOX MEMBERSHIP', amount: 220.00, category: 'Membership', paymentMethod: 'Amex', originalRow: {} },
  { id: 's22', date: '2026-03-22', description: 'BOOK CULTURE NYC', amount: 34.99, category: 'Education', paymentMethod: 'Amex', originalRow: {} },
  { id: 's23', date: '2026-03-23', description: 'URBAN OUTFITTERS', amount: 67.00, category: 'Shopping', paymentMethod: 'Discover', originalRow: {} },
  { id: 's24', date: '2026-03-24', description: 'SEAMLESS SUSHI', amount: 42.50, category: 'Food', paymentMethod: 'Amex', originalRow: {} },
  { id: 's25', date: '2026-03-25', description: 'MTA METROCARD', amount: 33.00, category: 'Transportation', paymentMethod: 'Chase Freedom', originalRow: {} },
  { id: 's26', date: '2026-03-26', description: 'REFUND - AMAZON', amount: -45.00, category: 'Shopping', paymentMethod: 'Chase Sapphire', originalRow: {} },
  { id: 's27', date: '2026-03-27', description: 'TARGET', amount: 56.78, category: 'Shopping', paymentMethod: 'Amex', originalRow: {} },
  { id: 's28', date: '2026-03-28', description: 'DEATH & CO NYC', amount: 92.00, category: 'Drinks', paymentMethod: 'Amex', originalRow: {} },
  { id: 's29', date: '2026-03-29', description: 'CITIBIKE ANNUAL', amount: 185.00, category: 'Transportation', paymentMethod: 'Amex', originalRow: {} },
  { id: 's30', date: '2026-03-30', description: 'GRUBHUB PIZZA', amount: 28.50, category: 'Food', paymentMethod: 'Amex', originalRow: {} },
]

export function loadSampleData(): Transaction[] {
  return SAMPLE_TRANSACTIONS.map(t => ({
    ...t,
    id: `${t.id}-${Date.now()}`,
  }))
}
