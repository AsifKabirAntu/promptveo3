import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "PromptVeo3 - Cinematic Prompts for Veo 3",
  description: "Browse, remix, and export professional-grade cinematic prompts for Veo 3. Create stunning videos with structured JSON prompts.",
  keywords: ["Veo 3", "AI video", "prompts", "cinematic", "video generation"],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' }
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PromptVeo3'
  },
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body suppressHydrationWarning={true} className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </body>
    </html>
  )
}
