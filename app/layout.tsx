import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { ToastProvider } from '@/components/ui/Toast'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Trip Ops',
  description: 'Team offsite trip management',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className={`${geist.className} h-full bg-gray-50 text-gray-900 antialiased`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
