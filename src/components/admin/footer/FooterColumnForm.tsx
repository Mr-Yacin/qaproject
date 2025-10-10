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

const footerColumnSchema = z.object({
  title: z.string().min(1, 'Title is required').max(50, 'Title must be 50 characters or less'),
  order: z.number().int().min(0, 'Order must be 0 or greater'),
});

type FooterColumnFormData = z.infer<typeof footerColumnSchema>;

interface FooterColumn {
  id: string;
  title: string;
  order: number;
}

interface FooterColumnFormProps {
  column?: FooterColumn;
  onSave: (data: Partial<FooterColumn>) => Promise<void>;
  onCancel: () => void;
}

/**
 * Footer Column Form Component
 * Form for creating and editing footer columns
 * Requirements: 5.2, 5.6
 */
export function FooterColumnForm({ column, onSave, onCancel }: FooterColumnFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FooterColumnFormData>({
    resolver: zodResolver(footerColumnSchema),
    defaultValues: {
      title: column?.title || '',
      order: column?.order ?? 0,
    },
  });

  const onSubmit = async (data: FooterColumnFormData) => {
    setIsSubmitting(true);
    try {
      await onSave(data);
    } catch (error) {
      // Error handling is done in parent component
      console.error('Failed to save footer column:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="title">
            Column Title <span className="text-red-500">*</span>
          </Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="e.g., Quick Links, Resources"
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? 'title-error' : undefined}
          />
          {errors.title && (
            <p id="title-error" role="alert" className="text-sm text-red-600 mt-1">
              {errors.title.message}
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
            {column ? 'Update Column' : 'Create Column'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
