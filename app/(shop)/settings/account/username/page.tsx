'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useSaveAction } from '@/contexts/SaveActionContext';

function UsernamePageContent() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const { showSuccess, showError } = useNotification();
  const saveAction = useSaveAction();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch('/api/profile');
          const data = await response.json();
          if (data.success && data.data) {
            const userData = data.data;
            const profileData = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
            };
            setFormData(profileData);
            setOriginalData(JSON.parse(JSON.stringify(profileData)));
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          showError('Gagal', 'Gagal memuat data profil');
        }
      }
    };

    fetchUserProfile();
  }, [status, session]);

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings/account');
  };

  // Check if there are changes
  const hasChanges = () => {
    return (
      formData.firstName !== originalData.firstName ||
      formData.lastName !== originalData.lastName
    );
  };

  // Handle input changes
  const handleInputChange = (field: 'firstName' | 'lastName', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save
  const handleSave = async () => {
    if (!hasChanges()) {
      return;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName || null,
          lastName: formData.lastName || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalData(JSON.parse(JSON.stringify(formData)));
        showSuccess('Berhasil', 'Username berhasil disimpan');
        // Update session
        updateSession();
      } else {
        showError('Gagal', data.error || 'Gagal menyimpan username');
      }
    } catch (error) {
      console.error('Error saving username:', error);
      showError('Gagal', 'Gagal menyimpan username');
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/account/username');
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Username Header - Standalone, Fixed at Top */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Back Arrow */}
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Username Title - Centered */}
            <h1 className="!text-base !font-semibold text-gray-900 flex-1 text-center">
              Username
            </h1>

            {/* Simpan Button - Right */}
            <button
              onClick={handleSave}
              disabled={!hasChanges() || isSaving}
              className="px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
            >
              {isSaving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </header>

      {/* Username Content */}
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-4 pb-4 sm:pb-6 md:pb-8">
        <div className="-mt-2">
          {/* Username Form Card - Full Width */}
          <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
            <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
              {/* Form Fields */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -ml-4 -mr-2">
            <div className="space-y-4">
              {/* Nama Depan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Depan
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Masukkan nama depan"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Nama Belakang */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama Belakang
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Masukkan nama belakang"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UsernamePage() {
  return (
    <Suspense fallback={null}>
      <UsernamePageContent />
    </Suspense>
  );
}

