'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Profile Page - Redirects to Dashboard
 * Dashboard is now the main profile page with all profile editing functionality
 */
export default function ProfilePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to dashboard (which now contains all profile functionality)
    router.replace('/dashboard');
  }, [router]);

  return null;
}
