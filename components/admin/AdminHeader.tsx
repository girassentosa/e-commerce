'use client';

import { useSession } from 'next-auth/react';
import { Bell, Menu } from 'lucide-react';
import Image from 'next/image';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { data: session } = useSession();

  // Get display name
  const firstName = session?.user?.firstName;
  const lastName = session?.user?.lastName;
  const displayName = firstName && lastName 
    ? `${firstName} ${lastName}` 
    : firstName || session?.user?.email || 'Admin';

  // Get avatar initial
  const avatarInitial = firstName?.[0] || session?.user?.email?.[0] || 'A';

  return (
    <header className="bg-white border-b border-gray-200 h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">Admin Panel</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* User Menu */}
        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-gray-200">
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden text-xs sm:text-sm">
            {session?.user?.avatarUrl ? (
              <Image
                src={session.user.avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              avatarInitial.toUpperCase()
            )}
          </div>
          <div className="hidden sm:block text-sm">
            <p className="font-semibold text-gray-900 truncate max-w-[120px] lg:max-w-none">
              {displayName}
            </p>
            <p className="text-gray-500 text-xs">Administrator</p>
          </div>
        </div>
      </div>
    </header>
  );
}

