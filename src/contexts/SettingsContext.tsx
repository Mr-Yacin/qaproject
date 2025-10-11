'use client';

import { createContext, useContext, ReactNode } from 'react';

/**
 * Settings Context
 * Provides site-wide settings to client components
 * Requirements: 2.3, 2.4
 */

import type { Prisma } from '@prisma/client';

export interface SiteSettings {
  id: string;
  siteName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string[];
  socialLinks: Prisma.JsonValue;
  customCss: string | null;
  customJs: string | null;
  updatedAt: Date;
  updatedBy: string | null;
}

interface SettingsContextType {
  settings: SiteSettings | null;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
});

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

interface SettingsProviderProps {
  children: ReactNode;
  settings: SiteSettings | null;
}

export function SettingsProvider({ children, settings }: SettingsProviderProps) {
  return (
    <SettingsContext.Provider value={{ settings }}>
      {children}
    </SettingsContext.Provider>
  );
}
