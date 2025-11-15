'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
  FolderTree,
  CheckCircle2,
  XCircle,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  price: string;
  salePrice: string | null;
  stockQuantity: number;
  brand: string | null;
  isFeatured: boolean;
  isActive: boolean;
  category: {
    id: string;
    name: string;
  };
  images: Array<{
    id: string;
    imageUrl: string;
    altText: string | null;
  }>;
}

export default function AdminProductsPage() {
  const router = useRouter();
  const { setHeader } = useAdminHeader();

  useEffect(() => {
    setHeader(Package, 'Products');
  }, [setHeader]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(categoryFilter && { category: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await fetch(`/api/admin/products?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.data.products);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.totalCount);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, categoryFilter, statusFilter]);

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

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProducts();
  };

  const handleDelete = async (productId: string) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete product');
      }

      // Show detailed success message
      const deletedImages = data.data?.deletedImages || 0;
      const failedImages = data.data?.failedImages || 0;
      
      if (failedImages > 0) {
        toast.success(
          `Product permanently deleted. ${deletedImages} image(s) deleted, ${failedImages} failed.`,
          { duration: 5000 }
        );
      } else {
        toast.success(
          `Product permanently deleted. All ${deletedImages} image(s) removed.`,
          { duration: 4000 }
        );
      }

      fetchProducts();
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleToggleStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product status');
      }

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product status:', error);
      toast.error(error.message || 'Failed to update product status');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) {
      toast.error('No products selected');
      return;
    }

    if (
      !confirm(
        `Permanently delete ${selectedProducts.size} selected product(s)?\n\nThis will delete all related data (images, variants, cart items, wishlist, reviews, order items). This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedProducts).map(async (id) => {
        const response = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
        const data = await response.json();
        return { id, success: response.ok, data };
      });

      const results = await Promise.all(deletePromises);
      const successCount = results.filter((r) => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        toast.error(`Failed to delete ${failedCount} product(s)`);
      } else {
        toast.success(
          `${successCount} product(s) permanently deleted. All related data removed.`,
          { duration: 4000 }
        );
      }

      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      toast.error('Failed to delete some products');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(new Set(products.map((p) => p.id)));
    } else {
      setSelectedProducts(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedProducts);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedProducts(newSelected);
  };

  const columns = [
    {
      key: 'checkbox',
      label: (
        <input
          type="checkbox"
          checked={selectedProducts.size === products.length && products.length > 0}
          onChange={(e) => handleSelectAll(e.target.checked)}
          className="w-4 h-4"
        />
      ),
      render: (product: Product) => (
        <input
          type="checkbox"
          checked={selectedProducts.has(product.id)}
          onChange={(e) => handleSelectProduct(product.id, e.target.checked)}
          className="w-4 h-4"
        />
      ),
      hideOnMobile: true,
    },
    {
      key: 'name',
      label: 'Product',
      render: (product: Product) => {
        const imageUrl = product.images[0]?.imageUrl;
        return (
          <div className="flex items-center gap-3">
            {imageUrl ? (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
                <Package className="w-7 h-7 sm:w-8 sm:h-8 text-gray-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">{product.name}</p>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
                {product.brand && (
                  <>
                    <span className="text-gray-300">•</span>
                    <p className="text-xs text-gray-500">{product.brand}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      label: 'Category',
      render: (product: Product) => product.category.name,
      hideOnMobile: true,
    },
    {
      key: 'price',
      label: 'Price',
      render: (product: Product) => (
        <div className="flex flex-col">
          {product.salePrice ? (
            <>
              <p className="text-xs text-gray-400 line-through">
                ${parseFloat(product.price).toFixed(2)}
              </p>
              <p className="font-bold text-base text-green-600">
                ${parseFloat(product.salePrice).toFixed(2)}
              </p>
            </>
          ) : (
            <p className="font-bold text-base text-gray-900">
              ${parseFloat(product.price).toFixed(2)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      label: 'Stock',
      render: (product: Product) => (
        <Badge
          variant={
            product.stockQuantity === 0
              ? 'destructive'
              : product.stockQuantity < 10
              ? 'secondary'
              : 'default'
          }
          className="text-xs px-2.5 py-1 font-semibold"
        >
          {product.stockQuantity} {product.stockQuantity === 1 ? 'item' : 'items'}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: Product) => (
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge 
            variant={product.isActive ? 'default' : 'secondary'}
            className="text-xs px-2 py-0.5"
          >
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {product.isFeatured && (
            <Badge 
              variant="default"
              className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 border-purple-200"
            >
              Featured
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product: Product) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(product.id, product.isActive);
            }}
            className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title={product.isActive ? 'Deactivate' : 'Activate'}
          >
            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setProductToDelete(product.id);
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Products Management
          </h1>
        </div>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600">
                {totalCount} total products in your store
              </p>
            </div>
            <Link href="/admin/products/new" className="w-full sm:w-auto shrink-0">
              <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200">
                <Plus className="w-4 h-4 mr-2" />
                Add New Product
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Search Bar Only - Clean & Simple */}
      <div className="admin-filter-card">
        <div className="admin-card-header">
          <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            Search Products
          </h2>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <div className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <Input
                type="text"
                placeholder="Search products by name, SKU, or brand..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 sm:pl-12 pr-4 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base py-3 sm:py-3.5 w-full"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 rounded-lg p-2">
              <Package className="w-5 h-5 text-white" />
            </div>
            <p className="text-blue-900 font-semibold text-sm sm:text-base">
              {selectedProducts.size} product(s) selected
            </p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleBulkDelete} 
            className="text-red-600 border-red-300 hover:bg-red-50 w-full sm:w-auto rounded-xl font-semibold"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table Card */}
      <div className="admin-table-card">
        <DataTable
          columns={columns as any}
          data={products}
          loading={loading}
          emptyMessage="No products found"
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Permanently Delete Product"
        message="Are you sure you want to permanently delete this product? This will delete:
        
• All product images (from database and disk)
• All product variants
• All cart items containing this product
• All wishlist items for this product
• All reviews for this product
• All order items referencing this product (historical data will be lost)

This action cannot be undone. The product's slug and SKU can be reused after deletion."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (productToDelete) {
            handleDelete(productToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
          setProductToDelete(null);
        }}
      />
    </div>
  );
}

