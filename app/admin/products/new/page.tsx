import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getStoreSettingsServer } from '@/lib/settings';
import NewProductClient from './NewProductClient';

export default async function NewProductPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/products/new');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const [categories, settings] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    getStoreSettingsServer(),
  ]);

  return (
    <NewProductClient
      categories={categories}
      currency={settings.currency || 'USD'}
    />
  );
}

