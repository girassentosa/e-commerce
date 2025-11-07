'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Plus, Edit, Trash2, FolderTree } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
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
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error(error.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
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
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={category.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <FolderTree className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{category.name}</p>
              <p className="text-xs text-gray-500">Slug: {category.slug}</p>
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
        <div className="flex gap-2">
          <Link
            href={`/admin/categories/${category.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-900"
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
            className="text-red-600 hover:text-red-900"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{categories.length} total categories</p>
        </div>
        <Link href="/admin/categories/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <DataTable
          columns={columns as any}
          data={categories}
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

