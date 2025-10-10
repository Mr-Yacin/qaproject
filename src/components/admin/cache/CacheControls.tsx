'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui';
import { Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CacheTag {
  tag: string;
  description: string;
}

interface CacheControlsProps {
  tags: CacheTag[];
  onCacheCleared: () => void;
}

/**
 * Cache Controls Component
 * Provides controls to clear cache (all or specific tags)
 * Requirements: 9.2, 9.3, 9.4
 */
export function CacheControls({ tags, onCacheCleared }: CacheControlsProps) {
  const { toast } = useToast();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [clearing, setClearing] = useState(false);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag)
        ? prev.filter((t) => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSelectAll = () => {
    if (selectedTags.length === tags.length) {
      setSelectedTags([]);
    } else {
      setSelectedTags(tags.map((t) => t.tag));
    }
  };

  const handleClearCache = async (clearAll: boolean = false) => {
    const tagsToConfirm = clearAll ? 'all cache tags' : `${selectedTags.length} selected tag(s)`;
    
    if (!confirm(`Are you sure you want to clear ${tagsToConfirm}? This will force regeneration of cached content.`)) {
      return;
    }

    try {
      setClearing(true);

      const response = await fetch('/api/admin/cache/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tags: clearAll ? undefined : selectedTags,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to clear cache');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message || 'Cache cleared successfully',
      });

      // Reset selection
      setSelectedTags([]);

      // Notify parent to refresh stats
      onCacheCleared();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to clear cache',
        variant: 'destructive',
      });
      console.error('Failed to clear cache:', error);
    } finally {
      setClearing(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold">Cache Controls</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Clear cache to force regeneration of content
          </p>
        </div>

        {/* Tag Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Select Tags to Clear</label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedTags.length === tags.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {tags.map((tagInfo) => (
              <div
                key={tagInfo.tag}
                className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg hover:bg-muted cursor-pointer"
                onClick={() => handleToggleTag(tagInfo.tag)}
              >
                <Checkbox
                  id={`tag-${tagInfo.tag}`}
                  checked={selectedTags.includes(tagInfo.tag)}
                  onCheckedChange={() => handleToggleTag(tagInfo.tag)}
                />
                <label
                  htmlFor={`tag-${tagInfo.tag}`}
                  className="flex-1 cursor-pointer"
                >
                  <p className="font-medium">{tagInfo.tag}</p>
                  <p className="text-sm text-muted-foreground">
                    {tagInfo.description}
                  </p>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => handleClearCache(false)}
            disabled={selectedTags.length === 0 || clearing}
            variant="default"
            className="flex-1"
          >
            {clearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Selected ({selectedTags.length})
              </>
            )}
          </Button>

          <Button
            onClick={() => handleClearCache(true)}
            disabled={clearing}
            variant="destructive"
            className="flex-1"
          >
            {clearing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Cache
              </>
            )}
          </Button>
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <p>
            <strong>Note:</strong> Clearing cache will force Next.js to regenerate
            cached pages and data on the next request. This may temporarily impact
            performance until the cache is rebuilt.
          </p>
        </div>
      </div>
    </Card>
  );
}
