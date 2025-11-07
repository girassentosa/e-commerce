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
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={product.name}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                <Package className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-gray-900">{product.name}</p>
              <p className="text-xs text-gray-500">SKU: {product.sku || 'N/A'}</p>
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
        <div>
          <p className="font-semibold text-gray-900">
            ${parseFloat(product.price).toFixed(2)}
          </p>
          {product.salePrice && (
            <p className="text-xs text-green-600">
              Sale: ${parseFloat(product.salePrice).toFixed(2)}
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
        >
          {product.stockQuantity}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (product: Product) => (
        <div className="flex gap-2 flex-wrap">
          <Badge variant={product.isActive ? 'default' : 'secondary'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
          {product.isFeatured && <Badge variant="default">Featured</Badge>}
        </div>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (product: Product) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(product.id, product.isActive);
            }}
            className="text-gray-600 hover:text-gray-900"
            title={product.isActive ? 'Deactivate' : 'Activate'}
          >
            {product.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
          <Link
            href={`/admin/products/${product.id}/edit`}
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:text-blue-900"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">{totalCount} total products</p>
        </div>
        <Link href="/admin/products/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
        <form onSubmit={handleSearch} className="space-y-3 sm:space-y-0 sm:flex sm:gap-3 sm:flex-wrap">
          <div className="flex-1 min-w-[200px] relative">
            <Input
              type="text"
              placeholder="Search by name, SKU, or brand..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <Button type="submit" variant="outline" className="w-full sm:w-auto">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-blue-900 font-medium text-sm sm:text-base">
            {selectedProducts.size} product(s) selected
          </p>
          <Button 
            variant="outline" 
            onClick={handleBulkDelete} 
            className="text-red-600 border-red-300 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
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

