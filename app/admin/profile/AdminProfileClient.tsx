'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Upload,
  Loader2,
  User,
  Link as LinkIcon,
  UserCircle,
  Settings,
  Lock,
  Camera,
  Save,
} from 'lucide-react';
import Image from 'next/image';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { profileSchema, passwordChangeSchema } from '@/lib/validations/profile';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useNotification } from '@/contexts/NotificationContext';

interface AdminProfileClientProps {
  initialProfile: {
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    avatarUrl: string | null;
  };
}

export default function AdminProfileClient({ initialProfile }: AdminProfileClientProps) {
  const { update } = useSession();
  const router = useRouter();
  const { setHeader } = useAdminHeader();
  const { showSuccess, showError } = useNotification();

  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');
  const [profileData, setProfileData] = useState({
    email: initialProfile.email,
    firstName: initialProfile.firstName ?? '',
    lastName: initialProfile.lastName ?? '',
    phone: initialProfile.phone ?? '',
    avatarUrl: initialProfile.avatarUrl ?? '',
  });
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setHeader(UserCircle, 'Profile Settings');
  }, [setHeader]);

  const handleProfileChange = (field: string, value: string) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
    if (profileErrors[field]) {
      setProfileErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePasswordChange = (field: string, value: string) => {
    setPasswordData((prev) => ({ ...prev, [field]: value }));
    if (passwordErrors[field]) {
      setPasswordErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrors({});
    setPasswordErrors({});

    try {
      setSubmitting(true);

      const validatedProfileData = profileSchema.parse(profileData);
      const isChangingPassword =
        passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword;

      const profileResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedProfileData),
      });

      const profileDataResponse = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileDataResponse.error || 'Failed to update profile');
      }

      if (isChangingPassword) {
        const validatedPasswordData = passwordChangeSchema.parse(passwordData);

        const passwordResponse = await fetch('/api/profile/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldPassword: validatedPasswordData.oldPassword,
            newPassword: validatedPasswordData.newPassword,
          }),
        });

        const passwordDataResponse = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(passwordDataResponse.error || 'Failed to change password');
        }

        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        showSuccess('Profil & password diperbarui', 'Profile and password updated successfully!');
      } else {
        showSuccess('Profil diperbarui', 'Profile updated successfully!');
      }

      await update();
      router.refresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            const field = issue.path[0].toString();
            if (['oldPassword', 'newPassword', 'confirmPassword'].includes(field)) {
              setPasswordErrors((prev) => ({ ...prev, [field]: issue.message }));
            } else {
              setProfileErrors((prev) => ({ ...prev, [field]: issue.message }));
            }
          }
        });
        showError('Periksa formulir', 'Please fix the form errors');
      } else if (error instanceof Error) {
        showError('Gagal memperbarui profil', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showError('Ukuran file terlalu besar', 'File size must be less than 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      showError('Format tidak valid', 'File must be an image');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar');
      }

      setProfileData((prev) => ({ ...prev, avatarUrl: data.data.url }));
      showSuccess('Avatar diunggah', 'Avatar uploaded successfully!');
      await update();
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError('Gagal mengunggah avatar', error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarUrlUpload = async () => {
    if (!urlInput.trim()) {
      showError('URL kosong', 'Please enter an image URL');
      return;
    }

    try {
      new URL(urlInput.trim());
    } catch {
      showError('Format URL tidak valid', 'Invalid URL format');
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('url', urlInput.trim());

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload avatar from URL');
      }

      setProfileData((prev) => ({ ...prev, avatarUrl: data.data.url }));
      showSuccess('Avatar diunggah', 'Avatar uploaded successfully from URL!');
      setUrlInput('');
      setUploadMode('file');
      await update();
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading avatar from URL:', error);
      showError('Gagal mengunggah avatar', error.message || 'Failed to upload avatar from URL');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const avatarInitial =
    profileData.firstName?.[0]?.toUpperCase() ||
    profileData.lastName?.[0]?.toUpperCase() ||
    profileData.email[0]?.toUpperCase() ||
    'A';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Profile Settings
          </h1>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">Manage your account information and preferences</p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          <div className="admin-card h-full flex flex-col">
            <div className="admin-card-header">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Personal Information
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-6 flex-1">
              <div className="flex justify-center flex-shrink-0">
                <div className="relative">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center overflow-hidden border-4 border-gray-200 shadow-lg">
                    {profileData.avatarUrl ? (
                      <Image
                        src={profileData.avatarUrl}
                        alt="Profile"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-pink-600">
                        {avatarInitial}
                      </span>
                    )}
                  </div>
                  {uploadingAvatar && (
                    <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                      <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 text-white animate-spin" />
                    </div>
                  )}
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  <label
                    htmlFor="avatar-upload"
                    className={`absolute bottom-0 right-0 p-2 bg-pink-600 text-white rounded-full hover:bg-pink-700 transition-colors shadow-lg cursor-pointer ${
                      uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  </label>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      First Name *
                    </label>
                    <Input
                      type="text"
                      value={profileData.firstName}
                      onChange={(e) => handleProfileChange('firstName', e.target.value)}
                      error={profileErrors.firstName}
                      className="text-xs sm:text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Last Name *
                    </label>
                    <Input
                      type="text"
                      value={profileData.lastName}
                      onChange={(e) => handleProfileChange('lastName', e.target.value)}
                      error={profileErrors.lastName}
                      className="text-xs sm:text-sm md:text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleProfileChange('email', e.target.value)}
                      error={profileErrors.email}
                      className="text-xs sm:text-sm md:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                      Phone Number
                    </label>
                    <Input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => handleProfileChange('phone', e.target.value)}
                      error={profileErrors.phone}
                      className="text-xs sm:text-sm md:text-base"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="admin-card h-full flex flex-col">
            <div className="admin-card-header">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Change Password
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-4 flex-1">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Current Password
                </label>
                <Input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                  error={passwordErrors.oldPassword}
                  className="text-xs sm:text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  error={passwordErrors.newPassword}
                  className="text-xs sm:text-sm md:text-base"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  error={passwordErrors.confirmPassword}
                  className="text-xs sm:text-sm md:text-base"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
              Avatar Options
            </h2>
          </div>
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  uploadMode === 'file'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setUploadMode('file')}
              >
                Upload File
              </button>
              <button
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  uploadMode === 'url'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                onClick={() => setUploadMode('url')}
              >
                Use Image URL
              </button>
            </div>

            {uploadMode === 'file' ? (
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-3">
                <Upload className="w-10 h-10 text-blue-500 mx-auto" />
                <p className="text-sm text-gray-600">
                  Drag and drop your image here, or click the avatar to upload.
                </p>
                <p className="text-xs text-gray-400">PNG, JPG, GIF up to 2MB</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Image URL
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      type="url"
                      placeholder="https://example.com/avatar.png"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={handleAvatarUrlUpload} disabled={uploadingAvatar}>
                      {uploadingAvatar ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <LinkIcon className="w-4 h-4 mr-2" />
                          Upload
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  Make sure the URL points directly to an image file (PNG, JPG, GIF, or WEBP).
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm text-gray-500">
            Pastikan semua informasi benar sebelum menyimpan perubahan.
          </p>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

