'use client'

import { useCallback, useState } from 'react'
import { Upload, X, AlertCircle, FileText } from 'lucide-react'
import { trackEvent } from '@/lib/analytics'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { parseCSV, getMonthsFromTransactions, filterTransactionsByMonth } from '@/lib/csv-parser'
import { loadSampleData } from '@/lib/sample-data'
import type { Transaction } from '@/lib/types'

interface UploadZoneProps {
  onTransactionsReady: (transactions: Transaction[]) => void
}

export function UploadZone({ onTransactionsReady }: UploadZoneProps) {
  const [files, setFiles] = useState<{ name: string; transactions: Transaction[] }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null)

  const allTransactions = files.flatMap(f => f.transactions)
  const months = getMonthsFromTransactions(allTransactions)

  const processFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError("That doesn't look like a CSV. Try re-exporting from your bank.")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large (max 5MB). Try exporting just one month.")
      return
    }

    try {
      const content = await file.text()
      const parsed = parseCSV(content, file.name)
      
      if (parsed.transactions.length === 0) {
        setError("We couldn't find any transactions in this file.")
        return
      }

      if (parsed.transactions.length > 2000) {
        setError("That's a lot of transactions — please upload one month at a time.")
        return
      }

      setFiles(prev => [...prev, { name: file.name, transactions: parsed.transactions }])
      setError(null)
      trackEvent('upload_started')
    } catch (err) {
      console.error(err)
      setError("We couldn't recognize this format. Supported: Amex, Chase, Discover, Capital One.")
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)
      
      const droppedFiles = Array.from(e.dataTransfer.files)
      droppedFiles.forEach(processFile)
    },
    [processFile]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      selectedFiles.forEach(processFile)
      e.target.value = ''
    },
    [processFile]
  )

  const removeFile = (fileName: string) => {
    setFiles(prev => prev.filter(f => f.name !== fileName))
    setSelectedMonth(null)
  }

  const handleUseSampleData = () => {
    const sampleTransactions = loadSampleData()
    setFiles([{ name: 'sample_data.csv', transactions: sampleTransactions }])
    setError(null)
    trackEvent('sample_data_used')
  }

  const handleContinue = () => {
    let transactionsToUse = allTransactions
    
    if (months.length > 1 && selectedMonth) {
      const [year, month] = selectedMonth.split('-').map(Number)
      transactionsToUse = filterTransactionsByMonth(allTransactions, month, year)
    }
    
    onTransactionsReady(transactionsToUse)
  }

  return (
    <section className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragOver 
            ? 'border-accent bg-accent/5' 
            : 'border-border hover:border-muted-foreground/50'}
        `}
      >
        <input
          type="file"
          accept=".csv"
          multiple
          onChange={handleFileInput}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-foreground">
          Drop your CSV files here
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          or click to browse
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Works with</span>
        <Badge variant="outline" className="font-normal">Amex</Badge>
        <Badge variant="outline" className="font-normal">Chase</Badge>
        <Badge variant="outline" className="font-normal">Discover</Badge>
        <Badge variant="outline" className="font-normal">Capital One</Badge>
        <Badge variant="outline" className="font-normal">Citi</Badge>
        <Badge variant="outline" className="font-normal">Bank of America</Badge>
        <Badge variant="outline" className="font-normal">Wells Fargo</Badge>
        <Badge variant="outline" className="font-normal">US Bank</Badge>
        <Badge variant="outline" className="font-normal">Barclays</Badge>
        <Badge variant="outline" className="font-normal">HSBC</Badge>
        <Badge variant="outline" className="font-normal">TD Bank</Badge>
        <Badge variant="outline" className="font-normal">PNC</Badge>
        <Badge variant="outline" className="font-normal">Navy Federal</Badge>
        <Badge variant="outline" className="font-normal">USAA</Badge>
        <span className="text-muted-foreground/60">& most CSV exports</span>
      </div>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {files.map((file) => (
            <Badge
              key={file.name}
              variant="secondary"
              className="px-3 py-1.5 gap-2 text-sm"
            >
              <FileText className="w-3.5 h-3.5" />
              {file.name}
              <button
                onClick={() => removeFile(file.name)}
                className="ml-1 hover:text-destructive transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {months.length > 1 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-secondary/50 border border-border">
          <AlertCircle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-foreground">
              Looks like these span {months.length} months. Please select which month to process.
            </p>
            <Select value={selectedMonth || ''} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full mt-2 bg-input">
                <SelectValue placeholder="Select a month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="text-center pt-2">
        <button
          onClick={handleUseSampleData}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
        >
          Don&apos;t have a CSV handy? Try with sample data →
        </button>
      </div>

      {files.length > 0 && (months.length <= 1 || selectedMonth) && (
        <div className="pt-4">
          <Button
            onClick={handleContinue}
            className="w-full h-12 text-base font-medium bg-accent text-[#0A0A0A] hover:bg-accent/85"
          >
            Continue to Categories →
          </Button>
        </div>
      )}
    </section>
  )
}
