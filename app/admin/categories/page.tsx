import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminCategoriesClient from './AdminCategoriesClient';

export const dynamic = 'force-dynamic';

async function getInitialCategories() {
  const categories = await prisma.category.findMany({
    include: {
  parent: {
        select: {
          id: true,
          name: true,
        },
      },
  _count: {
        select: {
          products: true,
          children: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    imageUrl: category.imageUrl,
    isActive: category.isActive,
    parent: category.parent ? { id: category.parent.id, name: category.parent.name } : null,
    _count: category._count,
  }));
}

export default async function AdminCategoriesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/categories');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const categories = await getInitialCategories();

  return <AdminCategoriesClient initialCategories={categories} />;
}

