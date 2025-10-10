'use client';

import { useEffect, useState } from 'react';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';
import { PageList } from '@/components/admin/pages/PageList';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Pages Management Page
 * Lists all custom pages with search and filtering
 * Requirements: 3.1
 */
export default function PagesPage() {
  const { toast } = useToast();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/pages');

      if (!response.ok) {
        throw new Error('Failed to fetch pages');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch pages. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to fetch pages:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientAuthCheck>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Pages</h1>
          <p className="text-muted-foreground mt-1">
            Manage custom pages like About Us, Contact, Privacy Policy, etc.
          </p>
        </div>

        {/* Pages List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data ? (
          <PageList
            initialPages={data.pages}
            initialTotal={data.total}
            initialPage={data.page}
            initialLimit={data.limit}
          />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              Failed to load pages. Please refresh the page.
            </p>
          </div>
        )}
      </div>
    </ClientAuthCheck>
  );
}
