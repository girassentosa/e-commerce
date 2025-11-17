'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { productSchema, ProductFormData } from '@/lib/validations/admin';
import { useNotification } from '@/contexts/NotificationContext';
import { formatIndonesianNumber, parseIndonesianNumber } from '@/lib/utils';

interface CategoryOption {
  id: string;
  name: string;
}

interface NewProductClientProps {
  categories: CategoryOption[];
  currency: string;
}

export default function NewProductClient({ categories, currency }: NewProductClientProps) {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const uploadedImagesRef = useRef<Array<{ imageUrl: string; altText?: string }>>([]);

  const [formData, setFormData] = useState<Partial<ProductFormData>>({
    categoryId: '',
    name: '',
    slug: '',
    sku: '',
    description: '',
    price: 0,
    salePrice: null,
    stockQuantity: 0,
    lowStockThreshold: 10,
    weight: null,
    brand: '',
    isFeatured: false,
    isActive: true,
    specifications: {},
    images: [],
  });

  const [specifications, setSpecifications] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      const currentImages = uploadedImagesRef.current;
      Promise.all(
        currentImages.map(async (img) => {
          if (img.imageUrl && img.imageUrl.startsWith('/images/')) {
            try {
              await fetch('/api/admin/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: img.imageUrl }),
              });
            } catch (error) {
              console.error('Failed to cleanup temporary image:', img.imageUrl, error);
            }
          }
        })
      ).catch((error) => console.error('Cleanup error:', error));
    };
  }, []);

  const generateSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'images') {
        uploadedImagesRef.current = value || [];
      }
      return next;
    });

    if (field === 'name' && typeof value === 'string') {
      setFormData((prev) => ({ ...prev, slug: generateSlug(value) }));
    }

    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validatedData = productSchema.parse(formData);
      setLoading(true);

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      uploadedImagesRef.current = [];
      showSuccess('Produk dibuat', 'Product created successfully!');
      router.push('/admin/products');
    } catch (error) {
      const currentImages = uploadedImagesRef.current;
      Promise.all(
        currentImages.map(async (img) => {
          if (img.imageUrl && img.imageUrl.startsWith('/images/')) {
            try {
              await fetch('/api/admin/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: img.imageUrl }),
              });
            } catch (cleanupError) {
              console.error('Failed to cleanup image after error:', img.imageUrl, cleanupError);
            }
          }
        })
      ).catch((cleanupError) => console.error('Cleanup error:', cleanupError));
      uploadedImagesRef.current = [];

      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((issue) => {
          if (issue.path[0]) {
            fieldErrors[issue.path[0].toString()] = issue.message;
          }
        });
        setErrors(fieldErrors);
        showError('Periksa formulir', 'Please fix the form errors');
      } else if (error instanceof Error) {
        showError('Gagal membuat produk', error.message);
      } else {
        showError('Gagal membuat produk', 'Failed to create product');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateSpecifications = (entries: string[]) => {
    setSpecifications(entries);
    const specsObj: Record<string, string> = {};
    entries.forEach((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return;
      const commaIndex = trimmed.indexOf(',');
      if (commaIndex > 0) {
        const key = trimmed.substring(0, commaIndex).trim();
        const value = trimmed.substring(commaIndex + 1).trim();
        if (key && value) {
          specsObj[key] = value;
        }
      }
    });
    handleChange('specifications', specsObj);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Kembali"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Add New Product</h1>
          <p className="text-sm text-gray-500">Isi detail produk dengan lengkap sebelum menyimpan.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="admin-card-header">
                <h2 className="text-base font-semibold text-gray-900">Basic Information</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter product name"
                    error={errors.name}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <Input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="product-slug"
                    error={errors.slug}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated from product name, or enter custom slug</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <Input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      placeholder="PROD-001"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <Input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder="Brand name"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Product description..."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="admin-card-header">
                <h2 className="text-base font-semibold text-gray-900">Pricing & Inventory</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Regular Price * ({currency})
                    </label>
                    <Input
                      type="text"
                      value={formatIndonesianNumber(formData.price)}
                      onChange={(e) => {
                        const parsed = parseIndonesianNumber(e.target.value);
                        handleChange('price', parsed !== null ? parsed : 0);
                      }}
                      placeholder="0"
                      error={errors.price}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sale Price ({currency})
                    </label>
                    <Input
                      type="text"
                      value={formatIndonesianNumber(formData.salePrice)}
                      onChange={(e) => {
                        const parsed = parseIndonesianNumber(e.target.value);
                        handleChange('salePrice', parsed);
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity *</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stockQuantity}
                      onChange={(e) => handleChange('stockQuantity', parseInt(e.target.value) || 0)}
                      placeholder="0"
                      error={errors.stockQuantity}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Threshold</label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.lowStockThreshold}
                      onChange={(e) => handleChange('lowStockThreshold', parseInt(e.target.value) || 10)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.weight || ''}
                      onChange={(e) => handleChange('weight', e.target.value ? parseFloat(e.target.value) : null)}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="admin-card-header">
                <h2 className="text-base font-semibold text-gray-900">Product Images</h2>
              </div>
              <div className="p-6">
                <ImageUploader
                  images={formData.images || []}
                  onChange={(images) => handleChange('images', images)}
                  maxImages={5}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="admin-card-header">
                <h2 className="text-base font-semibold text-gray-900">Specifications (Optional)</h2>
              </div>
              <div className="p-6 space-y-3">
                {specifications.map((spec, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <Input
                      type="text"
                      value={spec}
                      onChange={(e) => {
                        const updated = [...specifications];
                        updated[index] = e.target.value;
                        updateSpecifications(updated);
                      }}
                      placeholder="Brand, Apple"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = specifications.filter((_, i) => i !== index);
                        updateSpecifications(updated);
                      }}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove specification"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => updateSpecifications([...specifications, ''])}
                  className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                >
                  + Add Specification
                </button>
                <p className="text-xs text-gray-500">
                  Format: <span className="font-mono">Key, Value</span> (contoh: Brand, Apple)
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="admin-card-header">
                <h2 className="text-base font-semibold text-gray-900">Category *</h2>
              </div>
              <div className="p-6">
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.categoryId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="admin-card-header">
                <h2 className="text-base font-semibold text-gray-900">Status</h2>
              </div>
              <div className="p-6 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleChange('isActive', e.target.checked)}
                    className="admin-checkbox bg-white border-2 border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={(e) => handleChange('isFeatured', e.target.checked)}
                    className="admin-checkbox bg-white border-2 border-gray-300 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 checked:bg-blue-600 checked:border-blue-600 transition-colors cursor-pointer"
                  />
                  <span className="text-sm font-medium text-gray-700">Featured</span>
                </label>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Product'
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

