// app/layout.tsx

import '../styles/globals.css'
import { Roboto } from 'next/font/google'
import type { Metadata } from 'next'
import styles from '@/styles/Layout.module.css';

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
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#407ebe" />
        <link rel="icon" href="/logo-192.png" />
      </head>
      <body className={styles.body}>{children}</body>
    </html>
  )
}
