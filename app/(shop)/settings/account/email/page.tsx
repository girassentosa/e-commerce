'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { useSaveAction } from '@/contexts/SaveActionContext';

function EmailPageContent() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const saveAction = useSaveAction();

  const [formData, setFormData] = useState({
    email: '',
  });

  const [originalData, setOriginalData] = useState({
    email: '',
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
              email: userData.email || '',
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

  // Set save action for header
  useEffect(() => {
    saveAction.setOnSave(() => handleSave);
    return () => saveAction.setOnSave(null);
  }, [formData, originalData, isSaving]);

  // Check if there are changes
  const hasChanges = () => {
    return formData.email !== originalData.email;
  };

  // Handle input changes
  const handleInputChange = (value: string) => {
    setFormData({
      email: value,
    });
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
          email: formData.email || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalData(JSON.parse(JSON.stringify(formData)));
        toast.success('Email berhasil disimpan');
        // Update session
        updateSession();
      } else {
        toast.error(data.error || 'Gagal menyimpan email');
      }
    } catch (error) {
      console.error('Error saving email:', error);
      toast.error('Gagal menyimpan email');
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/account/email');
    return null;
  }

  return (
    <div className="container mx-auto px-4 pt-0 pb-8">
      <div className="-mt-2">
        {/* Email Form Card - Full Width */}
      <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
          {/* Form Fields */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -ml-4 -mr-2">
            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function EmailPage() {
  return (
    <Suspense fallback={null}>
      <EmailPageContent />
    </Suspense>
  );
}

