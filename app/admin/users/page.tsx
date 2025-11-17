import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminUsersClient from './AdminUsersClient';

const PAGE_SIZE = 20;

async function getInitialUsers() {
  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: PAGE_SIZE,
    }),
    prisma.user.count(),
  ]);

  return {
    users: users.map((user) => ({
      ...user,
      createdAt: user.createdAt.toISOString(),
    })),
    totalCount,
    totalPages: Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
  };
}

export default async function AdminUsersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/users');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const { users, totalCount, totalPages } = await getInitialUsers();

  return (
    <AdminUsersClient
      initialUsers={users}
      initialPagination={{
        page: 1,
        limit: PAGE_SIZE,
        totalPages,
        totalCount,
      }}
    />
  );
}

