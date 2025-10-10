'use client';

import { useEffect, useState } from 'react';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';
import { SettingsForm } from '@/components/admin/settings/SettingsForm';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Settings Management Page
 * Allows administrators to manage site-wide settings
 * Requirements: 2.1, 2.2, 2.3, 2.8
 */
export default function SettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/settings');
      
      if (!response.ok) {
        throw new Error('Failed to fetch settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch settings. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingsUpdate = (updatedSettings: any) => {
    setSettings(updatedSettings);
  };

  return (
    <ClientAuthCheck>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Site Settings</h1>
          <p className="text-muted-foreground mt-1">
            Manage site-wide settings including branding, SEO, and appearance
          </p>
        </div>

        {/* Settings Form */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : settings ? (
          <SettingsForm 
            settings={settings} 
            onUpdate={handleSettingsUpdate}
          />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              Failed to load settings. Please refresh the page.
            </p>
          </div>
        )}
      </div>
    </ClientAuthCheck>
  );
}
