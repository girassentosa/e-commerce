'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Plus, Edit, Trash2, FolderTree, Search, Filter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  isActive: boolean;
  parent: {
    id: string;
    name: string;
  } | null;
  _count: {
    products: number;
    children: number;
  };
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { setHeader } = useAdminHeader();

  useEffect(() => {
    setHeader(FolderTree, 'Categories');
  }, [setHeader]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/categories');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch categories');
      }

      setCategories(data.data);
      setFilteredCategories(data.data);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (search.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(search.toLowerCase()) ||
        category.slug.toLowerCase().includes(search.toLowerCase()) ||
        (category.parent && category.parent.name.toLowerCase().includes(search.toLowerCase()))
      );
      setFilteredCategories(filtered);
    }
  }, [search, categories]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleClearFilters = () => {
    setSearch('');
  };

  const handleDelete = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete category');
      }

      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
    }
  };

  const columns = [
    {
      key: 'name',
      label: 'Category',
      render: (category: Category) => {
        const imageUrl = category.imageUrl;
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={imageUrl}
                  alt={category.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <FolderTree className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">{category.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-gray-500">Slug: {category.slug}</p>
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'parent',
      label: 'Parent Category',
      render: (category: Category) =>
        category.parent ? (
          <span className="text-gray-700">{category.parent.name}</span>
        ) : (
          <span className="text-gray-400 italic">None</span>
        ),
      hideOnMobile: true,
    },
    {
      key: 'products',
      label: 'Products',
      render: (category: Category) => (
        <Badge variant="default">{category._count.products}</Badge>
      ),
    },
    {
      key: 'subcategories',
      label: 'Subcategories',
      render: (category: Category) => (
        <Badge variant="secondary">{category._count.children}</Badge>
      ),
      hideOnMobile: true,
    },
    {
      key: 'status',
      label: 'Status',
      render: (category: Category) => (
        <Badge variant={category.isActive ? 'default' : 'secondary'}>
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (category: Category) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCategoryToDelete(category.id);
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
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
                <FolderTree className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Categories Management</h1>
                <p className="text-orange-100 text-sm sm:text-base mt-1">
                  {categories.length} total categories in your store
                </p>
              </div>
            </div>
          </div>
          <Link href="/admin/categories/new" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto bg-white text-orange-600 hover:bg-gray-100 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
              <Plus className="w-4 h-4 mr-2" />
              Add New Category
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters Card */}
      <div className="admin-filter-card">
        <div className="admin-card-header">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 rounded-lg p-1.5">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Filters & Search</h2>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Input - Full Width */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                <span className="hidden sm:inline">Search Categories</span>
                <span className="sm:hidden">Search</span>
              </label>
              <div className="relative">
                <div className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by name, slug, or parent category..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 sm:pl-10 md:pl-12 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                />
              </div>
            </div>

            {/* Apply Button - Full Width */}
            {search && (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClearFilters}
                  className="w-full border-orange-300 text-orange-600 hover:bg-orange-50 rounded-lg sm:rounded-xl"
                >
                  Clear Search
                </Button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        <DataTable
          columns={columns as any}
          data={filteredCategories}
          loading={loading}
          emptyMessage="No categories found"
        />
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone. Categories with products or subcategories cannot be deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (categoryToDelete) {
            handleDelete(categoryToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
          setCategoryToDelete(null);
        }}
      />
    </div>
  );
}

