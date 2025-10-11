'use client';

import { useState, useEffect } from 'react';
import { Media } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Image, FileText, Loader2, Upload, X } from 'lucide-react';
import { MediaUploader } from './MediaUploader';

interface PaginatedMedia {
  items: Media[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface MediaPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (media: Media) => void;
  selectedMediaId?: string;
  title?: string;
  allowedTypes?: string[]; // e.g., ['image/jpeg', 'image/png'] or ['image'] for all images
}

export function MediaPicker({
  isOpen,
  onClose,
  onSelect,
  selectedMediaId,
  title = 'Select Media',
  allowedTypes = ['image'], // Default to images only
}: MediaPickerProps) {
  const [media, setMedia] = useState<PaginatedMedia>({
    items: [],
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
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

      // Filter by allowed types
      if (allowedTypes.length > 0) {
        // If allowedTypes contains generic types like 'image', convert to specific MIME types
        const mimeTypes = allowedTypes.flatMap(type => {
          if (type === 'image') {
            return ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          } else if (type === 'document') {
            return ['application/pdf'];
          }
          return [type];
        });
        
        // For now, we'll filter on the frontend since the API might not support multiple MIME types
        // In a production app, you'd want to enhance the API to support this
      }

      const response = await fetch(`/api/admin/media?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch media');
      }

      const data = await response.json();
      
      // Filter by allowed types on frontend
      if (allowedTypes.length > 0) {
        const filteredItems = data.items.filter((item: Media) => {
          return allowedTypes.some(type => {
            if (type === 'image') {
              return item.mimeType.startsWith('image/');
            } else if (type === 'document') {
              return item.mimeType === 'application/pdf';
            }
            return item.mimeType === type;
          });
        });
        data.items = filteredItems;
        data.total = filteredItems.length;
      }
      
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
    if (isOpen) {
      fetchMedia();
    }
  }, [isOpen, search]);

  useEffect(() => {
    if (selectedMediaId && media.items.length > 0) {
      const found = media.items.find(item => item.id === selectedMediaId);
      if (found) {
        setSelectedMedia(found);
      }
    }
  }, [selectedMediaId, media.items]);

  const handleUploadComplete = () => {
    setShowUploader(false);
    fetchMedia(media.page);
    toast({
      title: 'Success',
      description: 'File uploaded successfully',
    });
  };

  const handleSelect = () => {
    if (selectedMedia) {
      onSelect(selectedMedia);
      onClose();
    }
  };

  const handleMediaClick = (mediaItem: Media) => {
    setSelectedMedia(mediaItem);
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {title}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(true)}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload New
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Upload Modal */}
        {showUploader && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Upload File</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowUploader(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <MediaUploader
                onClose={() => setShowUploader(false)}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Media Grid */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : media.items.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No media files found</p>
                <Button onClick={() => setShowUploader(true)}>
                  Upload Your First File
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.items.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedMedia?.id === item.id
                        ? 'ring-2 ring-blue-500 border-blue-500'
                        : 'hover:shadow-lg border-gray-200'
                    }`}
                    onClick={() => handleMediaClick(item)}
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
                      <p className="text-sm font-medium truncate" title={item.originalName}>
                        {item.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(item.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {media.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMedia(media.page - 1)}
                disabled={media.page === 1}
              >
                Previous
              </Button>
              <span className="px-4 py-2 text-sm">
                Page {media.page} of {media.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMedia(media.page + 1)}
                disabled={media.page === media.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Selected Media Preview */}
        {selectedMedia && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                {selectedMedia.thumbnailUrl ? (
                  <img
                    src={selectedMedia.thumbnailUrl}
                    alt={selectedMedia.originalName}
                    className="w-full h-full object-cover rounded"
                  />
                ) : (
                  getFileIcon(selectedMedia.mimeType)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{selectedMedia.originalName}</p>
                <p className="text-sm text-gray-500">
                  {selectedMedia.mimeType} • {formatFileSize(selectedMedia.size)}
                </p>
                <p className="text-xs text-gray-400">
                  Uploaded {new Date(selectedMedia.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSelect} disabled={!selectedMedia}>
            Select
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}