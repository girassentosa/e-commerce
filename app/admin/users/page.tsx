'use client';

import { useEffect, useState, useCallback } from 'react';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Plus, Search, Edit, Trash2, UserCircle, Users, Filter, Shield, User, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const { setHeader } = useAdminHeader();

  useEffect(() => {
    setHeader(Users, 'Users');
  }, [setHeader]);

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.data.users);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.totalCount);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchUsers();
  };

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete user');
      }

      // Show detailed success message
      const avatarDeleted = data.data?.avatarDeleted || false;
      
      if (avatarDeleted) {
        toast.success(
          `User permanently deleted. Avatar file removed.`,
          { duration: 4000 }
        );
      } else {
        toast.success(
          `User permanently deleted. All related data removed.`,
          { duration: 4000 }
        );
      }

      fetchUsers();
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user: User) => {
        // Get avatar initial (from firstName, lastName, or email)
        const avatarInitial = 
          user.firstName?.[0]?.toUpperCase() || 
          user.lastName?.[0]?.toUpperCase() || 
          user.email[0].toUpperCase() || 
          'U';
        
        return (
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={user.avatarUrl}
                  alt={user.firstName && user.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user.email}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 border border-gray-200">
                <span className="text-lg sm:text-xl">{avatarInitial}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.email}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'phone',
      label: 'Phone',
      render: (user: User) => user.phone || <span className="text-gray-400">-</span>,
      hideOnMobile: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => (
        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user: User) => (
        <Badge variant={user.isActive ? 'default' : 'destructive'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (user: User) => new Date(user.createdAt).toLocaleDateString(),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <Link
            href={`/admin/users/${user.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setUserToDelete(user.id);
              setShowDeleteDialog(true);
            }}
            className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Users Management</h1>
                <p className="text-indigo-100 text-sm sm:text-base mt-1">
                  {totalCount} total users registered in your platform
                </p>
              </div>
            </div>
          </div>
          <Link href="/admin/users/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-white text-indigo-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add New User
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="admin-filter-card">
        <div className="admin-card-header">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 rounded-lg p-1.5">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Filters & Search</h2>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Filters Grid - 3 Columns on All Devices */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {/* Search Input */}
              <div className="col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <span className="hidden sm:inline">Search Users</span>
                  <span className="sm:hidden">Search</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 sm:pl-10 md:pl-12 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  />
                </div>
              </div>

              {/* Role Filter */}
              <div className="relative z-20">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Role
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRoleDropdownOpen(!roleDropdownOpen);
                  }}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-900 text-xs sm:text-sm md:text-base hover:border-indigo-300 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {roleFilter === 'ADMIN' ? (
                      <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-500 shrink-0" />
                    ) : roleFilter === 'CUSTOMER' ? (
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                    ) : (
                      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {roleFilter === 'ADMIN' ? 'Admin' : 
                       roleFilter === 'CUSTOMER' ? 'Customer' : 
                       'All'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0 transition-transform ${roleDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {roleDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setRoleDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-2xl"
                      style={{
                        maxHeight: '9rem',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9',
                        overscrollBehavior: 'contain'
                      }}
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleFilter('');
                            setCurrentPage(1);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-indigo-50 active:bg-indigo-100 transition-colors touch-manipulation ${
                            roleFilter === '' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                          }`}
                        >
                          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>All</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleFilter('ADMIN');
                            setCurrentPage(1);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-purple-50 active:bg-purple-100 transition-colors touch-manipulation ${
                            roleFilter === 'ADMIN' ? 'bg-purple-50 text-purple-600' : 'text-gray-900'
                          }`}
                        >
                          <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>Admin</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRoleFilter('CUSTOMER');
                            setCurrentPage(1);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation ${
                            roleFilter === 'CUSTOMER' ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                          }`}
                        >
                          <User className="w-4 h-4 text-blue-500 shrink-0" />
                          <span>Customer</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Apply Button - Full Width on Mobile */}
            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 py-2.5 sm:py-3"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Apply Filters</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        <DataTable
          columns={columns as any}
          data={users}
          loading={loading}
          emptyMessage="No users found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Permanently Delete User"
        message="Are you sure you want to permanently delete this user? This will delete:
        
• User avatar file (from disk)
• All user orders (historical data will be lost)
• All user cart items
• All user wishlist items
• All user reviews (customer reviews will be lost)
• All user shipping addresses
• All user notifications
• The user account itself

This action cannot be undone. The user's email can be reused after deletion."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (userToDelete) {
            handleDelete(userToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
          setUserToDelete(null);
        }}
      />
    </div>
  );
}

