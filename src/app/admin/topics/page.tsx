'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getTopics } from '@/lib/api/topics';
import { UnifiedTopic } from '@/types/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { createOrUpdateTopic, revalidateTopicCache } from '@/lib/api/ingest';
import { useToast } from '@/hooks/use-toast';

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
      // Note: API limit is max 100, so we fetch the maximum allowed
      const response = await getTopics({ limit: 100 });
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
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!topicToDelete) return;

    try {
      setDeleting(true);

      // Delete by sending an ingest payload with empty/null values
      // This is a workaround since there's no dedicated delete endpoint
      await createOrUpdateTopic({
        topic: {
          slug: topicToDelete.topic.slug,
          title: topicToDelete.topic.title,
          locale: topicToDelete.topic.locale,
          tags: [],
        },
        mainQuestion: {
          text: '',
        },
        article: {
          content: '',
          status: 'DRAFT',
        },
        faqItems: [],
      });

      // Show loading toast for revalidation
      toast({
        title: 'Revalidating cache...',
        description: 'Updating cached content',
      });

      // Revalidate cache for 'topics' tag and specific 'topic:[slug]' tag
      await revalidateTopicCache(topicToDelete.topic.slug);

      toast({
        title: 'Success',
        description: 'Topic deleted and cache revalidated successfully.',
      });

      // Refresh topics list
      await fetchTopics();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete topic. Please try again.',
        variant: 'destructive',
      });
      console.error('Failed to delete topic:', error);
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setTopicToDelete(null);
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
    </div>
    </ClientAuthCheck>
  );
}
