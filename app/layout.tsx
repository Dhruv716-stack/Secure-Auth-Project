import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { SessionBatcher } from '@/components/SessionBatcher';
import { TransactionEventProvider } from '@/contexts/TransactionEventContext';

export const metadata: Metadata = {
  title: 'canhack App',
  description: 'Created with canhack',
  generator: 'canhack.dev',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <TransactionEventProvider>
            <SessionBatcher />
            {children}
          </TransactionEventProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
