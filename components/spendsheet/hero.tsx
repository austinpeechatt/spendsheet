'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CreditCard } from 'lucide-react'
import { SplineScene } from '@/components/ui/splite'

export function Hero() {
  const [titleNumber, setTitleNumber] = useState(0)
  const titles = useMemo(
    () => ['organized', 'tracked', 'visualized', 'understood'],
    []
  )

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0)
      } else {
        setTitleNumber(titleNumber + 1)
      }
    }, 2000)
    return () => clearTimeout(timeoutId)
  }, [titleNumber, titles])

  return (
    <section className="pt-8 pb-12 px-4">
      <div className="flex items-center gap-2 mb-8">
        <CreditCard className="w-6 h-6 text-accent" />
        <span className="text-lg font-semibold tracking-tight text-foreground">Spendsheet</span>
      </div>

      <div className="w-full min-h-[420px] relative overflow-hidden">
        <div className="flex h-full min-h-[420px]">
          {/* Left content */}
          <div className="flex-1 py-8 md:py-16 relative z-10 flex flex-col justify-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              <span>Your spending,</span>
              <span className="relative flex w-full overflow-hidden md:pb-4 md:pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className="absolute font-bold text-accent"
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: 'spring', stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? { y: 0, opacity: 1 }
                        : { y: titleNumber > index ? -150 : 150, opacity: 0 }
                    }
                  >
                    {title}.
                  </motion.span>
                ))}
              </span>
            </h1>
            <p className="mt-4 text-muted-foreground max-w-lg text-lg leading-relaxed">
              No account required. Drop your credit card CSVs and get a clean
              monthly breakdown in seconds.
            </p>
          </div>

          {/* Right content — 3D scene */}
          <div className="flex-1 relative hidden md:block">
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
