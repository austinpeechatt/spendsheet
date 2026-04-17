export interface Transaction {
  id: string
  date: string
  description: string
  amount: number
  category: string
  paymentMethod: string
  originalRow: Record<string, string>
}

export interface ParsedFile {
  name: string
  transactions: Transaction[]
  paymentMethod: string
}

export interface SavedReport {
  id: string
  month: string
  year: number
  totalSpend: number
  createdAt: string
  transactions: Transaction[]
  categories: string[]
}

export interface CategoryTotal {
  category: string
  total: number
  byPaymentMethod: Record<string, number>
}

export interface ReportData {
  month: string
  year: number
  transactions: Transaction[]
  categories: string[]
  insights: string[]
  pivotData: CategoryTotal[]
  totalByPaymentMethod: Record<string, number>
  grandTotal: number
}

export type AppState = 'upload' | 'loading' | 'review' | 'report'

export interface UncategorizedTransaction {
  transaction: Transaction
  suggestedCategory?: string
}
