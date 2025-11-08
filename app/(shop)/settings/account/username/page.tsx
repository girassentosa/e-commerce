'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

function UsernamePageContent() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
  });

  const [originalData, setOriginalData] = useState({
    firstName: '',
    lastName: '',
  });

  const [isSaving, setIsSaving] = useState(false);

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings/account');
  };

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
          toast.error('Gagal memuat data profil');
        }
      }
    };

    fetchUserProfile();
  }, [status, session]);

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
        toast.success('Username berhasil disimpan');
        // Update session
        updateSession();
      } else {
        toast.error(data.error || 'Gagal menyimpan username');
      }
    } catch (error) {
      console.error('Error saving username:', error);
      toast.error('Gagal menyimpan username');
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
    <div className="container mx-auto px-4 py-8">
      {/* Header - Fixed height container to prevent layout shift */}
      <div className="mb-4">
        <div className="flex items-center justify-between min-h-[48px] gap-3">
          {/* Left Section */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleBack}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-lg font-bold text-gray-900">Username</h1>
          </div>

          {/* Save Button - Right (always visible but disabled until there are changes) */}
          <button
            onClick={handleSave}
            disabled={!hasChanges() || isSaving}
            className="px-4 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            {isSaving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>

      {/* Username Form Card - Full Width */}
      <div className="w-full mb-8 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
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
  );
}

export default function UsernamePage() {
  return (
    <Suspense fallback={null}>
      <UsernamePageContent />
    </Suspense>
  );
}

