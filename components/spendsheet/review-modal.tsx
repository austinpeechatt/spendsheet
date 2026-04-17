'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Transaction } from '@/lib/types'

interface ReviewModalProps {
  open: boolean
  transactions: Transaction[]
  categories: string[]
  onComplete: (transactions: Transaction[]) => void
}

export function ReviewModal({
  open,
  transactions,
  categories,
  onComplete,
}: ReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [reviewedTransactions, setReviewedTransactions] = useState<Transaction[]>([...transactions])

  const current = reviewedTransactions[currentIndex]
  const progress = `${currentIndex + 1} of ${transactions.length}`

  const updateCategory = (category: string) => {
    setReviewedTransactions((prev) => {
      const updated = [...prev]
      updated[currentIndex] = { ...updated[currentIndex], category }
      return updated
    })
  }

  const handleNext = () => {
    if (currentIndex < transactions.length - 1) {
      setCurrentIndex((prev) => prev + 1)
    } else {
      onComplete(reviewedTransactions)
    }
  }

  const handleSkipAll = () => {
    const withMisc = reviewedTransactions.map((t) =>
      t.category ? t : { ...t, category: 'Misc' }
    )
    onComplete(withMisc)
  }

  if (!current) return null

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        showCloseButton={false}
        className="sm:max-w-md animate-jiggle"
      >
        <DialogHeader>
          <DialogTitle className="text-xl">Need your help with a few</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-4 rounded-lg bg-secondary/50 space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{new Date(current.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              <span className="font-mono">${current.amount.toFixed(2)}</span>
            </div>
            <p className="text-foreground font-medium">{current.description}</p>
          </div>

          <Select
            value={current.category || ''}
            onValueChange={updateCategory}
          >
            <SelectTrigger className="w-full bg-input">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="ghost"
            onClick={handleSkipAll}
            className="text-muted-foreground"
          >
            Skip all as Misc
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{progress}</span>
            <Button onClick={handleNext} disabled={!current.category}>
              {currentIndex < transactions.length - 1 ? 'Next' : 'Done'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
