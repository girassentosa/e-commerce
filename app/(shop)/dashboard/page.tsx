'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useWishlist } from '@/contexts/WishlistContext';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { profileSchema, passwordChangeSchema } from '@/lib/validations/profile';
import { 
  Package, 
  CreditCard,
  Box,
  Truck,
  Star,
  Heart,
  Eye,
  RotateCcw,
  ChevronRight,
  Upload,
  Loader2,
  User,
  Edit2,
  X,
  ArrowLeft,
  Settings,
  ShoppingCart,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { z } from 'zod';

interface DashboardStats {
  totalOrders: number;
  belumBayar: number;
  dikemas: number;
  dikirim: number;
  beriPenilaian: number;
}

interface DashboardData {
  stats: DashboardStats;
  itemCount: number;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const { count: wishlistCount } = useWishlist();
  const { itemCount } = useCart();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalOrders: 0,
      belumBayar: 0,
      dikemas: 0,
      dikirim: 0,
      beriPenilaian: 0,
    },
    itemCount: 0,
  });

  // Profile Editing State
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(false);
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

  // Fetch Dashboard Data
  const fetchDashboardData = useCallback(async () => {
    try {
      const [statsResponse, cartCountResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/cart/count'),
      ]);

      const [statsData, cartCountData] = await Promise.all([
        statsResponse.json(),
        cartCountResponse.json(),
      ]);

      setDashboardData((prev) => ({
        stats: statsData.success ? statsData.data : prev.stats,
        itemCount: cartCountData.success ? (cartCountData.data.itemCount || 0) : prev.itemCount,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  }, []);

  // Fetch Profile Data
  const fetchProfile = async () => {
    try {
      setLoadingProfile(true);
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
      showError('Gagal', error.message || 'Gagal memuat profil');
    } finally {
      setLoadingProfile(false);
    }
  };

  // Handle Profile Change
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

  // Handle Password Change
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

  // Handle Profile Submit
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
        showSuccess('Berhasil', 'Profil dan password berhasil diperbarui!');
      } else {
        showSuccess('Berhasil', 'Profil berhasil diperbarui!');
      }

      // Update session and refresh UI
      await update();
      router.refresh();
      setShowEditProfile(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
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
        showError('Peringatan', 'Silakan perbaiki error pada form');
      } else if (error instanceof Error) {
        showError('Gagal', error.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Avatar Upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      showError('Peringatan', 'Ukuran file harus kurang dari 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('Peringatan', 'File harus berupa gambar');
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
      showSuccess('Berhasil', 'Avatar berhasil diunggah!');
      // Update session and refresh UI
      await update();
      router.refresh();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError('Gagal', error.message || 'Gagal mengunggah avatar');
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Open Edit Profile Modal
  const handleOpenEditProfile = async () => {
    setShowEditProfile(true);
    await fetchProfile();
  };

  // Effects
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/dashboard');
      setDashboardData({
        stats: {
          totalOrders: 0,
          belumBayar: 0,
          dikemas: 0,
          dikirim: 0,
          beriPenilaian: 0,
        },
        itemCount: 0,
      });
    } else if (status === 'authenticated') {
      fetchDashboardData();
    }
  }, [status, router, fetchDashboardData]);

  // Use itemCount from context directly for cart badge

  const displayName = session?.user?.firstName 
    ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
    : session?.user?.email || 'User';

  const avatarInitial = session?.user?.firstName?.[0] || session?.user?.email?.[0] || 'U';
  const currentAvatarUrl = profileData.avatarUrl || session?.user?.avatarUrl;

  return (
    <div className="min-h-screen bg-white">
      {/* Dashboard Header - Standalone, Fixed at Top */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Back Arrow */}
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>

            {/* Dashboard Title - Left */}
            <h1 className="!text-base !font-semibold text-gray-900 ml-3">
              Dashboard
            </h1>
            
            {/* Spacer untuk push icons ke kanan */}
            <div className="flex-1"></div>

            {/* Settings & Cart Icons - Right */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link
                href="/settings"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </Link>
              <Link
                href="/cart"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Cart"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="container mx-auto px-2 sm:px-3 md:px-4 pt-4 pb-4 sm:pb-6 md:pb-8">
        <div className="-mt-2">

        {/* User Profile Card - Full Width */}
        <div className="w-full mb-6 w-screen -ml-[calc((100vw-100%)/2)]">
          <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-gray-200 rounded-lg py-6 px-4 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
              <div className="flex items-center space-x-3 sm:space-x-4">
                {currentAvatarUrl ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex-shrink-0">
                    <Image
                      src={currentAvatarUrl}
                      alt={displayName}
                      width={96}
                      height={96}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xl sm:text-2xl md:text-3xl flex-shrink-0">
                    {avatarInitial.toUpperCase()}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="!text-xs sm:!text-sm !font-medium text-gray-900 truncate">
                    {displayName}
                  </h2>
                  <p className="!text-sm text-gray-600 break-words">
                    {session?.user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pesanan Saya Section - Full Width */}
        <div className="w-full mb-6 w-screen -ml-[calc((100vw-100%)/2)]">
          <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
            <div className="bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-2 -ml-2 sm:-ml-3 md:-ml-4 -mr-2">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="!text-sm !font-semibold text-gray-900">Pesanan Saya</h2>
                <Link href="/orders" className="!text-xs text-gray-600 hover:text-gray-700 !font-medium flex items-center gap-1 transition-colors -mr-1">
                  Lihat Riwayat Pesanan
                  <span className="text-gray-600">&gt;</span>
                </Link>
              </div>

              {/* Stats Grid - Icon Only Layout */}
              <div className="overflow-x-auto -mx-2 px-2 sm:px-4 md:px-6 overflow-y-visible scrollbar-hide">
                <div className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 min-w-max py-1">
                  <Link href="/orders" className="flex flex-col items-center flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                    <div className="relative mb-1 overflow-visible pr-4">
                      <Package className="w-6 h-6 text-gray-600" />
                      {dashboardData.stats.totalOrders > 0 && (
                        <span className="absolute -top-1 right-1 bg-blue-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 z-10">
                          {dashboardData.stats.totalOrders > 99 ? '99+' : dashboardData.stats.totalOrders}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium text-center leading-tight whitespace-nowrap">Total Order</p>
                  </Link>

                  <Link href="/orders?status=PENDING&paymentStatus=PENDING" className="flex flex-col items-center flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                    <div className="relative mb-1 overflow-visible pr-4">
                      <CreditCard className="w-6 h-6 text-gray-600" />
                      {dashboardData.stats.belumBayar > 0 && (
                        <span className="absolute -top-1 right-1 bg-yellow-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 z-10">
                          {dashboardData.stats.belumBayar > 99 ? '99+' : dashboardData.stats.belumBayar}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium text-center leading-tight whitespace-nowrap">Belum Bayar</p>
                  </Link>

                  <Link href="/orders?status=PROCESSING" className="flex flex-col items-center flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                    <div className="relative mb-1 overflow-visible pr-4">
                      <Box className="w-6 h-6 text-gray-600" />
                      {dashboardData.stats.dikemas > 0 && (
                        <span className="absolute -top-1 right-1 bg-orange-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 z-10">
                          {dashboardData.stats.dikemas > 99 ? '99+' : dashboardData.stats.dikemas}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium text-center leading-tight whitespace-nowrap">Dikemas</p>
                  </Link>

                  <Link href="/orders?status=SHIPPED" className="flex flex-col items-center flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                    <div className="relative mb-1 overflow-visible pr-4">
                      <Truck className="w-6 h-6 text-gray-600" />
                      {dashboardData.stats.dikirim > 0 && (
                        <span className="absolute -top-1 right-1 bg-purple-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 z-10">
                          {dashboardData.stats.dikirim > 99 ? '99+' : dashboardData.stats.dikirim}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium text-center leading-tight whitespace-nowrap">Dikirim</p>
                  </Link>

                  <Link href="/reviews/my" className="flex flex-col items-center flex-shrink-0 min-w-[70px] sm:min-w-[80px]">
                    <div className="relative mb-1 overflow-visible pr-4">
                      <Star className="w-6 h-6 text-gray-600" />
                      {dashboardData.stats.beriPenilaian > 0 && (
                        <span className="absolute -top-1 right-1 bg-yellow-600 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-0.5 z-10">
                          {dashboardData.stats.beriPenilaian > 99 ? '99+' : dashboardData.stats.beriPenilaian}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium text-center leading-tight whitespace-nowrap">Beri Penilaian</p>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Aktifitas Saya Section - Full Width */}
        <div className="w-full w-screen -ml-[calc((100vw-100%)/2)] mb-2 sm:mb-6 md:mb-8">
          <div className="max-w-7xl mx-auto pl-2 sm:pl-3 md:pl-4 pr-2">
            <div className="bg-white border border-gray-200 rounded-lg py-3 pl-4 pr-2 -ml-2 sm:-ml-3 md:-ml-4 -mr-2 mb-0">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <h2 className="!text-sm !font-semibold text-gray-900">Aktifitas Saya</h2>
                <Link href="/activities" className="!text-xs text-gray-600 hover:text-gray-700 !font-medium flex items-center gap-1 transition-colors">
                  Lihat Semua
                  <span className="text-gray-600">&gt;</span>
                </Link>
              </div>

              {/* Activity Grid - Horizontal Layout with Cards */}
              <div className="overflow-x-auto -mx-2 px-2 sm:px-4 md:px-6 overflow-y-visible scrollbar-hide">
                <div className="flex gap-3 sm:gap-4 md:gap-6 lg:gap-8 min-w-max py-1">
                  <Link href="/favorite?from=dashboard" className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 min-w-[120px] sm:min-w-[140px]">
                    <div className="flex-shrink-0">
                      <Heart className="w-6 h-6 text-red-500" />
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium leading-tight flex-1">Favorite Saya</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>

                  <Link href="/last-viewed?from=dashboard" className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 min-w-[120px] sm:min-w-[140px]">
                    <div className="flex-shrink-0">
                      <Eye className="w-6 h-6 text-blue-500" />
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium leading-tight flex-1">Terakhir Dilihat</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>

                  <Link href="/buy-again?from=dashboard" className="flex items-center gap-2 p-1.5 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0 min-w-[120px] sm:min-w-[140px]">
                    <div className="flex-shrink-0">
                      <RotateCcw className="w-6 h-6 text-green-500" />
                    </div>
                    <p className="text-[10px] text-gray-700 font-medium leading-tight flex-1">Beli Lagi</p>
                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditProfile(false);
            }
          }}
        >
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-gray-900">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {loadingProfile ? (
                <div className="flex justify-center py-12">
                  <Loader size="lg" />
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit}>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                      {/* Personal Information */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Personal Information</h3>
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
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password (Optional)</h3>
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
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-1">
                      {/* Profile Picture */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 sticky top-6">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Profile Picture</h3>
                        <div className="flex flex-col items-center">
                          <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center mb-4 overflow-hidden">
                            {currentAvatarUrl ? (
                              <Image
                                src={currentAvatarUrl}
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
                            ref={fileInputRef}
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

                  {/* Modal Footer */}
                  <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowEditProfile(false)}
                      className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancel
                    </button>
                    <Button type="submit" disabled={submitting || loadingProfile}>
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
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
