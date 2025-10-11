'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react';

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  icon?: 'warning' | 'delete' | 'success';
}

/**
 * Confirmation Dialog Component
 * Reusable confirmation dialog with customizable content and actions
 */
export function ConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  icon = 'warning',
}: ConfirmationDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'delete':
        return <Trash2 className="h-6 w-6 text-destructive" />;
      case 'success':
        return <CheckCircle2 className="h-6 w-6 text-green-600" />;
      case 'warning':
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {getIcon()}
            <AlertDialogTitle>{title}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isConfirming}
            className={variant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {isConfirming ? 'Processing...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Hook for using confirmation dialog
 */
export function useConfirmationDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>>({
    onConfirm: () => {},
    title: '',
    description: '',
  });

  const confirm = (newConfig: Omit<ConfirmationDialogProps, 'open' | 'onOpenChange'>) => {
    setConfig(newConfig);
    setIsOpen(true);
  };

  const dialog = (
    <ConfirmationDialog
      open={isOpen}
      onOpenChange={setIsOpen}
      {...config}
    />
  );

  return { confirm, dialog };
}
