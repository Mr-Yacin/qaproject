'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Loader2, Save, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'EDITOR' | 'VIEWER';
  isActive: boolean;
}

interface UserFormProps {
  user?: User | null;
  mode: 'create' | 'edit';
  onClose: () => void;
  currentUserId: string;
}

/**
 * User Form Component
 * Form for creating and editing users with role selector and password strength indicator
 * Requirements: 7.1, 7.2, 7.8
 */
export function UserForm({ user, mode, onClose, currentUserId }: UserFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    name: user?.name || '',
    role: user?.role || 'VIEWER',
    isActive: user?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const getPasswordStrength = (password: string): {
    strength: number;
    label: string;
    color: string;
  } => {
    if (!password) {
      return { strength: 0, label: '', color: '' };
    }

    let strength = 0;

    // Length check
    if (password.length >= 8) strength += 1;
    if (password.length >= 12) strength += 1;

    // Character variety checks
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 1;

    // Normalize to 0-4 scale
    const normalizedStrength = Math.min(Math.floor(strength / 1.5), 4);

    const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
    const colors = [
      '',
      'bg-red-500',
      'bg-orange-500',
      'bg-yellow-500',
      'bg-green-500',
    ];

    return {
      strength: normalizedStrength,
      label: labels[normalizedStrength],
      color: colors[normalizedStrength],
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required';
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Name must be 100 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);

      // Prepare data for API
      const submitData: any = {
        email: formData.email,
        name: formData.name,
        role: formData.role,
        isActive: formData.isActive,
      };

      // Only include password if it's provided
      if (formData.password) {
        submitData.password = formData.password;
      }

      const url = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${user?.id}`;
      const method = mode === 'create' ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `Failed to ${mode} user`);
      }

      toast({
        title: 'Success',
        description: `User ${mode === 'create' ? 'created' : 'updated'} successfully`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : `Failed to ${mode} user`,
        variant: 'destructive',
      });
      console.error(`Failed to ${mode} user:`, error);
    } finally {
      setSaving(false);
    }
  };

  const isEditingSelf = mode === 'edit' && user?.id === currentUserId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>
          <h1 className="text-3xl font-bold mt-2">
            {mode === 'create' ? 'Create User' : 'Edit User'}
          </h1>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save User
            </>
          )}
        </Button>
      </div>

      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="John Doe"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email <span className="text-destructive">*</span>
            </label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="john@example.com"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password {mode === 'create' && <span className="text-destructive">*</span>}
              {mode === 'edit' && (
                <span className="text-muted-foreground text-xs ml-2">
                  (leave empty to keep current password)
                </span>
              )}
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder={mode === 'create' ? 'Enter password' : 'Enter new password'}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password}</p>
            )}

            {/* Password Strength Indicator */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${(passwordStrength.strength / 4) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground min-w-[50px]">
                    {passwordStrength.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Use at least 8 characters with a mix of letters, numbers, and symbols
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Role and Status */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Role and Status</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium mb-2">
              Role <span className="text-destructive">*</span>
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={isEditingSelf}
            >
              <option value="ADMIN">Admin - Full access to all features</option>
              <option value="EDITOR">Editor - Content management access</option>
              <option value="VIEWER">Viewer - Read-only access</option>
            </select>
            {isEditingSelf && (
              <p className="text-sm text-muted-foreground mt-1">
                You cannot change your own role
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="rounded border-input"
              disabled={isEditingSelf}
            />
            <label htmlFor="isActive" className="text-sm font-medium">
              Active
              <span className="text-muted-foreground text-xs ml-2">
                (inactive users cannot log in)
              </span>
            </label>
          </div>
          {isEditingSelf && (
            <p className="text-sm text-muted-foreground">
              You cannot deactivate your own account
            </p>
          )}
        </div>
      </Card>
    </form>
  );
}
