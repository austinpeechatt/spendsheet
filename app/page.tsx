'use client'

import { useState, useEffect, useCallback } from 'react'
import { trackEvent } from '@/lib/analytics'
import { Hero } from '@/components/spendsheet/hero'
import { SavedReports } from '@/components/spendsheet/saved-reports'
import { UploadZone } from '@/components/spendsheet/upload-zone'
import { CategoryPicker } from '@/components/spendsheet/category-picker'
import { LoadingState } from '@/components/spendsheet/loading-state'
import { ReviewModal } from '@/components/spendsheet/review-modal'
import { ReportView } from '@/components/spendsheet/report-view'
import { Footer } from '@/components/spendsheet/footer'
import { getSavedReports } from '@/lib/storage'
import type { Transaction, SavedReport, AppState } from '@/lib/types'

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Drinks',
  'Food',
  'Utilities',
  'Transportation',
  'Entertainment',
  'Healthcare',
  'Personal Care',
  'Shopping',
  'Rent',
  'Misc',
  'Education',
  'Charity',
  'Family',
  'Gifts',
  'Travel',
  'Membership',
  'Business',
]

export default function SpendsheetPage() {
  const [appState, setAppState] = useState<AppState>('upload')
  const [savedReports, setSavedReports] = useState<SavedReport[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [selectedCategories, setSelectedCategories] = useState<string[]>(DEFAULT_CATEGORIES)
  const [userNotes, setUserNotes] = useState('')
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState<Transaction[]>([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load saved reports on mount
  useEffect(() => {
    setSavedReports(getSavedReports())
  }, [])

  const refreshSavedReports = () => {
    setSavedReports(getSavedReports())
  }

  const handleOpenSavedReport = (report: SavedReport) => {
    setTransactions(report.transactions)
    setSelectedCategories(report.categories)
    setAppState('report')
  }

  const handleTransactionsReady = (txns: Transaction[]) => {
    setTransactions(txns)
    setAppState('upload') // Stay on upload but show category picker
  }

  const handleGenerate = useCallback(async () => {
    setAppState('loading')
    setError(null)

    try {
      // Send transactions to API for categorization
      const response = await fetch('/api/categorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactions: transactions.map((t) => ({
            id: t.id,
            description: t.description,
            amount: t.amount,
          })),
          categories: selectedCategories,
          userNotes,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to categorize transactions')
      }

      const data = await response.json()
      const categorizations = data.categorizations as Record<string, string>

      // Apply categorizations to transactions
      const categorized = transactions.map((t) => ({
        ...t,
        category: categorizations[t.id] || '',
      }))

      // Find uncategorized transactions
      const uncategorized = categorized.filter((t) => !t.category)

      if (uncategorized.length > 0) {
        setUncategorizedTransactions(uncategorized)
        setTransactions(categorized)
        setShowReviewModal(true)
        setAppState('review')
      } else {
        setTransactions(categorized)
        setAppState('report')
        trackEvent('report_generated')
      }
    } catch (err) {
      console.error('Categorization error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setAppState('upload')
    }
  }, [transactions, selectedCategories, userNotes])

  const handleReviewComplete = (reviewed: Transaction[]) => {
    // Merge reviewed transactions back
    const merged = transactions.map((t) => {
      const reviewedT = reviewed.find((r) => r.id === t.id)
      return reviewedT || t
    })
    setTransactions(merged)
    setShowReviewModal(false)
    setAppState('report')
    trackEvent('report_generated')
  }

  const handleStartOver = () => {
    setTransactions([])
    setSelectedCategories(DEFAULT_CATEGORIES)
    setUserNotes('')
    setUncategorizedTransactions([])
    setError(null)
    setAppState('upload')
    refreshSavedReports()
  }

  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 pb-16">
        {appState === 'report' ? (
          <div className="pt-8">
            <ReportView
              initialTransactions={transactions}
              categories={selectedCategories}
              onStartOver={handleStartOver}
            />
          </div>
        ) : (
          <>
            <Hero />

            <div className="max-w-2xl mx-auto space-y-12">
              {savedReports.length > 0 && appState === 'upload' && transactions.length === 0 && (
                <SavedReports
                  reports={savedReports}
                  onOpenReport={handleOpenSavedReport}
                  onRefresh={refreshSavedReports}
                />
              )}

              {appState === 'loading' ? (
                <LoadingState />
              ) : (
                <>
                  {transactions.length === 0 ? (
                    <UploadZone onTransactionsReady={handleTransactionsReady} />
                  ) : (
                    <CategoryPicker
                      selectedCategories={selectedCategories}
                      onCategoriesChange={setSelectedCategories}
                      userNotes={userNotes}
                      onUserNotesChange={setUserNotes}
                      onGenerate={handleGenerate}
                      isLoading={appState as string === 'loading'}
                    />
                  )}

                  {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-center">
                      <p className="text-sm text-destructive">{error}</p>
                      <button
                        onClick={handleGenerate}
                        className="mt-2 text-sm text-destructive underline underline-offset-2 hover:no-underline"
                      >
                        Try again
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            <Footer />
          </>
        )}

        {showReviewModal && (
          <ReviewModal
            open={showReviewModal}
            transactions={uncategorizedTransactions}
            categories={selectedCategories}
            onComplete={handleReviewComplete}
          />
        )}
      </div>
    </main>
  )
}
