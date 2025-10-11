import './globals.css'
import { SettingsService } from '@/lib/services/settings.service'
import type { Metadata } from 'next'
import { unstable_cache } from 'next/cache'

/**
 * Cached settings fetcher
 */
const getCachedSettings = unstable_cache(
  async () => {
    const settingsService = new SettingsService()
    return settingsService.getSettings()
  },
  ['site-settings'],
  {
    tags: ['settings'],
    revalidate: 3600, // Revalidate every hour
  }
)

/**
 * Generate metadata from database settings
 * Requirements: 2.3, 2.4
 */
export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getCachedSettings()

    return {
      title: settings.seoTitle || settings.siteName || 'Q&A Article FAQ API',
      description: settings.seoDescription || 'API-first backend for Q&A content management',
      keywords: settings.seoKeywords?.join(', '),
      icons: settings.faviconUrl ? {
        icon: settings.faviconUrl,
      } : undefined,
    }
  } catch (error) {
    console.error('Failed to fetch settings for metadata:', error)
    // Fallback to default metadata
    return {
      title: 'Q&A Article FAQ API',
      description: 'API-first backend for Q&A content management',
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
