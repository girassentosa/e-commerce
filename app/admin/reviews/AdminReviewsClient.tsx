'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StarRating } from '@/components/reviews/StarRating';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Search, Filter, Trash2, Star, ChevronDown } from 'lucide-react';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';
import { useNotification } from '@/contexts/NotificationContext';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface PaginationInfo {
  page: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

interface AdminReviewsClientProps {
  initialReviews: Review[];
  initialPagination: PaginationInfo;
}

export default function AdminReviewsClient({
  initialReviews,
  initialPagination,
}: AdminReviewsClientProps) {
  const { setHeader } = useAdminHeader();
  const { showSuccess, showError } = useNotification();

  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(initialPagination.page);
  const [totalPages, setTotalPages] = useState(initialPagination.totalPages);
  const [totalCount, setTotalCount] = useState(initialPagination.totalCount);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);

  const pageSize = initialPagination.limit || 20;
  const initialFetchSkipped = useRef(false);

  useEffect(() => {
    setHeader(Star, 'Reviews');
  }, [setHeader]);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(productFilter && { productId: productFilter }),
      });

      const response = await fetch(`/api/admin/reviews?${params}`, {
        cache: 'no-store',
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      showError('Gagal memuat ulasan', error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, productFilter, ratingFilter, search, showError]);

  useEffect(() => {
    if (!initialFetchSkipped.current) {
      initialFetchSkipped.current = true;
      return;
    }
    fetchReviews();
  }, [fetchReviews]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReviews();
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review');
      }

      showSuccess('Ulasan dihapus', 'Review deleted successfully');
      fetchReviews();
      setShowDeleteDialog(false);
      setReviewToDelete(null);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      showError('Gagal menghapus ulasan', error.message || 'Failed to delete review');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserName = (review: Review) => {
    if (review.user.firstName && review.user.lastName) {
      return `${review.user.firstName} ${review.user.lastName}`;
    }
    return review.user.email;
  };

  const ratingOptions = ['5', '4', '3', '2', '1'];

  const columns = [
    {
      key: 'product',
      label: 'Product',
      render: (review: Review) => (
        <Link
          href={`/products/${review.product.slug}`}
          className="text-indigo-600 hover:text-indigo-800 font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          {review.product.name}
        </Link>
      ),
    },
    {
      key: 'user',
      label: 'Customer',
      render: (review: Review) => (
        <div>
          <p className="font-medium text-gray-900">{getUserName(review)}</p>
          <p className="text-xs text-gray-500">{review.user.email}</p>
        </div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'rating',
      label: 'Rating',
      render: (review: Review) => <StarRating rating={review.rating} size="sm" />,
    },
    {
      key: 'title',
      label: 'Review',
      render: (review: Review) => (
        <div>
          {review.title ? (
            <p className="font-medium text-gray-900">{review.title}</p>
          ) : (
            <p className="text-gray-400 italic">No title</p>
          )}
          {review.comment && (
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{review.comment}</p>
          )}
        </div>
      ),
    },
    {
      key: 'verified',
      label: 'Verified',
      render: (review: Review) => (
        <StatusBadge status={review.isVerifiedPurchase ? 'PAID' : 'PENDING'} size="sm" />
      ),
      hideOnMobile: true,
    },
    {
      key: 'helpful',
      label: 'Helpful',
      render: (review: Review) => (
        <div className="text-sm text-gray-700 font-semibold">{review.helpfulCount}</div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (review: Review) => (
        <div className="text-sm text-gray-500">{formatDate(review.createdAt)}</div>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (review: Review) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setReviewToDelete(review.id);
              setShowDeleteDialog(true);
            }}
            className="p-2 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200"
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
        <div className="bg-gradient-to-r from-amber-50 via-white to-blue-50 px-6 py-4 border-b border-gray-200">
          <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            Reviews Management
          </h1>
        </div>
        <div className="p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <Search className="w-5 h-5" />
              </div>
              <Input
                type="text"
                placeholder="Search reviews by product, customer, or comment..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-11 pr-4 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="relative">
                <label className="block text-xs font-medium text-gray-600 mb-1">Rating</label>
                <button
                  type="button"
                  onClick={() => setRatingDropdownOpen(!ratingDropdownOpen)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm flex items-center justify-between"
                >
                  <span>{ratingFilter ? `${ratingFilter} stars` : 'All ratings'}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      ratingDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {ratingDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setRatingDropdownOpen(false)} />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      <button
                        type="button"
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                          ratingFilter === '' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                        }`}
                        onClick={() => {
                          setRatingFilter('');
                          setCurrentPage(1);
                          setRatingDropdownOpen(false);
                        }}
                      >
                        All ratings
                      </button>
                      {ratingOptions.map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                            ratingFilter === rating ? 'bg-indigo-50 text-indigo-600' : 'text-gray-900'
                          }`}
                          onClick={() => {
                            setRatingFilter(rating);
                            setCurrentPage(1);
                            setRatingDropdownOpen(false);
                          }}
                        >
                          {rating} Stars
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Product ID</label>
                <Input
                  type="text"
                  placeholder="Filter by product ID..."
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setSearch('');
                  setRatingFilter('');
                  setProductFilter('');
                  setCurrentPage(1);
                }}
              >
                Reset
              </Button>
            </div>
          </form>
        </div>
      </div>

      <div className="admin-table-card">
        <DataTable columns={columns as any} data={reviews} loading={loading} emptyMessage="No reviews found" />

        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Review"
        message="Are you sure you want to permanently delete this review? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={() => {
          if (reviewToDelete) {
            handleDelete(reviewToDelete);
          }
        }}
        onCancel={() => {
          setShowDeleteDialog(false);
          setReviewToDelete(null);
        }}
      />
    </div>
  );
}

