'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useNotification } from '@/contexts/NotificationContext';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  Filter,
  Shield,
  User,
  ChevronDown,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: 'ADMIN' | 'CUSTOMER';
  isActive: boolean;
  createdAt: string;
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface AdminUsersClientProps {
  initialUsers: AdminUser[];
  initialPagination: PaginationInfo;
}

export default function AdminUsersClient({
  initialUsers,
  initialPagination,
}: AdminUsersClientProps) {
  const { setHeader } = useAdminHeader();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalCount, setTotalCount] = useState(initialPagination.totalCount);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  const pageSize = initialPagination.limit || 20;
  const initialFetchSkipped = useRef(false);

  useEffect(() => {
    setHeader(Users, 'Users');
  }, [setHeader]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(roleFilter && { role: roleFilter }),
      });

      const response = await fetch(`/api/admin/users?${params}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users');
      }

      setUsers(data.data.users);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.totalCount);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      showError('Gagal memuat pengguna', error.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, roleFilter, search, showError]);

  useEffect(() => {
    if (!initialFetchSkipped.current) {
      initialFetchSkipped.current = true;
      return;
    }
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

      const avatarDeleted = data.data?.avatarDeleted || false;
      showSuccess(
        'Pengguna dihapus',
        avatarDeleted
          ? 'User permanently deleted. Avatar file removed.'
          : 'User permanently deleted. All related data removed.'
      );

      fetchUsers();
      setShowDeleteDialog(false);
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      showError('Gagal menghapus pengguna', error.message || 'Failed to delete user');
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (user: AdminUser) => {
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
                  alt={
                    user.firstName && user.lastName
                      ? `${user.firstName} ${user.lastName}`
                      : user.email
                  }
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
                {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
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
      render: (user: AdminUser) => user.phone || <span className="text-gray-400">-</span>,
      hideOnMobile: true,
    },
    {
      key: 'role',
      label: 'Role',
      render: (user: AdminUser) => (
        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>{user.role}</Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (user: AdminUser) => (
        <Badge variant={user.isActive ? 'default' : 'destructive'}>
          {user.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      render: (user: AdminUser) => new Date(user.createdAt).toLocaleDateString(),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: AdminUser) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <Link
            href={`/admin/users/${user.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-95"
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
            className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 active:scale-95"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Users Management
          </h1>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">{totalCount} total users registered</p>
            </div>
            <Link href="/admin/users/new" className="w-full sm:w-auto shrink-0">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Add New User
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="admin-filter-card">
        <div className="admin-card-header">
          <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Filters & Search
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              <div className="col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Search Users
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 sm:pl-11 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="relative z-20">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Role
                </label>
                <button
                  type="button"
                  onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 text-sm hover:border-indigo-300 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {roleFilter === 'ADMIN' ? (
                      <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                    ) : roleFilter === 'CUSTOMER' ? (
                      <User className="w-4 h-4 text-blue-500 shrink-0" />
                    ) : (
                      <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {roleFilter === 'ADMIN'
                        ? 'Admin'
                        : roleFilter === 'CUSTOMER'
                        ? 'Customer'
                        : 'All'}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${
                      roleDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {roleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRoleDropdownOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-2xl">
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRoleFilter('');
                            setCurrentPage(1);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-indigo-50 ${
                            roleFilter === '' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                          }`}
                        >
                          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>All</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleFilter('ADMIN');
                            setCurrentPage(1);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-purple-50 ${
                            roleFilter === 'ADMIN' ? 'bg-purple-50 text-purple-600' : 'text-gray-900'
                          }`}
                        >
                          <Shield className="w-4 h-4 text-purple-500 shrink-0" />
                          <span>Admin</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRoleFilter('CUSTOMER');
                            setCurrentPage(1);
                            setRoleDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-sm flex items-center gap-2 hover:bg-blue-50 ${
                            roleFilter === 'CUSTOMER'
                              ? 'bg-blue-50 text-blue-600'
                              : 'text-gray-900'
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

            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg shadow-md py-2.5"
              >
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="admin-table-card">
        <DataTable columns={columns as any} data={users} loading={loading} emptyMessage="No users found" />

        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Permanently Delete User"
        message={`Are you sure you want to permanently delete this user?

• User avatar file (from disk)
• All user orders (historical data will be lost)
• All user cart items
• All user wishlist items
• All user reviews
• All user shipping addresses
• All user notifications

This action cannot be undone.`}
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

