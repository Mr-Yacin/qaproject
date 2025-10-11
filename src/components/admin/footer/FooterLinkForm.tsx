'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const footerLinkSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be 50 characters or less'),
  url: z.string()
    .min(1, 'URL is required')
    .refine((url) => {
      // Allow full URLs (http/https) or relative paths starting with /
      return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
    }, 'URL must be a full URL (https://...) or a relative path starting with /'),
  order: z.number().int().min(0, 'Order must be 0 or greater'),
});

type FooterLinkFormData = z.infer<typeof footerLinkSchema>;

interface FooterLink {
  id: string;
  columnId: string;
  label: string;
  url: string;
  order: number;
}

interface FooterLinkFormProps {
  link?: FooterLink;
  onSave: (data: Partial<FooterLink>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Footer Link Form Component
 * Form for creating and editing footer links
 * Requirements: 5.3, 5.6
 */
export function FooterLinkForm({ link, onSave, onCancel }: FooterLinkFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FooterLinkFormData>({
    resolver: zodResolver(footerLinkSchema),
    defaultValues: {
      label: link?.label || '',
      url: link?.url || '',
      order: link?.order ?? 0,
    },
  });

  const onSubmit = async (data: FooterLinkFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Failed to save footer link:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="label">
            Link Label <span className="text-red-500">*</span>
          </Label>
          <Input
            id="label"
            {...register('label')}
            placeholder="e.g., About Us, Contact"
            aria-invalid={!!errors.label}
            aria-describedby={errors.label ? 'label-error' : undefined}
          />
          {errors.label && (
            <p id="label-error" role="alert" className="text-sm text-red-600 mt-1">
              {errors.label.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="url">
            URL <span className="text-red-500">*</span>
          </Label>
          <Input
            id="url"
            {...register('url')}
            placeholder="/about or https://example.com/about"
            aria-invalid={!!errors.url}
            aria-describedby={errors.url ? 'url-error' : undefined}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Use relative paths (e.g., /about, /contact) for internal pages or full URLs (https://...) for external links
          </p>
          {errors.url && (
            <p id="url-error" role="alert" className="text-sm text-red-600 mt-1">
              {errors.url.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="order">
            Display Order <span className="text-red-500">*</span>
          </Label>
          <Input
            id="order"
            type="number"
            {...register('order', { valueAsNumber: true })}
            placeholder="0"
            min="0"
            aria-invalid={!!errors.order}
            aria-describedby={errors.order ? 'order-error' : undefined}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Lower numbers appear first (0 = first position)
          </p>
          {errors.order && (
            <p id="order-error" role="alert" className="text-sm text-red-600 mt-1">
              {errors.order.message}
            </p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {link ? 'Update Link' : 'Create Link'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
