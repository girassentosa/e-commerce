'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, UserCircle, Phone, Mail, Lock, ChevronRight } from 'lucide-react';

interface UserProfile {
  phone?: string | null;
}

function AccountSettingsPageContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState<UserProfile>({});

  // Handle back navigation
  const handleBack = () => {
    router.push('/settings');
  };

  // Fetch user profile data (for phone number)
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (status === 'authenticated' && session?.user?.id) {
        try {
          const response = await fetch('/api/profile');
          const data = await response.json();
          if (data.success && data.data) {
            setUserProfile({
              phone: data.data.phone || null,
            });
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
    };

    fetchUserProfile();
  }, [status, session]);

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/settings/account');
    return null;
  }

  const displayName = session?.user?.firstName 
    ? `${session.user.firstName} ${session.user.lastName || ''}`.trim()
    : session?.user?.email || 'User';

  const avatarInitial = session?.user?.firstName?.[0] || session?.user?.email?.[0] || 'U';

  return (
    <div className="container mx-auto px-4 pt-0 pb-8">
      <div className="-mt-2">
        {/* Profile Saya Card - Full Width */}
        <div className="w-full w-screen -ml-[calc((100vw-100%)/2)]">
        <div className="max-w-7xl mx-auto pl-4 pr-2">
          {/* Header */}
          <div className="mb-4 -ml-4 -mr-2">
            <h2 className="text-base font-bold text-gray-900 px-4">Profile Saya</h2>
          </div>

          {/* Profile Options - Single card with dividers - Full width with dividers */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden -ml-4 -mr-2">
              {/* Profile Saya */}
              <Link 
                href="/settings/account/profile"
                className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
              >
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
                <div className="flex-shrink-0">
                  {session?.user?.avatarUrl ? (
                    <div className="w-10 h-10 rounded-full overflow-hidden">
                      <Image
                        src={session.user.avatarUrl}
                        alt={displayName}
                        width={40}
                        height={40}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                      {avatarInitial.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium leading-tight">Profile Saya</p>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">{displayName}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>

              {/* Username */}
              <Link 
                href="/settings/account/username"
                className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
              >
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
                <div className="flex-shrink-0">
                  <UserCircle className="w-5 h-5 text-indigo-500 group-hover:text-indigo-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium leading-tight">Username</p>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                    {session?.user?.firstName && session?.user?.lastName
                      ? `${session.user.firstName} ${session.user.lastName}`
                      : session?.user?.email || '-'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>

              {/* No HP */}
              <Link 
                href="/settings/account/phone"
                className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
              >
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
                <div className="flex-shrink-0">
                  <Phone className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium leading-tight">No HP</p>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                    {userProfile.phone || 'Belum diatur'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>

              {/* Email */}
              <Link 
                href="/settings/account/email"
                className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
              >
                <div className="absolute left-0 right-0 bottom-0 h-px bg-gray-200"></div>
                <div className="flex-shrink-0">
                  <Mail className="w-5 h-5 text-green-500 group-hover:text-green-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium leading-tight">Email</p>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">
                    {session?.user?.email || '-'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>

              {/* Ganti Password */}
              <Link 
                href="/settings/account/password"
                className="flex items-center gap-3 p-3 hover:bg-gray-100 transition-colors group relative"
              >
                <div className="flex-shrink-0">
                  <Lock className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 font-medium leading-tight">Ganti Password</p>
                  <p className="text-xs text-gray-500 leading-tight mt-0.5">Ubah kata sandi akun Anda</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              </Link>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense fallback={null}>
      <AccountSettingsPageContent />
    </Suspense>
  );
}

