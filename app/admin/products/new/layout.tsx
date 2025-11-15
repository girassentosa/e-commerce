'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from '@/components/ui/Loader';

// Layout khusus untuk halaman tambah product admin
// Meng-override parent layout untuk menghilangkan AdminHeader dan AdminSidebar
export default function AdminNewProductLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check authentication and role
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/');
      return;
    }
  }, [status, session, router]);

  // Show loading while checking session
  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen bg-white">
        <Loader size="lg" />
      </div>
    );
  }

  // Don't render if not authenticated or not admin (will redirect)
  if (status === 'unauthenticated' || (status === 'authenticated' && session?.user?.role !== 'ADMIN')) {
    return null;
  }

  // Render children tanpa AdminHeader dan AdminSidebar
  return <div className="w-full">{children}</div>;
}

