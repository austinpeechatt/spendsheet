import type { Transaction, ParsedFile } from './types'

interface CSVFormat {
  name: string
  dateColumn: string
  descriptionColumn: string
  amountColumn: string
  // Some cards have separate debit/credit columns
  debitColumn?: string
  creditColumn?: string
  // Date format for parsing
  dateFormat: 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YY'
  // If true, negate amounts (Chase uses negative for purchases)
  negateAmount?: boolean
}

const CSV_FORMATS: Record<string, CSVFormat> = {
  amex: {
    name: 'Amex',
    dateColumn: 'Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateFormat: 'MM/DD/YYYY',
  },
  chase: {
    name: 'Chase',
    dateColumn: 'Transaction Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateFormat: 'MM/DD/YYYY',
    negateAmount: true,
  },
  chaseFreedom: {
    name: 'Chase Freedom',
    dateColumn: 'Trans Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateFormat: 'MM/DD/YYYY',
    negateAmount: true,
  },
  discover: {
    name: 'Discover',
    dateColumn: 'Trans. Date',
    descriptionColumn: 'Description',
    amountColumn: 'Amount',
    dateFormat: 'MM/DD/YYYY',
  },
  capitalOne: {
    name: 'Capital One',
    dateColumn: 'Transaction Date',
    descriptionColumn: 'Description',
    debitColumn: 'Debit',
    creditColumn: 'Credit',
    amountColumn: '',
    dateFormat: 'YYYY-MM-DD',
  },
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function detectFormat(headers: string[]): CSVFormat | null {
  const headerSet = new Set(headers.map(h => h.toLowerCase().trim()))

  if (headerSet.has('date') && headerSet.has('description') && headerSet.has('amount')) {
    return CSV_FORMATS.amex
  }

  if (headerSet.has('transaction date') && headerSet.has('description')) {
    if (headerSet.has('debit') && headerSet.has('credit')) {
      return CSV_FORMATS.capitalOne
    }
    return CSV_FORMATS.chase
  }

  if (headerSet.has('trans date') && headerSet.has('description')) {
    return CSV_FORMATS.chaseFreedom
  }

  if (headerSet.has('trans. date') && headerSet.has('description')) {
    return CSV_FORMATS.discover
  }

  return null
}

/**
 * Find the actual header row in a CSV that may have metadata rows above it
 * (e.g., Amex CSVs have account info before the header row)
 */
function findHeaderRow(lines: string[]): { headerIndex: number; headers: string[] } {
  const knownHeaders = ['date', 'description', 'amount', 'transaction date', 'trans. date', 'trans date', 'debit', 'credit']

  for (let i = 0; i < Math.min(lines.length, 15); i++) {
    const parsed = parseCSVLine(lines[i])
    const lower = parsed.map(h => h.toLowerCase().trim())

    // Check if this line contains at least 2 known header columns
    const matches = lower.filter(h => knownHeaders.includes(h))
    if (matches.length >= 2) {
      return { headerIndex: i, headers: parsed }
    }
  }

  // Fallback: use line 0
  return { headerIndex: 0, headers: parseCSVLine(lines[0]) }
}

function parseDate(dateStr: string, format: string): Date {
  const cleaned = dateStr.trim()
  const parts = cleaned.split(/[/-]/)

  if (format === 'YYYY-MM-DD') {
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
  } else if (format === 'MM/DD/YYYY') {
    return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]))
  } else if (format === 'MM/DD/YY') {
    const year = parseInt(parts[2])
    const fullYear = year < 50 ? 2000 + year : 1900 + year
    return new Date(fullYear, parseInt(parts[0]) - 1, parseInt(parts[1]))
  }

  return new Date(dateStr)
}

function getPaymentMethodFromFileName(fileName: string): string {
  const lower = fileName.toLowerCase()
  if (lower.includes('amex') || lower.includes('american express')) return 'Amex'
  if (lower.includes('chase') && lower.includes('sapphire')) return 'Chase Sapphire'
  if (lower.includes('chase') && lower.includes('freedom')) return 'Chase Freedom'
  if (lower.includes('chase')) return 'Chase'
  if (lower.includes('discover')) return 'Discover'
  if (lower.includes('capital') || lower.includes('capitalone')) return 'Capital One'
  return 'Card'
}

export function parseCSV(content: string, fileName: string): ParsedFile {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows')
  }

  // Find the real header row (skip metadata rows)
  const { headerIndex, headers } = findHeaderRow(lines)
  const format = detectFormat(headers)

  if (!format) {
    throw new Error('Unrecognized CSV format')
  }

  const paymentMethod = getPaymentMethodFromFileName(fileName)
  const transactions: Transaction[] = []

  const dateIdx = headers.findIndex(h => h.toLowerCase().trim() === format.dateColumn.toLowerCase())
  const descIdx = headers.findIndex(h => h.toLowerCase().trim() === format.descriptionColumn.toLowerCase())
  const amountIdx = format.amountColumn ? headers.findIndex(h => h.toLowerCase().trim() === format.amountColumn.toLowerCase()) : -1
  const debitIdx = format.debitColumn ? headers.findIndex(h => h.toLowerCase().trim() === format.debitColumn!.toLowerCase()) : -1
  const creditIdx = format.creditColumn ? headers.findIndex(h => h.toLowerCase().trim() === format.creditColumn!.toLowerCase()) : -1

  // Start parsing from the row AFTER the header
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    if (values.length < Math.max(dateIdx, descIdx, amountIdx) + 1) continue

    const dateStr = values[dateIdx]
    const description = values[descIdx]

    // Skip empty descriptions
    if (!description || description.trim() === '') continue

    // Skip autopay/payment rows — these are credit card bill payments, not spending
    const descLower = description.toLowerCase()
    if (
      descLower.includes('autopay') ||
      descLower.includes('automatic payment') ||
      descLower.includes('payment - thank') ||
      descLower.includes('autopay pymt') ||
      descLower.includes('online payment') ||
      descLower.includes('directpay full balance')
    ) continue

    let amount: number
    if (amountIdx >= 0) {
      amount = parseFloat(values[amountIdx]?.replace(/[$,]/g, '') || '0')
      // Chase uses negative amounts for purchases — flip them
      if (format.negateAmount) {
        amount = -amount
      }
    } else {
      // Capital One style with separate debit/credit
      const debit = parseFloat(values[debitIdx]?.replace(/[$,]/g, '') || '0')
      const credit = parseFloat(values[creditIdx]?.replace(/[$,]/g, '') || '0')
      amount = debit || -credit
    }

    if (!dateStr || isNaN(amount)) continue

    // Skip date strings that don't look like dates
    if (!/\d/.test(dateStr)) continue

    const date = parseDate(dateStr, format.dateFormat)
    if (isNaN(date.getTime())) continue

    const originalRow: Record<string, string> = {}
    headers.forEach((h, idx) => {
      originalRow[h] = values[idx] || ''
    })

    transactions.push({
      id: `${fileName}-${i}-${Date.now()}`,
      date: date.toISOString().split('T')[0],
      description,
      amount,
      category: '',
      paymentMethod,
      originalRow,
    })
  }

  return {
    name: fileName,
    transactions,
    paymentMethod,
  }
}

export function getMonthsFromTransactions(transactions: Transaction[]): { month: number; year: number; label: string }[] {
  const months = new Map<string, { month: number; year: number; label: string }>()

  for (const t of transactions) {
    const date = new Date(t.date)
    const key = `${date.getFullYear()}-${date.getMonth()}`
    if (!months.has(key)) {
      months.set(key, {
        month: date.getMonth(),
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      })
    }
  }

  return Array.from(months.values()).sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
}

export function filterTransactionsByMonth(
  transactions: Transaction[],
  month: number,
  year: number
): Transaction[] {
  return transactions.filter(t => {
    const date = new Date(t.date)
    return date.getMonth() === month && date.getFullYear() === year
  })
}
