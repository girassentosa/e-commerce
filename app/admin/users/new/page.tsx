import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import NewUserClient from './NewUserClient';

export const dynamic = 'force-dynamic';

export default async function NewUserPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/users/new');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return <NewUserClient />;
}
