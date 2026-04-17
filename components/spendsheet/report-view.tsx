'use client'

import { useState, useMemo, useCallback } from 'react'
import { Copy, Download, Save, RotateCcw, Check } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { ChartContainer } from '@/components/ui/chart'
import { Bar, BarChart, XAxis, YAxis, Cell, ResponsiveContainer } from 'recharts'
import type { Transaction, ReportData, SavedReport } from '@/lib/types'
import { generateReportData, formatCurrency } from '@/lib/report-utils'
import { saveReport } from '@/lib/storage'

interface ReportViewProps {
  initialTransactions: Transaction[]
  categories: string[]
  onStartOver: () => void
}

const CHART_COLORS = [
  '#7FD858', // accent green
  '#5B9BD5', // blue
  '#A67BCC', // purple
  '#D4A843', // amber
  '#D46B5B', // coral
]

type SortField = 'date' | 'description' | 'amount' | 'category' | 'paymentMethod'
type SortDirection = 'asc' | 'desc'

export function ReportView({
  initialTransactions,
  categories,
  onStartOver,
}: ReportViewProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [copiedInsights, setCopiedInsights] = useState(false)
  const [saved, setSaved] = useState(false)
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [editingCell, setEditingCell] = useState<{ id: string; field: 'category' | 'amount' } | null>(null)

  const reportData: ReportData = useMemo(
    () => generateReportData(transactions, categories),
    [transactions, categories]
  )

  const paymentMethods = useMemo(() => {
    const pms = new Set(transactions.map((t) => t.paymentMethod))
    return Array.from(pms).sort()
  }, [transactions])

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'description':
          comparison = a.description.localeCompare(b.description)
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'category':
          comparison = a.category.localeCompare(b.category)
          break
        case 'paymentMethod':
          comparison = a.paymentMethod.localeCompare(b.paymentMethod)
          break
      }
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }, [transactions, sortField, sortDirection])

  const chartData = useMemo(() => {
    return reportData.pivotData
      .filter((p) => p.total > 0)
      .slice(0, 10)
      .map((p, index) => ({
        category: p.category,
        total: p.total,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      }))
  }, [reportData.pivotData])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const updateTransactionCategory = useCallback((id: string, category: string) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, category } : t))
    )
    setEditingCell(null)
  }, [])

  const updateTransactionAmount = useCallback((id: string, amount: number) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, amount } : t))
    )
    setEditingCell(null)
  }, [])

  const copyInsights = () => {
    const text = `${reportData.month} ${reportData.year} Spending Summary\n\n${reportData.insights.map((i) => `• ${i}`).join('\n')}`
    navigator.clipboard.writeText(text)
    setCopiedInsights(true)
    setTimeout(() => setCopiedInsights(false), 2000)
  }

  const handleSave = () => {
    const report: SavedReport = {
      id: `${reportData.month}-${reportData.year}-${Date.now()}`,
      month: reportData.month,
      year: reportData.year,
      totalSpend: reportData.grandTotal,
      createdAt: new Date().toISOString(),
      transactions,
      categories,
    }
    saveReport(report)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleDownloadPDF = () => {
    // For now, we'll use window.print() as a simple PDF solution
    window.print()
  }

  return (
    <div className="space-y-8 print:space-y-4">
      {/* Sticky action buttons */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur py-4 -mx-4 px-4 flex items-center gap-3 border-b border-border print:hidden">
        <div className="flex items-center gap-2 mr-auto">
          <Image src="/logo.png" alt="Spendsheet" width={24} height={24} className="invert brightness-90" />
          <span className="text-base font-semibold tracking-tight text-foreground">Spendsheet</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onStartOver}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Start over
        </Button>
        <Button variant="outline" size="sm" onClick={handleSave}>
          {saved ? <Check className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? 'Saved!' : 'Save to browser'}
        </Button>
        <Button size="sm" onClick={handleDownloadPDF} className="bg-accent text-[#0A0A0A] hover:bg-accent/85">
          <Download className="w-4 h-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Report header */}
      <div>
        <h1 className="text-3xl font-semibold text-foreground">
          {reportData.month} {reportData.year} — Spending Summary
        </h1>
      </div>

      {/* Insights */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium text-foreground">Insights</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={copyInsights}
            className="text-muted-foreground print:hidden"
          >
            {copiedInsights ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copiedInsights ? 'Copied!' : 'Copy'}
          </Button>
        </div>
        <ul className="space-y-2">
          {reportData.insights.map((insight, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span
                className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 bg-accent"
              />
              <span className="text-muted-foreground">{insight}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pivot Table */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-foreground">By Category</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-40">Category</TableHead>
                {paymentMethods.map((pm) => (
                  <TableHead key={pm} className="text-right">
                    {pm}
                  </TableHead>
                ))}
                <TableHead className="text-right font-semibold">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.pivotData.map((row) => (
                <TableRow key={row.category} className="hover:bg-secondary/50">
                  <TableCell className="font-medium">{row.category}</TableCell>
                  {paymentMethods.map((pm) => (
                    <TableCell key={pm} className="text-right text-sm">
                      {row.byPaymentMethod[pm]
                        ? formatCurrency(row.byPaymentMethod[pm])
                        : ''}
                    </TableCell>
                  ))}
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(row.total)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-secondary/30 font-semibold hover:bg-secondary/50">
                <TableCell>Grand Total</TableCell>
                {paymentMethods.map((pm) => (
                  <TableCell key={pm} className="text-right">
                    {formatCurrency(reportData.totalByPaymentMethod[pm] || 0)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {formatCurrency(reportData.grandTotal)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Bar Chart */}
      <section className="space-y-3 print:hidden">
        <h2 className="text-xl font-medium text-foreground">Spending by Category</h2>
        <ChartContainer
          config={{}}
          className="h-80 w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 0, right: 20, bottom: 0, left: 80 }}
            >
              <XAxis
                type="number"
                tickFormatter={(v) => `$${v}`}
                stroke="#999999"
                fontSize={12}
              />
              <YAxis
                type="category"
                dataKey="category"
                stroke="#999999"
                fontSize={12}
                width={75}
              />
              <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </section>

      {/* Transaction Table */}
      <section className="space-y-3">
        <h2 className="text-xl font-medium text-foreground">All Transactions</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-16 bg-background z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('date')}
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('description')}
                >
                  Description {sortField === 'description' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="text-right cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('amount')}
                >
                  Amount {sortField === 'amount' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('category')}
                >
                  Category {sortField === 'category' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => handleSort('paymentMethod')}
                >
                  Card {sortField === 'paymentMethod' && (sortDirection === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTransactions.map((t) => (
                <TableRow key={t.id} className="hover:bg-secondary/50">
                  <TableCell className="text-muted-foreground">
                    {new Date(t.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </TableCell>
                  <TableCell className="max-w-xs truncate" title={t.description}>
                    {t.description}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingCell?.id === t.id && editingCell.field === 'amount' ? (
                      <Input
                        type="number"
                        step="0.01"
                        defaultValue={t.amount}
                        className="w-24 h-7 text-right bg-input"
                        autoFocus
                        onBlur={(e) => updateTransactionAmount(t.id, parseFloat(e.target.value) || t.amount)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            updateTransactionAmount(t.id, parseFloat((e.target as HTMLInputElement).value) || t.amount)
                          }
                          if (e.key === 'Escape') {
                            setEditingCell(null)
                          }
                        }}
                      />
                    ) : (
                      <span
                        className="cursor-pointer hover:bg-secondary px-2 py-1 rounded print:cursor-default"
                        onClick={() => setEditingCell({ id: t.id, field: 'amount' })}
                      >
                        {formatCurrency(t.amount)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCell?.id === t.id && editingCell.field === 'category' ? (
                      <Select
                        defaultValue={t.category}
                        onValueChange={(v) => updateTransactionCategory(t.id, v)}
                      >
                        <SelectTrigger className="w-32 h-7 bg-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <span
                        className="cursor-pointer hover:bg-secondary px-2 py-1 rounded print:cursor-default"
                        onClick={() => setEditingCell({ id: t.id, field: 'category' })}
                      >
                        {t.category}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{t.paymentMethod}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-8 text-center text-sm text-muted-foreground">
        Generated {new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: '2-digit',
          year: 'numeric',
        })} at {new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </footer>
    </div>
  )
}
