// app/layout.tsx

import '../styles/globals.css'
import { Roboto } from 'next/font/google'
import type { Metadata } from 'next'

const roboto = Roboto({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-roboto',
})

export const metadata: Metadata = {
  title: 'AutoRemise',
  description: 'Générateur de remises bancaires depuis un fichier Excel',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={roboto.className}>
      <body>{children}</body>
    </html>
  )
}
