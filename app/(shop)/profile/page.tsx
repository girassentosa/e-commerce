'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { profileSchema, passwordChangeSchema } from '@/lib/validations/profile';
import { Upload, Loader2, User } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { z } from 'zod';

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

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
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/profile');
    } else if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status, router]);

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
      toast.error(error.message || 'Failed to load profile');
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
        toast.success('Profile and password updated successfully!');
      } else {
        toast.success('Profile updated successfully!');
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
        toast.error('Please fix the form errors');
      } else if (error instanceof Error) {
        toast.error(error.message);
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
      toast.error('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
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
      toast.success('Avatar uploaded successfully!');
      // Update session and refresh UI
      await update();
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast.error(error.message || 'Failed to upload avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Profile Settings</h1>

      <form onSubmit={handleProfileSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h2>
              <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <Input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => handleProfileChange('firstName', e.target.value)}
                    error={profileErrors.firstName}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <Input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => handleProfileChange('lastName', e.target.value)}
                    error={profileErrors.lastName}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                  error={profileErrors.email}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                  error={profileErrors.phone}
                />
              </div>

            </div>
          </div>

          {/* Change Password */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Change Password (Optional)</h2>
            <p className="text-sm text-gray-600 mb-4">Leave blank if you don't want to change password</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password *
                </label>
                <Input
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(e) => handlePasswordChange('oldPassword', e.target.value)}
                  error={passwordErrors.oldPassword}
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  error={passwordErrors.newPassword}
                  placeholder="Enter new password"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                  error={passwordErrors.confirmPassword}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <Button type="submit" disabled={submitting} fullWidth>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
          {/* Profile Picture */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Profile Picture</h2>
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                {profileData.avatarUrl ? (
                  <Image
                    src={profileData.avatarUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 text-gray-400" />
                )}
              </div>

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
                  inline-flex items-center justify-center font-medium rounded-lg 
                  px-4 py-2 text-base transition-all duration-200 
                  border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 
                  focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
                  ${uploadingAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {uploadingAvatar ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Photo
                  </>
                )}
              </label>
              <p className="text-xs text-gray-500 mt-2 text-center">
                PNG, JPG, JPEG, GIF, WEBP (max 2MB)
              </p>
            </div>
          </div>
        </div>
      </div>
      </form>
    </div>
  );
}

