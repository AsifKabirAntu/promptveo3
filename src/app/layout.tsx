import type { Metadata, Viewport } from "next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { AuthProvider } from '@/components/auth/auth-provider'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "PromptVeo3 — Structured JSON Prompts for Veo 3 | Product Reveals, Room Transformations, Timelines",
  description: "Create high‑quality Veo 3 videos with structured JSON prompts. Browse a curated library for product reveals, room transformations, timelines, ads, and more—remix instantly and export perfect JSON.",
  keywords: ["Veo 3", "AI video", "prompts", "structured prompts", "json prompts", "product reveal prompts", "room transformation prompts", "timeline prompts", "video generation"],
  icons: {
    icon: [
      { url: '/favicon.svg?v=2', type: 'image/svg+xml' },
      { url: '/favicon-16x16.png?v=2', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png?v=2', sizes: '32x32', type: 'image/png' },
    ],
    shortcut: '/favicon.svg?v=2',
    apple: [
      { url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'PromptVeo3'
  },
}

export const viewport: Viewport = {
  themeColor: '#A855F7',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        <meta name="msapplication-TileColor" content="#A855F7" />
        <meta name="theme-color" content="#A855F7" />
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
