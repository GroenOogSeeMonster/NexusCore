import type { Metadata } from 'next'
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { ParticleBackground } from '@/components/ui/particle-background'
import { SetupWizard } from '@/components/portal/setup-wizard'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
  fallback: ['system-ui', 'arial'],
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
  fallback: ['monospace'],
})

export const metadata: Metadata = {
  title: 'DevForge - Platform Engineering Command Center',
  description: 'The next-generation platform engineering portal that combines AI, 3D visualizations, and seamless integrations.',
  keywords: ['platform engineering', 'developer portal', 'AI', '3D visualization', 'DevOps'],
  authors: [{ name: 'DevForge Team' }],
  viewport: 'width=device-width, initial-scale=1',
  themeColor: '#6B46C1',
  robots: 'index, follow',
  openGraph: {
    title: 'DevForge - Platform Engineering Command Center',
    description: 'The next-generation platform engineering portal that combines AI, 3D visualizations, and seamless integrations.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DevForge - Platform Engineering Command Center',
    description: 'The next-generation platform engineering portal that combines AI, 3D visualizations, and seamless integrations.',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <ParticleBackground />
          <SetupWizard />
          {children}
        </Providers>
      </body>
    </html>
  )
}