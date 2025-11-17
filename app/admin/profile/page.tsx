'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { profileSchema, passwordChangeSchema } from '@/lib/validations/profile';
import { Upload, Loader2, User, Link as LinkIcon, UserCircle, Settings, Lock, Camera } from 'lucide-react';
import Image from 'next/image';
import { z } from 'zod';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useNotification } from '@/contexts/NotificationContext';

export default function AdminProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { setHeader } = useAdminHeader();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [urlInput, setUrlInput] = useState('');

  const [profileData, setProfileData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    avatarUrl: '',
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    setHeader(UserCircle, 'Profile Settings');
  }, [setHeader]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/profile');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch profile');
      }

      setProfileData({
        email: data.data.email,
        firstName: data.data.firstName || '',
        lastName: data.data.lastName || '',
        phone: data.data.phone || '',
        avatarUrl: data.data.avatarUrl || '',
      });
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      showError('Gagal memuat profil', error.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

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

      // Validate profile data
      const validatedProfileData = profileSchema.parse(profileData);

      // Check if user wants to change password
      const isChangingPassword = passwordData.oldPassword || passwordData.newPassword || passwordData.confirmPassword;

      // 1. Update profile first
      const profileResponse = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedProfileData),
      });

      const profileData_response = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileData_response.error || 'Failed to update profile');
      }

      // 2. Change password if fields are filled
      if (isChangingPassword) {
        // Validate password data
        const validatedPasswordData = passwordChangeSchema.parse(passwordData);

        const passwordResponse = await fetch('/api/profile/password', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldPassword: validatedPasswordData.oldPassword,
            newPassword: validatedPasswordData.newPassword,
          }),
        });

        const passwordData_response = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(passwordData_response.error || 'Failed to change password');
        }

        // Clear password fields after successful change
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        showSuccess('Profil & password diperbarui', 'Profile and password updated successfully!');
      } else {
        showSuccess('Profil diperbarui', 'Profile updated successfully!');
      }

      // Update session and refresh UI
      await update();
      router.refresh();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            const field = err.path[0].toString();
            // Separate profile and password errors
            if (['oldPassword', 'newPassword', 'confirmPassword'].includes(field)) {
              setPasswordErrors((prev) => ({ ...prev, [field]: err.message }));
            } else {
              setProfileErrors((prev) => ({ ...prev, [field]: err.message }));
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

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showError('Ukuran file terlalu besar', 'File size must be less than 2MB');
      return;
    }

    // Validate file type
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
      // Update session and refresh UI
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

    // Validate URL format
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
      // Update session and refresh UI
      await update();
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading avatar from URL:', error);
      showError('Gagal mengunggah avatar', error.message || 'Failed to upload avatar from URL');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader size="lg" />
      </div>
    );
  }

  const avatarInitial = profileData.firstName?.[0]?.toUpperCase() || 
    profileData.lastName?.[0]?.toUpperCase() || 
    profileData.email[0]?.toUpperCase() || 
    'A';

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <UserCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Profile Settings
          </h1>
        </div>
        <div className="p-6">
          <p className="text-sm text-gray-600">
            Manage your account information and preferences
          </p>
        </div>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* Personal Information and Change Password - 2 columns on all devices except mobile, 1 column on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-stretch">
          {/* Personal Information with Profile Picture */}
          <div className="admin-card h-full flex flex-col">
            <div className="admin-card-header">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Personal Information
              </h2>
            </div>
            <div className="p-4 sm:p-6 space-y-6 flex-1">
              {/* Profile Picture - Center */}
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
                  {/* Camera Icon Button */}
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
                    className={`
                      absolute bottom-0 right-0 p-2 bg-pink-600 text-white rounded-full 
                      hover:bg-pink-700 transition-colors shadow-lg cursor-pointer
                      ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                  </label>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 flex-1">
                {/* First Name and Last Name - Side by Side (2 columns on all devices) */}
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

                {/* Email Address and Phone - Side by Side (2 columns on all devices) */}
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
                      Phone
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

          {/* Change Password */}
          <div className="admin-card h-full flex flex-col">
            <div className="admin-card-header">
              <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                Change Password (Optional)
              </h2>
            </div>
            <div className="p-4 sm:p-6 flex-1 flex flex-col justify-end">
              <p className="text-xs sm:text-sm text-gray-600 mb-4 flex-shrink-0">Leave blank if you don't want to change password</p>
              <div className="space-y-4">
                {/* Current Password - Full Width */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={passwordData.oldPassword}
                    onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                    error={passwordErrors.oldPassword}
                    placeholder="Enter current password"
                    className="text-xs sm:text-sm md:text-base"
                  />
                </div>

                {/* New Password - Full Width */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                    error={passwordErrors.newPassword}
                    placeholder="Enter new password"
                    className="text-xs sm:text-sm md:text-base"
                  />
                  <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
                </div>

                {/* Confirm Password - Full Width */}
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                    error={passwordErrors.confirmPassword}
                    placeholder="Confirm new password"
                    className="text-xs sm:text-sm md:text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button - Full Width */}
        <div className="w-full">
          <div className="admin-card">
            <div className="p-4 sm:p-6">
              <Button 
                type="submit" 
                disabled={submitting} 
                className="admin-no-animation w-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white !font-normal rounded-lg sm:rounded-xl shadow-md py-2.5 sm:py-3 !transition-colors !duration-150"
                style={{ transform: 'none', transition: 'color 0.15s ease, background-color 0.15s ease' }}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                    <span className="text-sm sm:text-base">Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Settings className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="text-sm sm:text-base">Save Changes</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

