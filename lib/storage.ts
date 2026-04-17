import type { SavedReport } from './types'

const STORAGE_KEY = 'spendsheet_reports'

export function getSavedReports(): SavedReport[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export function saveReport(report: SavedReport): void {
  if (typeof window === 'undefined') return
  
  const reports = getSavedReports()
  // Replace if same month/year exists
  const existingIdx = reports.findIndex(
    r => r.month === report.month && r.year === report.year
  )
  
  if (existingIdx >= 0) {
    reports[existingIdx] = report
  } else {
    reports.unshift(report)
  }
  
  // Keep only last 12 reports
  const trimmed = reports.slice(0, 12)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
}

export function deleteReport(id: string): void {
  if (typeof window === 'undefined') return
  
  const reports = getSavedReports()
  const filtered = reports.filter(r => r.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
}

export function getReportById(id: string): SavedReport | null {
  const reports = getSavedReports()
  return reports.find(r => r.id === id) || null
}
