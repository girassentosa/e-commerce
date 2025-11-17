import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminSettingsClient from './AdminSettingsClient';

async function getSettingsData() {
  const settings = await prisma.setting.findMany({
    select: {
      key: true,
      value: true,
    },
  });

  return settings.reduce<Record<string, any>>((acc, setting) => {
    try {
      acc[setting.key] = JSON.parse(setting.value);
    } catch {
      acc[setting.key] = setting.value;
    }
    return acc;
  }, {});
}

export default async function AdminSettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login?callbackUrl=/admin/settings');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const settings = await getSettingsData();

  return <AdminSettingsClient initialSettings={settings} />;
}

