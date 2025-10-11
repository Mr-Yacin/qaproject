import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { MediaLibrary } from '@/components/admin/media/MediaLibrary';

export const metadata = {
  title: 'Media Library - Admin',
  description: 'Manage your uploaded files and images',
};

export default async function MediaPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/admin/login');
  }

  return <MediaLibrary />;
}
