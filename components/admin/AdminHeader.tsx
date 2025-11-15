'use client';

import { Menu, Search } from 'lucide-react';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

interface AdminHeaderProps {
  onMenuClick: () => void;
}

export function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const { icon: HeaderIcon, title } = useAdminHeader();

  return (
    <header className="bg-gradient-to-r from-white via-gray-50 to-white border-b border-gray-200/60 h-16 sm:h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-sm backdrop-blur-sm">
      {/* Left: Menu Button */}
      <button
        onClick={onMenuClick}
        className="admin-no-animation lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
        aria-label="Toggle menu"
        style={{ transform: 'none', transition: 'color 0.15s ease, background-color 0.15s ease' }}
      >
        <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
      
      {/* Center: Title */}
      <div className="flex-1 text-center">
        <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900">
          {title}
        </h1>
      </div>

      {/* Right: Search Button */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200">
          <Search className="w-4 h-4" />
          <span className="text-xs">Search...</span>
        </button>
        {/* Spacer untuk mobile agar title tetap di tengah */}
        <div className="lg:hidden min-h-[44px] min-w-[44px]" />
      </div>
    </header>
  );
}

