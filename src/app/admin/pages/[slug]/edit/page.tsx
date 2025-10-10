'use client';

import { useEffect, useState } from 'react';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';
import { PageForm } from '@/components/admin/pages/PageForm';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

/**
 * Edit Page Page
 * Form for editing an existing custom page
 * Requirements: 3.3
 */
export default function EditPagePage({ params }: { params: { slug: string } }) {
  const { toast } = useToast();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPage();
  }, [params.slug]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/pages/${params.slug}`);

      if (!response.ok) {
        throw new Error('Failed to fetch page');
      }

      const data = await response.json();
      setPage(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch page. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to fetch page:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ClientAuthCheck>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Edit Page</h1>
          <p className="text-muted-foreground mt-1">
            Update page content and settings
          </p>
        </div>

        {/* Page Form */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : page ? (
          <PageForm page={page} mode="edit" />
        ) : (
          <div className="text-center py-12 border rounded-lg">
            <p className="text-muted-foreground">
              Failed to load page. Please refresh the page.
            </p>
          </div>
        )}
      </div>
    </ClientAuthCheck>
  );
}
