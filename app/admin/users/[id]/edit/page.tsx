import { redirect, notFound } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import EditUserClient from './EditUserClient';

export const dynamic = 'force-dynamic';

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      isActive: true,
    },
  });

  if (!user) {
    return null;
  }

  return {
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
  };
}

export default async function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/users');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const { id } = await params;
  const userData = await getUserData(id);

  if (!userData) {
    notFound();
  }

  return <EditUserClient userId={id} initialUser={userData} />;
}
