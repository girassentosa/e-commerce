'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { categorySchema, CategoryFormData } from '@/lib/validations/admin';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { useNotification } from '@/contexts/NotificationContext';

interface Category {
  id: string;
  name: string;
}

export default function NewCategoryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState<Partial<CategoryFormData>>({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: null,
    isActive: true,
  });

  // Hide AdminHeader and AdminSidebar dengan CSS - HARUS dipanggil sebelum conditional return
  useEffect(() => {
    // Hide AdminHeader - cari header di dalam admin-main-content
    const adminMainContent = document.querySelector('.admin-main-content');
    if (adminMainContent) {
      const adminHeader = adminMainContent.querySelector('header');
      if (adminHeader) {
        (adminHeader as HTMLElement).style.display = 'none';
      }
      
      // Remove margin-left dan width constraint
      (adminMainContent as HTMLElement).style.marginLeft = '0';
      (adminMainContent as HTMLElement).style.width = '100%';
    }
    
    // Hide AdminSidebar
    const adminSidebar = document.querySelector('.admin-sidebar');
    if (adminSidebar) {
      (adminSidebar as HTMLElement).style.display = 'none';
    }
    
    // Remove padding dari admin-content-wrapper agar content bisa full width
    const adminContentWrapper = document.querySelector('.admin-content-wrapper');
    if (adminContentWrapper) {
      (adminContentWrapper as HTMLElement).style.padding = '0';
    }

    return () => {
      // Restore saat unmount
      if (adminMainContent) {
        const adminHeader = adminMainContent.querySelector('header');
        if (adminHeader) {
          (adminHeader as HTMLElement).style.display = '';
        }
        (adminMainContent as HTMLElement).style.marginLeft = '';
        (adminMainContent as HTMLElement).style.width = '';
      }
      if (adminSidebar) {
        (adminSidebar as HTMLElement).style.display = '';
      }
      if (adminContentWrapper) {
        (adminContentWrapper as HTMLElement).style.padding = '';
      }
    };
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      if (response.ok) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleChange = (field: keyof CategoryFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      setFormData((prev) => ({
        ...prev,
        slug: generateSlug(value),
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleBack = () => {
    router.push('/admin/categories');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      const validatedData = categorySchema.parse({
        ...formData,
        parentId: formData.parentId || null,
        imageUrl: formData.imageUrl || null,
      });

      setLoading(true);

      // Submit to API
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create category');
      }

      showSuccess('Kategori dibuat', 'Category created successfully!');
      router.push('/admin/categories');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        showError('Periksa formulir', 'Please fix the form errors');
      } else if (error instanceof Error) {
        showError('Gagal membuat kategori', error.message);
      } else {
        showError('Gagal membuat kategori', 'Failed to create category');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header Full Width - Keluar dari container admin */}
      <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm border-b border-gray-200">
        <div className="flex items-center justify-between h-14 sm:h-16 px-4 sm:px-6 w-full">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Kembali"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
            Add New Category
          </h1>
          <div className="min-h-[44px] min-w-[44px]" />
        </div>
      </header>

      {/* Content dengan padding top untuk header */}
      <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="admin-card-header">
            <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Category Information</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category Name *
            </label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter category name"
              error={errors.name}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e) => handleChange('slug', e.target.value)}
              placeholder="category-slug"
              error={errors.slug}
            />
            <p className="text-xs text-gray-500 mt-1">
              Auto-generated from category name, or enter custom slug
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Category description..."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Image URL
            </label>
            <Input
              type="text"
              value={formData.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="https://example.com/image.jpg"
              error={errors.imageUrl}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Category
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) => handleChange('parentId', e.target.value || null)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">None (Top Level)</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select a parent to make this a subcategory
            </p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked)}
                className="admin-checkbox bg-white border-2 border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Category'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
        </div>
      </div>
    </>
  );
}

