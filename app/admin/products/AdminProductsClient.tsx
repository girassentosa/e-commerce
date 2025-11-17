'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Package,
} from 'lucide-react';
import { useNotification } from '@/contexts/NotificationContext';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useCurrency } from '@/hooks/useCurrency';

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

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface AdminProductsClientProps {
  initialProducts: Product[];
  initialPagination: PaginationInfo;
}

export default function AdminProductsClient({
  initialProducts,
  initialPagination,
}: AdminProductsClientProps) {
  const { setHeader } = useAdminHeader();
  const { formatPrice } = useCurrency();
  const { showSuccess, showError, showConfirm } = useNotification();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalCount, setTotalCount] = useState(initialPagination.totalCount);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const initialFetchSkipped = useRef(false);
  const pageSize = initialPagination.limit || 20;

  useEffect(() => {
    setHeader(Package, 'Products');
  }, [setHeader]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/products?${params}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch products');
      }

      setProducts(data.data.products);
      setTotalPages(data.data.pagination.totalPages);
      setTotalCount(data.data.pagination.totalCount);
      setSelectedProducts(new Set());
    } catch (error: any) {
      console.error('Error fetching products:', error);
      showError('Gagal', error.message || 'Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, search, showError]);

  useEffect(() => {
    if (!initialFetchSkipped.current) {
      initialFetchSkipped.current = true;
      return;
    }
    fetchProducts();
  }, [fetchProducts]);

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

      const deletedImages = data.data?.deletedImages || 0;
      const failedImages = data.data?.failedImages || 0;

      if (failedImages > 0) {
        showSuccess(
          'Berhasil',
          `Produk berhasil dihapus. ${deletedImages} gambar dihapus, ${failedImages} gagal.`
        );
      } else {
        showSuccess('Berhasil', `Produk berhasil dihapus. Semua ${deletedImages} gambar dihapus.`);
      }

      fetchProducts();
      setShowDeleteDialog(false);
      setProductToDelete(null);
    } catch (error: any) {
      console.error('Error deleting product:', error);
      showError('Gagal', error.message || 'Gagal menghapus produk');
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

      showSuccess('Berhasil', `Produk berhasil ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchProducts();
    } catch (error: any) {
      console.error('Error updating product status:', error);
      showError('Gagal', error.message || 'Gagal memperbarui status produk');
    }
  };

  const performBulkDelete = async () => {
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
        showError('Gagal', `Gagal menghapus ${failedCount} produk`);
      } else {
        showSuccess(
          'Berhasil',
          `${successCount} produk berhasil dihapus secara permanen. Semua data terkait dihapus.`
        );
      }

      setSelectedProducts(new Set());
      fetchProducts();
    } catch (error) {
      console.error('Error bulk deleting products:', error);
      showError('Gagal', 'Gagal menghapus beberapa produk');
    }
  };

  const handleBulkDelete = () => {
    if (selectedProducts.size === 0) {
      showError('Peringatan', 'Tidak ada produk yang dipilih');
      return;
    }

    showConfirm(
      'Hapus Produk',
      `Apakah Anda yakin ingin menghapus ${selectedProducts.size} produk yang dipilih secara permanen?\n\nIni akan menghapus semua data terkait (gambar, varian, item keranjang, wishlist, review, item pesanan). Tindakan ini tidak dapat dibatalkan.`,
      performBulkDelete,
      undefined,
      'Ya, Hapus',
      'Batal',
      'danger'
    );
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
              <p className="font-bold text-sm sm:text-base text-gray-900 mb-1 line-clamp-2">
                {product.name}
              </p>
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
              <p className="text-xs text-gray-400 line-through">{formatPrice(product.price)}</p>
              <p className="font-bold text-base text-green-600">{formatPrice(product.salePrice)}</p>
            </>
          ) : (
            <p className="font-bold text-base text-gray-900">{formatPrice(product.price)}</p>
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
              <p className="text-sm text-gray-600">{totalCount} total products in your store</p>
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

      <div className="admin-table-card">
        <DataTable columns={columns as any} data={products} loading={loading} emptyMessage="No products found" />
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}

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

