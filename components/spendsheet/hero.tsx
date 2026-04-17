'use client'

import { CreditCard } from 'lucide-react'

export function Hero() {
  return (
    <section className="pt-8 pb-12 px-4">
      <div className="flex items-center gap-2 mb-12">
        <CreditCard className="w-6 h-6 text-accent" />
        <span className="text-lg font-semibold tracking-tight text-foreground">Credi</span>
      </div>
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight text-balance max-w-3xl mx-auto">
          Your credit card transactions, finally organized.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-balance">
          Drop in your CSVs. Get a clean report in seconds. No signup, no bank connection, no BS.
        </p>
      </div>
    </section>
  )
}
