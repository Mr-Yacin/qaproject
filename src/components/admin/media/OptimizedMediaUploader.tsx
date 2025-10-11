'use client';

import { useState, useCallback } from 'react';
import { compressImage, generateThumbnail, validateImageFile } from '@/lib/utils/image-optimization';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';

interface UploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'complete' | 'error';
  error?: string;
}

interface OptimizedMediaUploaderProps {
  onUploadComplete?: (urls: string[]) => void;
  maxFiles?: number;
  autoCompress?: boolean;
  generateThumbnails?: boolean;
}

/**
 * Optimized media uploader with compression and progress tracking
 * Requirements: 6.2, 6.3 - Performance optimization
 */
export function OptimizedMediaUploader({
  onUploadComplete,
  maxFiles = 10,
  autoCompress = true,
  generateThumbnails = true,
}: OptimizedMediaUploaderProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const { toast } = useToast();

  const updateUploadProgress = useCallback(
    (index: number, updates: Partial<UploadProgress>) => {
      setUploads((prev) =>
        prev.map((upload, i) => (i === index ? { ...upload, ...updates } : upload))
      );
    },
    []
  );

  const processFile = useCallback(
    async (file: File, index: number) => {
      try {
        // Validate file
        updateUploadProgress(index, { status: 'pending' });
        const validation = await validateImageFile(file);

        if (!validation.valid) {
          updateUploadProgress(index, {
            status: 'error',
            error: validation.error,
          });
          return;
        }

        // Compress image if enabled
        let processedFile = file;
        if (autoCompress && file.type.startsWith('image/')) {
          updateUploadProgress(index, { status: 'compressing', progress: 25 });
          processedFile = await compressImage(file, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.85,
          });
        }

        // Generate thumbnail if enabled
        let thumbnailFile: File | undefined;
        if (generateThumbnails && file.type.startsWith('image/')) {
          updateUploadProgress(index, { progress: 50 });
          thumbnailFile = await generateThumbnail(processedFile, {
            width: 200,
            height: 200,
            quality: 0.7,
          });
        }

        // Upload file
        updateUploadProgress(index, { status: 'uploading', progress: 75 });

        const formData = new FormData();
        formData.append('file', processedFile);
        if (thumbnailFile) {
          formData.append('thumbnail', thumbnailFile);
        }

        const response = await fetch('/api/admin/media', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        const data = await response.json();

        updateUploadProgress(index, {
          status: 'complete',
          progress: 100,
        });

        return data.url;
      } catch (error) {
        updateUploadProgress(index, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Upload failed',
        });
        return null;
      }
    },
    [autoCompress, generateThumbnails, updateUploadProgress]
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files).slice(0, maxFiles);

      if (fileArray.length === 0) return;

      // Initialize upload progress
      const initialUploads: UploadProgress[] = fileArray.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }));

      setUploads(initialUploads);

      // Process files
      const uploadPromises = fileArray.map((file, index) => processFile(file, index));
      const urls = await Promise.all(uploadPromises);

      // Filter successful uploads
      const successfulUrls = urls.filter((url): url is string => url !== null);

      if (successfulUrls.length > 0) {
        toast({
          title: 'Upload complete',
          description: `Successfully uploaded ${successfulUrls.length} file(s)`,
        });
        onUploadComplete?.(successfulUrls);
      }

      if (successfulUrls.length < fileArray.length) {
        toast({
          title: 'Some uploads failed',
          description: `${fileArray.length - successfulUrls.length} file(s) failed to upload`,
          variant: 'destructive',
        });
      }
    },
    [maxFiles, processFile, onUploadComplete, toast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          multiple
          accept="image/*"
          onChange={handleFileInput}
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="space-y-2">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              <span className="font-medium text-blue-600 hover:text-blue-500">
                Click to upload
              </span>{' '}
              or drag and drop
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG, GIF, WebP up to 10MB
              {autoCompress && ' (images will be automatically compressed)'}
            </p>
          </div>
        </label>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Uploads</h3>
          {uploads.map((upload, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="truncate flex-1">{upload.file.name}</span>
                <span
                  className={`ml-2 ${
                    upload.status === 'error'
                      ? 'text-red-600'
                      : upload.status === 'complete'
                      ? 'text-green-600'
                      : 'text-gray-600'
                  }`}
                >
                  {upload.status === 'compressing' && 'Compressing...'}
                  {upload.status === 'uploading' && 'Uploading...'}
                  {upload.status === 'complete' && 'Complete'}
                  {upload.status === 'error' && 'Failed'}
                  {upload.status === 'pending' && 'Pending...'}
                </span>
              </div>
              <Progress value={upload.progress} className="h-2" />
              {upload.error && (
                <p className="text-xs text-red-600">{upload.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
