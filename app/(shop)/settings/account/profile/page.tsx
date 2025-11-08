'use client';

import { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { ArrowLeft, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface UserProfile {
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
}

function ProfilePageContent() {
  const router = useRouter();
  const { data: session, status, update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile>({});
  const [originalProfile, setOriginalProfile] = useState<UserProfile>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings/account');
  };

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          setIsLoading(true);
          const response = await fetch('/api/profile');
          const data = await response.json();
          if (data.success && data.data) {
            const userData = data.data;
            const profileData: UserProfile = {
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
              email: userData.email || '',
              avatarUrl: userData.avatarUrl || null,
              gender: userData.gender || '',
              dateOfBirth: userData.dateOfBirth 
                ? new Date(userData.dateOfBirth).toISOString().split('T')[0]
                : '',
            };
            setProfile(profileData);
            setOriginalProfile(JSON.parse(JSON.stringify(profileData)));
            setAvatarPreview(userData.avatarUrl || null);
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
          toast.error('Gagal memuat data profil');
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [status, session]);

  // Check if there are changes
  const hasChanges = () => {
    // Compare profile fields
    const profileChanged = 
      profile.firstName !== originalProfile.firstName ||
      profile.lastName !== originalProfile.lastName ||
      profile.phone !== originalProfile.phone ||
      profile.email !== originalProfile.email ||
      profile.gender !== originalProfile.gender ||
      profile.dateOfBirth !== originalProfile.dateOfBirth;
    
    // Compare avatar
    const avatarChanged = avatarPreview !== originalProfile.avatarUrl;
    
    return profileChanged || avatarChanged;
  };

  // Handle input changes
  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle avatar upload
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload avatar
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setProfile((prev) => ({
          ...prev,
          avatarUrl: data.data.url,
        }));
        setAvatarPreview(data.data.url);
        toast.success('Foto profil berhasil diubah');
        // Update session
        updateSession();
      } else {
        toast.error(data.error || 'Gagal mengubah foto profil');
        setAvatarPreview(originalProfile.avatarUrl || null);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Gagal mengubah foto profil');
      setAvatarPreview(originalProfile.avatarUrl || null);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
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
          firstName: profile.firstName || null,
          lastName: profile.lastName || null,
          phone: profile.phone || null,
          email: profile.email || null,
          gender: profile.gender || null,
          dateOfBirth: profile.dateOfBirth || null,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOriginalProfile(JSON.parse(JSON.stringify(profile)));
        toast.success('Profile berhasil disimpan');
        // Update session
        updateSession();
      } else {
        toast.error(data.error || 'Gagal menyimpan profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Gagal menyimpan profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/account/profile');
    return null;
  }

  const displayName = profile.firstName
    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
    : profile.email || 'User';

  const avatarInitial = profile.firstName?.[0] || profile.email?.[0] || 'U';

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
            <h1 className="text-lg font-bold text-gray-900">Profile</h1>
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

      {/* Profile Card - Full Width */}
      <div className="w-full mb-8 w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
          {/* Profile Form Card */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 -ml-4 -mr-2">
            {/* Avatar Preview Card */}
            <div className="mb-6">
              <div className="flex flex-col items-center justify-center">
                <div className="relative mb-4">
                  {avatarPreview ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-200">
                      <Image
                        src={avatarPreview}
                        alt={displayName}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-200">
                      {avatarInitial.toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ubah Foto
                </button>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4">
              {/* Nama (First Name + Last Name) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nama
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Nama Depan"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Nama Belakang"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Jenis Kelamin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Jenis Kelamin
                </label>
                <select
                  value={profile.gender || ''}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="male">Laki-laki</option>
                  <option value="female">Perempuan</option>
                </select>
              </div>

              {/* Tanggal Lahir */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tanggal Lahir
                </label>
                <input
                  type="date"
                  value={profile.dateOfBirth || ''}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* No HP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  No HP
                </label>
                <input
                  type="tel"
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="08xxxxxxxxxx"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-colors"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@example.com"
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

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfilePageContent />
    </Suspense>
  );
}

