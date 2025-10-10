'use client';

import { Card } from '@/components/ui/card';
import { Database, Tag, Info } from 'lucide-react';

interface CacheTag {
  tag: string;
  description: string;
}

interface CacheStatsProps {
  tags: CacheTag[];
  lastCleared: string | null;
  cacheEnabled: boolean;
  note?: string;
}

/**
 * Cache Statistics Component
 * Displays cache information and available tags
 * Requirements: 9.1, 9.5, 9.8
 */
export function CacheStats({ tags, lastCleared, cacheEnabled, note }: CacheStatsProps) {
  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Database className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Cache Status</p>
              <p className="text-2xl font-bold">
                {cacheEnabled ? 'Enabled' : 'Disabled'}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Tag className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Tags</p>
              <p className="text-2xl font-bold">{tags.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Info className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Last Cleared</p>
              <p className="text-lg font-semibold">
                {lastCleared ? new Date(lastCleared).toLocaleString() : 'Never'}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Cache Tags */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Available Cache Tags</h3>
        <div className="space-y-3">
          {tags.map((tagInfo) => (
            <div
              key={tagInfo.tag}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{tagInfo.tag}</p>
                  <p className="text-sm text-muted-foreground">
                    {tagInfo.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Note */}
      {note && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900">{note}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
