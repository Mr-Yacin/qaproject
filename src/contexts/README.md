# Settings Context

The Settings Context provides site-wide settings to client components throughout the application.

## Usage

### In Client Components

```tsx
'use client';

import { useSettings } from '@/contexts/SettingsContext';

export default function MyComponent() {
  const { settings } = useSettings();

  if (!settings) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{settings.siteName}</h1>
      {settings.logoUrl && (
        <img src={settings.logoUrl} alt={`${settings.siteName} logo`} />
      )}
    </div>
  );
}
```

### Available Settings

- `siteName`: Site name
- `logoUrl`: Logo image URL
- `faviconUrl`: Favicon URL
- `seoTitle`: Default SEO title
- `seoDescription`: Default SEO description
- `seoKeywords`: Array of SEO keywords
- `socialLinks`: Social media links (JSON object)
- `customCss`: Custom CSS
- `customJs`: Custom JavaScript

## Server Components

Server components can fetch settings directly using the `SettingsService`:

```tsx
import { SettingsService } from '@/lib/services/settings.service';
import { unstable_cache } from 'next/cache';

const getCachedSettings = unstable_cache(
  async () => {
    const settingsService = new SettingsService();
    return settingsService.getSettings();
  },
  ['settings-key'],
  {
    tags: ['settings'],
    revalidate: 3600,
  }
);

export default async function MyServerComponent() {
  const settings = await getCachedSettings();
  
  return <div>{settings.siteName}</div>;
}
```

## Cache Revalidation

Settings are cached with the `settings` tag. When settings are updated via the admin API, the cache is automatically revalidated using `revalidateTag('settings')`.
