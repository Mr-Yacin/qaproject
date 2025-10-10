'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Edit, Trash2, Loader2, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FooterColumnForm } from './FooterColumnForm';
import { FooterLinkForm } from './FooterLinkForm';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface FooterLink {
  id: string;
  columnId: string;
  label: string;
  url: string;
  order: number;
}

interface FooterColumn {
  id: string;
  title: string;
  order: number;
  links: FooterLink[];
}

interface FooterSettings {
  id: string;
  copyrightText: string;
  socialLinks: Record<string, string> | null;
}

interface FooterConfig {
  settings: FooterSettings | null;
  columns: FooterColumn[];
}

interface FooterBuilderProps {
  initialConfig: FooterConfig;
}

/**
 * Footer Builder Component
 * Interface for managing footer configuration
 * Requirements: 5.1, 5.2, 5.3, 5.6, 5.7
 */
export function FooterBuilder({ initialConfig }: FooterBuilderProps) {
  const { toast } = useToast();
  const [config, setConfig] = useState<FooterConfig>(initialConfig);
  const [editingColumn, setEditingColumn] = useState<FooterColumn | null>(null);
  const [showCreateColumnForm, setShowCreateColumnForm] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [showCreateLinkForm, setShowCreateLinkForm] = useState(false);
  const [selectedColumnId, setSelectedColumnId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  
  // Settings form state
  const [copyrightText, setCopyrightText] = useState(config.settings?.copyrightText || '');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>(
    config.settings?.socialLinks || {}
  );

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/footer');
      if (!response.ok) {
        throw new Error('Failed to fetch footer configuration');
      }
      const data = await response.json();
      setConfig(data);
      setCopyrightText(data.settings?.copyrightText || '');
      setSocialLinks(data.settings?.socialLinks || {});
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch footer configuration',
        variant: 'destructive',
      });
      console.error('Failed to fetch footer configuration:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSavingSettings(true);
      const response = await fetch('/api/admin/footer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copyrightText,
          socialLinks: Object.keys(socialLinks).length > 0 ? socialLinks : null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update footer settings');
      }

      toast({
        title: 'Success',
        description: 'Footer settings updated successfully',
      });

      await fetchConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update footer settings',
        variant: 'destructive',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateColumn = async (data: Partial<FooterColumn>) => {
    try {
      const response = await fetch('/api/admin/footer/columns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create footer column');
      }

      toast({
        title: 'Success',
        description: 'Footer column created successfully',
      });

      setShowCreateColumnForm(false);
      await fetchConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create footer column',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateColumn = async (data: Partial<FooterColumn>) => {
    if (!editingColumn) return;

    try {
      const response = await fetch(`/api/admin/footer/columns/${editingColumn.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update footer column');
      }

      toast({
        title: 'Success',
        description: 'Footer column updated successfully',
      });

      setEditingColumn(null);
      await fetchConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update footer column',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteColumn = async (column: FooterColumn) => {
    if (!confirm(`Are you sure you want to delete "${column.title}"? This will also delete all links in this column.`)) {
      return;
    }

    try {
      setDeletingId(column.id);
      const response = await fetch(`/api/admin/footer/columns/${column.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete footer column');
      }

      toast({
        title: 'Success',
        description: 'Footer column deleted successfully',
      });

      await fetchConfig();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete footer column',
        variant: 'destructive',
      });
      console.error('Failed to delete footer column:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleCreateLink = async (data: Partial<FooterLink>) => {
    try {
      const response = await fetch('/api/admin/footer/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, columnId: selectedColumnId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create footer link');
      }

      toast({
        title: 'Success',
        description: 'Footer link created successfully',
      });

      setShowCreateLinkForm(false);
      setSelectedColumnId(null);
      await fetchConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create footer link',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleUpdateLink = async (data: Partial<FooterLink>) => {
    if (!editingLink) return;

    try {
      const response = await fetch(`/api/admin/footer/links/${editingLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update footer link');
      }

      toast({
        title: 'Success',
        description: 'Footer link updated successfully',
      });

      setEditingLink(null);
      await fetchConfig();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update footer link',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeleteLink = async (link: FooterLink) => {
    if (!confirm(`Are you sure you want to delete "${link.label}"?`)) {
      return;
    }

    try {
      setDeletingId(link.id);
      const response = await fetch(`/api/admin/footer/links/${link.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete footer link');
      }

      toast({
        title: 'Success',
        description: 'Footer link deleted successfully',
      });

      await fetchConfig();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete footer link',
        variant: 'destructive',
      });
      console.error('Failed to delete footer link:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (showCreateColumnForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Footer Column</h2>
        </div>
        <FooterColumnForm
          onSave={handleCreateColumn}
          onCancel={() => setShowCreateColumnForm(false)}
        />
      </div>
    );
  }

  if (editingColumn) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Footer Column</h2>
        </div>
        <FooterColumnForm
          column={editingColumn}
          onSave={handleUpdateColumn}
          onCancel={() => setEditingColumn(null)}
        />
      </div>
    );
  }

  if (showCreateLinkForm) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Create Footer Link</h2>
        </div>
        <FooterLinkForm
          onSave={handleCreateLink}
          onCancel={() => {
            setShowCreateLinkForm(false);
            setSelectedColumnId(null);
          }}
        />
      </div>
    );
  }

  if (editingLink) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Footer Link</h2>
        </div>
        <FooterLinkForm
          link={editingLink}
          onSave={handleUpdateLink}
          onCancel={() => setEditingLink(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Footer Settings */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Footer Settings</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="copyright">Copyright Text</Label>
            <Input
              id="copyright"
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
              placeholder="© 2024 Your Company. All rights reserved."
            />
          </div>
          
          <div>
            <Label>Social Media Links (Optional)</Label>
            <div className="space-y-2 mt-2">
              {['twitter', 'facebook', 'linkedin', 'instagram', 'github'].map((platform) => (
                <div key={platform} className="flex items-center gap-2">
                  <Label className="w-24 capitalize">{platform}</Label>
                  <Input
                    value={socialLinks[platform] || ''}
                    onChange={(e) => setSocialLinks({ ...socialLinks, [platform]: e.target.value })}
                    placeholder={`https://${platform}.com/...`}
                  />
                </div>
              ))}
            </div>
          </div>

          <Button onClick={handleSaveSettings} disabled={savingSettings}>
            {savingSettings && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Settings
          </Button>
        </div>
      </Card>

      {/* Footer Columns */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Footer Columns</h2>
          <Button onClick={() => setShowCreateColumnForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Column
          </Button>
        </div>

        {config.columns.length === 0 ? (
          <Card className="p-12">
            <div className="text-center">
              <p className="text-muted-foreground mb-4">No footer columns yet</p>
              <Button onClick={() => setShowCreateColumnForm(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Column
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {config.columns.map((column) => (
              <Card key={column.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <h3 className="font-semibold">{column.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingColumn(column)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteColumn(column)}
                      disabled={deletingId === column.id}
                    >
                      {deletingId === column.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {column.links.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No links</p>
                  ) : (
                    column.links.map((link) => (
                      <div
                        key={link.id}
                        className="flex items-center justify-between p-2 bg-muted rounded group"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{link.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLink(link)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLink(link)}
                            disabled={deletingId === link.id}
                          >
                            {deletingId === link.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => {
                    setSelectedColumnId(column.id);
                    setShowCreateLinkForm(true);
                  }}
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Add Link
                </Button>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
