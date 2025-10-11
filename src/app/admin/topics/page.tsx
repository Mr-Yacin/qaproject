'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminTopics } from '@/lib/api/topics';
import { UnifiedTopic } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import { ClientAuthCheck } from '@/components/admin/ClientAuthCheck';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteTopic } from '@/lib/api/ingest';
import { useToast } from '@/hooks/use-toast';
import { BulkSelector } from '@/components/admin/bulk/BulkSelector';
import { BulkActions, BulkAction } from '@/components/admin/bulk/BulkActions';
import { BulkProgress } from '@/components/admin/bulk/BulkProgress';

/**
 * Topics Management Page
 * Displays all topics in a table with search, filter, and CRUD operations
 * Requirements: 4.1, 4.2, 4.6, 4.7, 8.7, 8.8
 */
export default function TopicsManagementPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [topics, setTopics] = useState<UnifiedTopic[]>([]);
  const [filteredTopics, setFilteredTopics] = useState<UnifiedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocale, setSelectedLocale] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState<UnifiedTopic | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteImpact, setDeleteImpact] = useState<{
    questions: number;
    articles: number;
    faqItems: number;
  } | null>(null);

  // Bulk operations state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction | null>(null);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ success: 0, failed: 0, total: 0 });
  const [bulkStatusValue, setBulkStatusValue] = useState<'DRAFT' | 'PUBLISHED'>('PUBLISHED');
  const [bulkTagsValue, setBulkTagsValue] = useState('');
  const [importFile, setImportFile] = useState<File | null>(null);

  // Fetch topics on mount
  useEffect(() => {
    fetchTopics();
  }, []);

  // Filter topics when search or filters change
  useEffect(() => {
    filterTopics();
  }, [searchQuery, selectedLocale, selectedTag, topics]);

  const fetchTopics = async () => {
    try {
      setLoading(true);
      // Use admin API to fetch all topics including drafts
      const response = await getAdminTopics({ limit: 100 });
      setTopics(response.items);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch topics. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to fetch topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTopics = () => {
    let filtered = [...topics];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.topic.title.toLowerCase().includes(query) ||
          item.topic.slug.toLowerCase().includes(query) ||
          item.topic.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Filter by locale
    if (selectedLocale !== 'all') {
      filtered = filtered.filter((item) => item.topic.locale === selectedLocale);
    }

    // Filter by tag
    if (selectedTag !== 'all') {
      filtered = filtered.filter((item) => item.topic.tags.includes(selectedTag));
    }

    setFilteredTopics(filtered);
  };

  const handleDeleteClick = (topic: UnifiedTopic) => {
    setTopicToDelete(topic);
    // Calculate impact summary
    setDeleteImpact({
      questions: topic.primaryQuestion ? 1 : 0,
      articles: topic.article ? 1 : 0,
      faqItems: topic.faqItems.length,
    });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!topicToDelete) return;

    try {
      setDeleting(true);

      // Delete the topic using the new API
      const result = await deleteTopic(topicToDelete.topic.slug);

      toast({
        title: 'Success',
        description: result.message || 'Topic deleted successfully',
      });

      // Refresh topics list
      await fetchTopics();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete topic',
        variant: 'destructive',
      });
      console.error('Failed to delete topic:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTopicToDelete(null);
      setDeleteImpact(null);
    }
  };

  // Get unique locales and tags for filters
  const uniqueLocales = Array.from(new Set(topics.map((item) => item.topic.locale)));
  const uniqueTags = Array.from(
    new Set(topics.flatMap((item) => item.topic.tags))
  ).sort();

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Bulk selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTopics.map((item) => item.topic.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Bulk action handler
  const handleBulkAction = (action: BulkAction) => {
    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  // Execute bulk operation
  const executeBulkOperation = async () => {
    if (!bulkAction) return;

    try {
      setBulkProcessing(true);
      setBulkProgress({ success: 0, failed: 0, total: selectedIds.length });

      let response;

      switch (bulkAction) {
        case 'delete':
          response = await fetch('/api/admin/topics/bulk-delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicIds: selectedIds }),
          });
          break;

        case 'update-status':
          response = await fetch('/api/admin/topics/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topicIds: selectedIds,
              updates: { status: bulkStatusValue },
            }),
          });
          break;

        case 'add-tags':
          const tagsToAdd = bulkTagsValue.split(',').map((t) => t.trim()).filter(Boolean);
          response = await fetch('/api/admin/topics/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topicIds: selectedIds,
              updates: { tags: { add: tagsToAdd } },
            }),
          });
          break;

        case 'remove-tags':
          const tagsToRemove = bulkTagsValue.split(',').map((t) => t.trim()).filter(Boolean);
          response = await fetch('/api/admin/topics/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topicIds: selectedIds,
              updates: { tags: { remove: tagsToRemove } },
            }),
          });
          break;

        case 'export':
          response = await fetch('/api/admin/topics/export', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topicIds: selectedIds }),
          });
          if (response.ok) {
            const data = await response.json();
            const blob = new Blob([JSON.stringify(data.topics, null, 2)], {
              type: 'application/json',
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `topics-export-${new Date().toISOString()}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }
          break;

        case 'import':
          if (!importFile) {
            toast({
              title: 'Error',
              description: 'Please select a file to import',
              variant: 'destructive',
            });
            return;
          }
          const fileContent = await importFile.text();
          const importData = JSON.parse(fileContent);
          response = await fetch('/api/admin/topics/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topics: importData,
              mode: 'upsert',
            }),
          });
          break;
      }

      if (response && response.ok) {
        const result = await response.json();
        setBulkProgress({
          success: result.success || selectedIds.length,
          failed: result.failed || 0,
          total: selectedIds.length,
        });

        toast({
          title: 'Success',
          description: `Bulk ${bulkAction} completed successfully`,
        });

        // Refresh topics list
        await fetchTopics();
        setSelectedIds([]);
      } else {
        throw new Error('Bulk operation failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to execute bulk ${bulkAction}`,
        variant: 'destructive',
      });
      console.error('Bulk operation error:', error);
    } finally {
      setBulkProcessing(false);
      setTimeout(() => {
        setBulkDialogOpen(false);
        setBulkAction(null);
        setBulkProgress({ success: 0, failed: 0, total: 0 });
      }, 2000);
    }
  };

  const bulkSelector = BulkSelector({
    selectedIds,
    allIds: filteredTopics.map((item) => item.topic.id),
    onSelectAll: handleSelectAll,
    onSelectOne: handleSelectOne,
  });

  return (
    <ClientAuthCheck>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Topics Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage all topics, articles, and FAQ items
          </p>
        </div>
        <Link href="/admin/topics/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create New Topic
          </Button>
        </Link>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 border rounded-lg bg-muted/50">
          <BulkActions
            selectedCount={selectedIds.length}
            onAction={handleBulkAction}
            disabled={bulkProcessing}
          />
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, slug, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={selectedLocale}
          onChange={(e) => setSelectedLocale(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Locales</option>
          {uniqueLocales.map((locale) => (
            <option key={locale} value={locale}>
              {locale.toUpperCase()}
            </option>
          ))}
        </select>
        <select
          value={selectedTag}
          onChange={(e) => setSelectedTag(e.target.value)}
          className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="all">All Tags</option>
          {uniqueTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      {/* Topics Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTopics.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <p className="text-muted-foreground">
            {searchQuery || selectedLocale !== 'all' || selectedTag !== 'all'
              ? 'No topics found matching your filters.'
              : 'No topics yet. Create your first topic to get started.'}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-12 p-4">
                    <bulkSelector.HeaderCheckbox />
                  </th>
                  <th className="text-left p-4 font-medium">Thumbnail</th>
                  <th className="text-left p-4 font-medium">Title</th>
                  <th className="text-left p-4 font-medium">Slug</th>
                  <th className="text-left p-4 font-medium">Locale</th>
                  <th className="text-left p-4 font-medium">Tags</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Updated</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTopics.map((item) => (
                  <tr
                    key={item.topic.id}
                    className="border-t hover:bg-muted/50 transition-all duration-200"
                  >
                    <td className="p-4">
                      <bulkSelector.RowCheckbox id={item.topic.id} />
                    </td>
                    <td className="p-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                        {(item.topic as any).thumbnailUrl ? (
                          <img
                            src={(item.topic as any).thumbnailUrl}
                            alt={item.topic.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Search className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-medium">{item.topic.title}</td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {item.topic.slug}
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
                        {item.topic.locale.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {item.topic.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                        {item.topic.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 text-xs text-muted-foreground">
                            +{item.topic.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${
                          item.article?.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {item.article?.status || 'DRAFT'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(item.topic.updatedAt)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/topics/${item.topic.slug}/edit`}>
                          <Button variant="ghost" size="sm" className="transition-all duration-200 hover:scale-110">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(item)}
                          className="transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Results count */}
      {!loading && filteredTopics.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {filteredTopics.length} of {topics.length} topics
        </p>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Topic</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{topicToDelete?.topic.title}&quot;?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {/* Impact Summary */}
          {deleteImpact && (
            <div className="my-4 p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2 text-sm">Impact Summary</h4>
              <p className="text-sm text-muted-foreground mb-2">
                The following records will be permanently deleted:
              </p>
              <ul className="space-y-1 text-sm">
                <li className="flex items-center gap-2">
                  <span className="font-medium">Questions:</span>
                  <span className="text-muted-foreground">{deleteImpact.questions}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">Articles:</span>
                  <span className="text-muted-foreground">{deleteImpact.articles}</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="font-medium">FAQ Items:</span>
                  <span className="text-muted-foreground">{deleteImpact.faqItems}</span>
                </li>
              </ul>
              <p className="text-sm text-destructive font-medium mt-3">
                Total: {deleteImpact.questions + deleteImpact.articles + deleteImpact.faqItems + 1} records
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Operation Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {bulkAction === 'delete' && 'Bulk Delete Topics'}
              {bulkAction === 'update-status' && 'Update Status'}
              {bulkAction === 'add-tags' && 'Add Tags'}
              {bulkAction === 'remove-tags' && 'Remove Tags'}
              {bulkAction === 'export' && 'Export Topics'}
              {bulkAction === 'import' && 'Import Topics'}
            </DialogTitle>
            <DialogDescription>
              {bulkAction === 'delete' &&
                `Are you sure you want to delete ${selectedIds.length} topics? This action cannot be undone.`}
              {bulkAction === 'update-status' &&
                `Update the status of ${selectedIds.length} topics.`}
              {bulkAction === 'add-tags' &&
                `Add tags to ${selectedIds.length} topics.`}
              {bulkAction === 'remove-tags' &&
                `Remove tags from ${selectedIds.length} topics.`}
              {bulkAction === 'export' &&
                `Export ${selectedIds.length} topics as JSON.`}
              {bulkAction === 'import' &&
                'Import topics from a JSON file.'}
            </DialogDescription>
          </DialogHeader>

          {bulkProcessing && (
            <BulkProgress
              operation={bulkAction || 'operation'}
              total={bulkProgress.total}
              success={bulkProgress.success}
              failed={bulkProgress.failed}
              inProgress={bulkProcessing}
            />
          )}

          {!bulkProcessing && (
            <div className="space-y-4">
              {bulkAction === 'update-status' && (
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={bulkStatusValue}
                    onChange={(e) => setBulkStatusValue(e.target.value as 'DRAFT' | 'PUBLISHED')}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                  </select>
                </div>
              )}

              {(bulkAction === 'add-tags' || bulkAction === 'remove-tags') && (
                <div className="space-y-2">
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input
                    id="tags"
                    value={bulkTagsValue}
                    onChange={(e) => setBulkTagsValue(e.target.value)}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>
              )}

              {bulkAction === 'import' && (
                <div className="space-y-2">
                  <Label htmlFor="file">JSON File</Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".json"
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDialogOpen(false)}
              disabled={bulkProcessing}
            >
              Cancel
            </Button>
            <Button
              variant={bulkAction === 'delete' ? 'destructive' : 'default'}
              onClick={executeBulkOperation}
              disabled={bulkProcessing}
            >
              {bulkProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </ClientAuthCheck>
  );
}
