'use client'

import { useEffect, useState } from 'react'
import { Spinner } from '@/components/ui/spinner'

const LOADING_MESSAGES = [
  'Parsing your transactions...',
  'Categorizing with AI...',
  'Building your report...',
]

export function LoadingState() {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <Spinner className="w-8 h-8 text-accent mb-6" />
      <p className="text-lg text-muted-foreground animate-pulse">
        {LOADING_MESSAGES[messageIndex]}
      </p>
    </div>
  )
}
