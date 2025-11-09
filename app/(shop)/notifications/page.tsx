'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

/**
 * Notifications Page
 * Halaman untuk menampilkan notifikasi pengguna
 */

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 pt-0 pb-8">
        {/* Content */}
        <div className="mb-12 -mt-2">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada notifikasi</h2>
            <p className="text-gray-600">Anda belum memiliki notifikasi baru</p>
          </div>
        </div>
      </div>
    </div>
  );
}

