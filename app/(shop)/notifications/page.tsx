'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

/**
 * Notifications Page
 * Halaman untuk menampilkan notifikasi pengguna
 */

import { ShoppingCart, MessageCircle } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-2">
          <div className="flex items-center justify-between">
            <div className="flex-1"></div>
            <div className="flex-1 flex items-center justify-center">
              <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
            </div>
            <div className="flex-1 flex items-center justify-end gap-4">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <MessageCircle className="w-6 h-6 text-gray-700" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Tidak ada notifikasi</h2>
            <p className="text-gray-600">Anda belum memiliki notifikasi baru</p>
          </div>
        </div>
      </div>
    </div>
  );
}

