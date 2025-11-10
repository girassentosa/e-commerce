'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { AdminHeaderProvider } from '@/contexts/AdminHeaderContext';
import { Loader } from '@/components/ui/Loader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Check authentication and role
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/admin');
      return;
    }

    if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      // User is logged in but not admin, redirect to homepage
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

  return (
    <AdminHeaderProvider>
      <div className="admin-layout">
        {/* Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="admin-main-content">
          {/* Header */}
          <AdminHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Content */}
          <main className="admin-content-wrapper">{children}</main>
        </div>
      </div>
    </AdminHeaderProvider>
  );
}

