import type { Metadata } from 'next'
import { Bebas_Neue, Libre_Baskerville, JetBrains_Mono } from 'next/font/google'
import './globals.css'

const display = Bebas_Neue({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
})

const body = Libre_Baskerville({
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-body',
})

const mono = JetBrains_Mono({
  weight: ['400', '600'],
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: 'BootMail — Letters, Care Packages & Legacy Books for Military Families',
  description: 'Send physical letters, care packages, and build a Legacy Memory Book for your recruit in basic training. Starting at $1.99 per letter — half the cost of Sandboxx.',
  keywords: ['military letters', 'basic training letters', 'boot camp care packages', 'military family', 'recruit letters'],
  openGraph: {
    title: 'BootMail — More Than Mail. It\'s Morale.',
    description: 'Send letters, care packages, and build a Legacy Book for your recruit.',
    url: 'https://bootmail.app',
    siteName: 'BootMail',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BootMail',
    description: 'Letters & care packages for military recruits. Half the price of Sandboxx.',
  },
  metadataBase: new URL('https://bootmail.app'),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body bg-cream text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
