'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  FolderTree,
  Users,
  UserCircle,
  Settings,
  LogOut,
  Star,
  X,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    color: 'from-purple-500 to-pink-500',
  },
  {
    label: 'Orders',
    href: '/admin/orders',
    icon: ShoppingBag,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    label: 'Categories',
    href: '/admin/categories',
    icon: FolderTree,
    color: 'from-orange-500 to-red-500',
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    color: 'from-indigo-500 to-purple-500',
  },
  {
    label: 'Reviews',
    href: '/admin/reviews',
    icon: Star,
    color: 'from-yellow-500 to-amber-500',
  },
  {
    label: 'Profile',
    href: '/admin/profile',
    icon: UserCircle,
    color: 'from-pink-500 to-rose-500',
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    color: 'from-gray-500 to-slate-500',
  },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
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
    <>
      <aside
        className={`
          admin-sidebar text-gray-900 min-h-screen overflow-y-auto
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Profile Section */}
        <div className="p-5 sm:p-6 border-b border-gray-200/80 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-pink-50/50">
          <div className="flex items-center justify-between">
            <Link href="/admin/profile" className="flex items-center gap-3 group flex-1 min-w-0" onClick={onClose}>
              <div className="relative flex-shrink-0">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold overflow-hidden shadow-md ring-2 ring-white group-hover:ring-indigo-200 group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                  {session?.user?.avatarUrl ? (
                    <Image
                      src={session.user.avatarUrl}
                      alt={displayName}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm sm:text-base">{avatarInitial.toUpperCase()}</span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-semibold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
                  {displayName}
                </p>
                <p className="text-xs text-gray-500 font-medium">Admin</p>
              </div>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-all duration-200 active:scale-95 flex-shrink-0 ml-2"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 pt-6">
          <ul className="space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={`
                      group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? `bg-gradient-to-r ${item.color} text-white shadow-md scale-[1.01]`
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }
                    `}
                  >
                    {isActive && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/90 rounded-r-full shadow-sm`}></div>
                    )}
                    <div className={`${isActive ? 'scale-110 text-white' : 'group-hover:scale-110 text-gray-600 group-hover:text-gray-900'} transition-all duration-200`}>
                      <Icon className="w-5 h-5 flex-shrink-0" />
                    </div>
                    <span className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-700 group-hover:text-gray-900'}`}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout Section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200/80 bg-gradient-to-r from-gray-50/50 to-gray-50/30">
          <Link
            href="/api/auth/signout"
            onClick={onClose}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-gray-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 hover:text-red-600 transition-all duration-200 group"
          >
            <div className="group-hover:rotate-12 transition-transform duration-200 text-gray-500 group-hover:text-red-600">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="font-medium text-sm">Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
}

