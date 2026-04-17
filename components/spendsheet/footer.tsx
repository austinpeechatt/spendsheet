'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function Footer() {
  const [showPrivacy, setShowPrivacy] = useState(false)

  return (
    <footer className="border-t border-border mt-16 pt-8 pb-12">
      <div className="text-center">
        <button
          onClick={() => setShowPrivacy(!showPrivacy)}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          How your data is handled
          {showPrivacy ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        {showPrivacy && (
          <div className="mt-4 max-w-2xl mx-auto text-left p-6 rounded-lg bg-secondary/30 border border-border">
            <p className="text-sm text-muted-foreground leading-relaxed">
              We don&apos;t run a database. Your CSVs are parsed in your browser. 
              Transaction descriptions and amounts are sent to Anthropic&apos;s API for 
              categorization — Anthropic&apos;s data retention policies apply. Nothing is 
              logged on our end. Close this tab and everything is gone unless you 
              chose &quot;Save to browser.&quot;
            </p>
          </div>
        )}
      </div>
    </footer>
  )
}
