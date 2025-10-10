'use client';

import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';
import { PageForm } from '@/components/admin/pages/PageForm';

/**
 * Create Page Page
 * Form for creating a new custom page
 * Requirements: 3.2
 */
export default function NewPagePage() {
  return (
    <ClientAuthCheck>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Create New Page</h1>
          <p className="text-muted-foreground mt-1">
            Create a new custom page with rich text content
          </p>
        </div>

        {/* Page Form */}
        <PageForm mode="create" />
      </div>
    </ClientAuthCheck>
  );
}
