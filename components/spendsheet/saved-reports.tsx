'use client'

import { Calendar, DollarSign, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import type { SavedReport } from '@/lib/types'
import { deleteReport } from '@/lib/storage'

interface SavedReportsProps {
  reports: SavedReport[]
  onOpenReport: (report: SavedReport) => void
  onRefresh: () => void
}

export function SavedReports({ reports, onOpenReport, onRefresh }: SavedReportsProps) {
  if (reports.length === 0) return null

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    deleteReport(id)
    onRefresh()
  }

  return (
    <section className="mb-12">
      <h2 className="text-lg font-medium text-foreground mb-4">Your saved reports</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => (
          <Card
            key={report.id}
            className="bg-card border-border hover:border-muted-foreground/30 transition-colors cursor-pointer group"
            onClick={() => onOpenReport(report)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span className="font-medium text-foreground">
                    {report.month} {report.year}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  onClick={(e) => handleDelete(e, report.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-1 text-xl font-semibold text-foreground">
                <DollarSign className="w-5 h-5" />
                {Math.abs(report.totalSpend).toLocaleString('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {report.transactions.length} transactions
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
