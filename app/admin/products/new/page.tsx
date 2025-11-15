'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { productSchema, ProductFormData } from '@/lib/validations/admin';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { z } from 'zod';
import { useCurrency } from '@/hooks/useCurrency';

interface Category {
  id: string;
  name: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { currency } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
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

    // Cleanup function: delete temporary images when component unmounts (user navigates away or cancels)
    return () => {
      const currentImages = uploadedImagesRef.current;
      
      // Delete all temporary files that were uploaded but not saved to DB
      // Use Promise.all to ensure all deletions are attempted
      Promise.all(
        currentImages.map(async (img) => {
          if (img.imageUrl && img.imageUrl.startsWith('/images/')) {
            try {
              await fetch('/api/admin/upload', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: img.imageUrl }),
              });
              console.log('✅ Cleaned up temporary image:', img.imageUrl);
            } catch (error) {
              console.error('⚠️ Failed to cleanup temporary image:', img.imageUrl, error);
            }
          }
        })
      ).catch((error) => {
        console.error('⚠️ Error during cleanup:', error);
      });
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
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

  const handleChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => {
      const updated = {
        ...prev,
        [field]: value,
      };
      
      // Track uploaded images for cleanup
      if (field === 'images') {
        uploadedImagesRef.current = value || [];
      }
      
      return updated;
    });

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
    router.push('/admin/products');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      // Validate form data
      const validatedData = productSchema.parse(formData);

      setLoading(true);

      // Submit to API
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create product');
      }

      // Clear uploaded images ref since product is saved (images are now in DB)
      uploadedImagesRef.current = [];

      toast.success('Product created successfully!');
      router.push('/admin/products');
    } catch (error) {
      // On error, cleanup uploaded images that weren't saved
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
              console.log('✅ Cleaned up image after error:', img.imageUrl);
            } catch (cleanupError) {
              console.error('⚠️ Failed to cleanup image after error:', img.imageUrl, cleanupError);
            }
          }
        })
      ).catch((cleanupError) => {
        console.error('⚠️ Error during error cleanup:', cleanupError);
      });
      // Clear ref after cleanup attempt
      uploadedImagesRef.current = [];

      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
        toast.error('Please fix the form errors');
      } else if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create product');
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
            Add New Product
          </h1>
          <div className="min-h-[44px] min-w-[44px]" />
        </div>
      </header>

      {/* Content dengan padding top untuk header */}
      <div className="min-h-screen bg-gray-50 pt-14 sm:pt-16">
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Basic Information */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="admin-card-header">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Basic Information</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Name *
                  </label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter product name"
                    error={errors.name}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slug *
                  </label>
                  <Input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleChange('slug', e.target.value)}
                    placeholder="product-slug"
                    error={errors.slug}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-generated from product name, or enter custom slug
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <Input
                      type="text"
                      value={formData.sku}
                      onChange={(e) => handleChange('sku', e.target.value)}
                      placeholder="PROD-001"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand
                    </label>
                    <Input
                      type="text"
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      placeholder="Brand name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
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
            </div>

            {/* Pricing & Inventory */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="admin-card-header">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Pricing & Inventory</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Regular Price * ({currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => handleChange('price', parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    error={errors.price}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sale Price ({currency})
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salePrice || ''}
                    onChange={(e) =>
                      handleChange('salePrice', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Stock Quantity *
                  </label>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Low Stock Threshold
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.lowStockThreshold}
                    onChange={(e) =>
                      handleChange('lowStockThreshold', parseInt(e.target.value) || 10)
                    }
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.weight || ''}
                    onChange={(e) =>
                      handleChange('weight', e.target.value ? parseFloat(e.target.value) : null)
                    }
                    placeholder="0.00"
                  />
                </div>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="admin-card-header">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Product Images</h2>
              </div>
              <div className="p-4 sm:p-6">
                <ImageUploader
                images={formData.images || []}
                onChange={(images) => handleChange('images', images)}
                maxImages={5}
                />
              </div>
            </div>

            {/* Specifications */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="admin-card-header">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Specifications (Optional)</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
                  {specifications.map((spec, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        type="text"
                        value={spec}
                        onChange={(e) => {
                          const newSpecs = [...specifications];
                          newSpecs[index] = e.target.value;
                          setSpecifications(newSpecs);
                          // Parse "Key, Value" format and update formData specifications
                          const specsObj: Record<string, string> = {};
                          newSpecs.forEach(s => {
                            const trimmed = s.trim();
                            if (trimmed) {
                              const commaIndex = trimmed.indexOf(',');
                              if (commaIndex > 0) {
                                const key = trimmed.substring(0, commaIndex).trim();
                                const value = trimmed.substring(commaIndex + 1).trim();
                                if (key && value) {
                                  specsObj[key] = value;
                                }
                              }
                            }
                          });
                          handleChange('specifications', specsObj);
                        }}
                        placeholder="Brand, Apple"
                        className="flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = specifications.filter((_, i) => i !== index);
                          setSpecifications(newSpecs);
                          // Update formData specifications
                          const specsObj: Record<string, string> = {};
                          newSpecs.forEach(s => {
                            const trimmed = s.trim();
                            if (trimmed) {
                              const commaIndex = trimmed.indexOf(',');
                              if (commaIndex > 0) {
                                const key = trimmed.substring(0, commaIndex).trim();
                                const value = trimmed.substring(commaIndex + 1).trim();
                                if (key && value) {
                                  specsObj[key] = value;
                                }
                              }
                            }
                          });
                          handleChange('specifications', specsObj);
                        }}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                        aria-label="Remove specification"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSpecifications([...specifications, '']);
                    }}
                    className="w-full py-2 px-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors text-sm font-medium"
                  >
                    + Add Specification
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Format: <span className="font-mono">Key, Value</span> (contoh: Brand, Apple)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Category */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="admin-card-header">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Category *</h2>
              </div>
              <div className="p-4 sm:p-6">
                <select
                value={formData.categoryId}
                onChange={(e) => handleChange('categoryId', e.target.value)}
                className={`
                  w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  ${errors.categoryId ? 'border-red-500' : 'border-gray-300'}
                `}
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
              )}
              </div>
            </div>

            {/* Status */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="admin-card-header">
                <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">Status</h2>
              </div>
              <div className="p-4 sm:p-6">
                <div className="space-y-3">
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
            </div>

            {/* Actions */}
            <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
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
      </div>
    </>
  );
}

