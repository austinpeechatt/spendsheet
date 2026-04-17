import type { Metadata } from 'next'
import Script from 'next/script'
import { DM_Sans } from 'next/font/google'
import { ShaderBackground } from '@/components/ui/shader-background'
import './globals.css'

const dmSans = DM_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: 'Spendsheet — Your Credit Card Spending, Sorted',
  description: 'Drop your credit card CSVs and get an instant categorized spending report. No signup, no bank connection, no BS.',
  icons: {
    icon: [
      {
        url: '/icon-dark-32x32.png',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background">
      <head>
        <Script
          defer
          data-domain="spendsheet.app"
          src="https://plausible.io/js/script.js"
          strategy="afterInteractive"
        />
      </head>
      <body className={`${dmSans.className} antialiased`}>
        <ShaderBackground />
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  )
}
