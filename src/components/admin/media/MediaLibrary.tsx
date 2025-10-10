'use client';

import { useState, useEffect } from 'react';
import { Media } from '@prisma/client';
import { MediaUploader } from './MediaUploader';
import { MediaDetails } from './MediaDetails';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Image, FileText, Loader2 } from 'lucide-react';

interface PaginatedMedia {
  items: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function MediaLibrary() {
  const [media, setMedia] = useState<PaginatedMedia>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mimeTypeFilter, setMimeTypeFilter] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<Media | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const { toast } = useToast();

  const fetchMedia = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: media.limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (mimeTypeFilter) {
        params.append('mimeType', mimeTypeFilter);
      }

      const response = await fetch(`/api/admin/media?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      setMedia(data);
    } catch (error) {
      console.error('Error fetching media:', error);
      toast({
        title: 'Error',
        description: 'Failed to load media files',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [search, mimeTypeFilter]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchMedia(media.page);
    toast({
      title: 'Success',
      description: 'File uploaded successfully',
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/media/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete media');
      }

      toast({
        title: 'Success',
        description: 'File deleted successfully',
      });

      setSelectedMedia(null);
      fetchMedia(media.page);
    } catch (error) {
      console.error('Error deleting media:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete file',
        variant: 'destructive',
      });
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Media Library</h1>
          <p className="text-gray-600 mt-1">
            Manage your uploaded files and images
          </p>
        </div>
        <Button onClick={() => setShowUploader(true)}>Upload File</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search files..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={mimeTypeFilter}
          onChange={(e) => setMimeTypeFilter(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="">All Types</option>
          <option value="image">Images</option>
          <option value="application">Documents</option>
        </select>
      </div>

      {/* Upload Modal */}
      {showUploader && (
        <MediaUploader
          onClose={() => setShowUploader(false)}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* Media Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : media.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No media files found</p>
          <Button onClick={() => setShowUploader(true)} className="mt-4">
            Upload Your First File
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {media.items.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedMedia(item)}
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  {item.thumbnailUrl ? (
                    <img
                      src={item.thumbnailUrl}
                      alt={item.originalName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      {getFileIcon(item.mimeType)}
                      <span className="text-xs mt-2">
                        {item.mimeType.split('/')[1].toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">
                    {item.originalName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(item.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {media.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => fetchMedia(media.page - 1)}
                disabled={media.page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2">
                Page {media.page} of {media.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => fetchMedia(media.page + 1)}
                disabled={media.page === media.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Media Details Modal */}
      {selectedMedia && (
        <MediaDetails
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
