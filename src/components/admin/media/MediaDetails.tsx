'use client';

import { Media } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { X, Copy, Trash2, ExternalLink } from 'lucide-react';

interface MediaDetailsProps {
  media: Media;
  onClose: () => void;
  onDelete: (id: string) => void;
}

export function MediaDetails({ media, onClose, onDelete }: MediaDetailsProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: 'Copied',
      description: 'URL copied to clipboard',
    });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">File Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6">
          {media.mimeType.startsWith('image/') ? (
            <img
              src={media.url}
              alt={media.originalName}
              className="w-full rounded-lg border"
            />
          ) : (
            <div className="w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <p className="text-gray-500 text-sm">
                  {media.mimeType.split('/')[1].toUpperCase()}
                </p>
                <p className="text-gray-400 text-xs mt-1">No preview available</p>
              </div>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">
              File Name
            </label>
            <p className="mt-1 text-gray-900">{media.originalName}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              File Type
            </label>
            <p className="mt-1 text-gray-900">{media.mimeType}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              File Size
            </label>
            <p className="mt-1 text-gray-900">{formatFileSize(media.size)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">
              Uploaded
            </label>
            <p className="mt-1 text-gray-900">{formatDate(media.createdAt)}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">URL</label>
            <div className="mt-1 flex gap-2">
              <input
                type="text"
                value={`${window.location.origin}${media.url}`}
                readOnly
                className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  copyToClipboard(`${window.location.origin}${media.url}`)
                }
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {media.thumbnailUrl && (
            <div>
              <label className="text-sm font-medium text-gray-700">
                Thumbnail URL
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={`${window.location.origin}${media.thumbnailUrl}`}
                  readOnly
                  className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(
                      `${window.location.origin}${media.thumbnailUrl}`
                    )
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => window.open(media.url, '_blank')}
            className="flex-1"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in New Tab
          </Button>
          <Button
            variant="destructive"
            onClick={() => onDelete(media.id)}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
