'use client';

import { Progress } from '@/components/ui/progress';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface BulkProgressProps {
  operation: string;
  total: number;
  success: number;
  failed: number;
  inProgress: boolean;
}

/**
 * BulkProgress Component
 * Shows progress and results of bulk operations
 * Requirements: 10.5, 10.6
 */
export function BulkProgress({
  operation,
  total,
  success,
  failed,
  inProgress,
}: BulkProgressProps) {
  const completed = success + failed;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  return (
    <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {inProgress ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : completed === total ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : null}
          <span className="font-medium">{operation}</span>
        </div>
        <span className="text-sm text-muted-foreground">
          {completed} / {total}
        </span>
      </div>

      <Progress value={progress} className="h-2" />

      <div className="flex items-center gap-4 text-sm">
        {success > 0 && (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{success} successful</span>
          </div>
        )}
        {failed > 0 && (
          <div className="flex items-center gap-1 text-destructive">
            <XCircle className="h-4 w-4" />
            <span>{failed} failed</span>
          </div>
        )}
      </div>
    </div>
  );
}
