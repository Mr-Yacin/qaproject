'use client';

import { useState, useEffect } from 'react';
import { Loader2, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CacheStats } from './CacheStats';
import { CacheControls } from './CacheControls';

interface CacheTag {
  tag: string;
  description: string;
}

interface CacheStatsData {
  tags: CacheTag[];
  lastCleared: string | null;
  cacheEnabled: boolean;
  note?: string;
}

/**
 * Cache Management Component
 * Main component that fetches and displays cache statistics and controls
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.8
 */
export function CacheManagement() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CacheStatsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/cache/stats');

      if (!response.ok) {
        throw new Error('Failed to fetch cache statistics');
      }

      const data = await response.json();
      setStats(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch cache statistics',
        variant: 'destructive',
      });
      console.error('Failed to fetch cache stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleCacheCleared = () => {
    // Refresh stats after cache is cleared
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <Database className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Failed to load cache statistics</h3>
        <p className="text-muted-foreground mt-2">
          Please try refreshing the page
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Cache Management</h1>
        <p className="text-muted-foreground mt-1">
          View cache statistics and clear cached content
        </p>
      </div>

      {/* Statistics */}
      <CacheStats
        tags={stats.tags}
        lastCleared={stats.lastCleared}
        cacheEnabled={stats.cacheEnabled}
        note={stats.note}
      />

      {/* Controls */}
      <CacheControls
        tags={stats.tags}
        onCacheCleared={handleCacheCleared}
      />
    </div>
  );
}
