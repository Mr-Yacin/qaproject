import { MediaLibrary } from '@/components/admin/media/MediaLibrary';

export const metadata = {
  title: 'Media Library - Admin',
  description: 'Manage your uploaded files and images',
};

export default function MediaPage() {
  return <MediaLibrary />;
}
