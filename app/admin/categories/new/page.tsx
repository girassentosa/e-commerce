import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NewCategoryClient from './NewCategoryClient';

export default async function NewCategoryPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/categories/new');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const parentCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return <NewCategoryClient parentCategories={parentCategories} />;
}

