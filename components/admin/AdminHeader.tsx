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
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile Menu Button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all duration-200 active:scale-95"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        
        {/* Logo/Brand */}
        <div className="flex items-center gap-2 sm:gap-3">
          {HeaderIcon ? (
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <HeaderIcon className="w-5 h-5 text-white" />
            </div>
          ) : (
            <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
          )}
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {title}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Button (Desktop) */}
        <button className="hidden md:flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 border border-gray-200">
          <Search className="w-4 h-4" />
          <span className="text-xs">Search...</span>
        </button>
      </div>
    </header>
  );
}

