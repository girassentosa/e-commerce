/**
 * Admin Reviews Page
 * Page for admins to view and manage all reviews
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/admin/DataTable';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { StarRating } from '@/components/reviews/StarRating';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Search, Filter, Trash2, Eye, Star, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useAdminHeader } from '@/contexts/AdminHeaderContext';

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

export default function AdminReviewsPage() {
  const router = useRouter();
  const { setHeader } = useAdminHeader();

  useEffect(() => {
    setHeader(Star, 'Reviews');
  }, [setHeader]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [ratingDropdownOpen, setRatingDropdownOpen] = useState(false);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(productFilter && { productId: productFilter }),
      });

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }

      setReviews(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      toast.error(error.message || 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, ratingFilter, productFilter]);

  useEffect(() => {
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

      toast.success('Review deleted successfully');
      fetchReviews();
      setShowDeleteDialog(false);
      setReviewToDelete(null);
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.message || 'Failed to delete review');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
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
        <StatusBadge
          status={review.isVerifiedPurchase ? 'PAID' : 'PENDING'}
          size="sm"
        />
      ),
      hideOnMobile: true,
    },
    {
      key: 'helpful',
      label: 'Helpful',
      render: (review: Review) => (
        <span className="text-sm text-gray-600">{review.helpfulCount}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'date',
      label: 'Date',
      render: (review: Review) => (
        <span className="text-sm text-gray-600">{formatDate(review.createdAt)}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (review: Review) => (
        <div className="flex items-center justify-end gap-2 flex-nowrap">
          <Link
            href={`/products/${review.product.slug}`}
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 active:scale-95 touch-manipulation flex items-center justify-center shrink-0"
            title="View"
          >
            <Eye className="w-4 h-4" />
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setReviewToDelete(review.id);
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
      <div className="bg-gradient-to-r from-yellow-600 via-amber-600 to-yellow-600 rounded-2xl p-6 sm:p-8 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3">
            <Star className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">Reviews Management</h1>
            <p className="text-yellow-100 text-sm sm:text-base mt-1">
              Manage and moderate all customer reviews • {totalCount} total reviews
            </p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="admin-filter-card">
        <div className="admin-card-header">
          <div className="flex items-center gap-2">
            <div className="bg-yellow-100 rounded-lg p-1.5">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Filters & Search</h2>
          </div>
        </div>
        <div className="p-4 sm:p-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Filters Grid - 3 Columns on All Devices */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
              {/* Search Input */}
              <div className="col-span-2">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  <span className="hidden sm:inline">Search Reviews</span>
                  <span className="sm:hidden">Search</span>
                </label>
                <div className="relative">
                  <div className="absolute left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 sm:pl-10 md:pl-12 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-xs sm:text-sm md:text-base py-2 sm:py-2.5"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="relative z-20">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">
                  Rating
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setRatingDropdownOpen(!ratingDropdownOpen);
                  }}
                  className="w-full px-2 sm:px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl bg-white text-gray-900 text-xs sm:text-sm md:text-base hover:border-yellow-300 transition-colors flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    {ratingFilter ? (
                      <Star className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${
                        ratingFilter === '5' ? 'text-yellow-500 fill-yellow-500' :
                        ratingFilter === '4' ? 'text-yellow-400 fill-yellow-400' :
                        ratingFilter === '3' ? 'text-yellow-300 fill-yellow-300' :
                        ratingFilter === '2' ? 'text-orange-400 fill-orange-400' :
                        'text-red-400 fill-red-400'
                      }`} />
                    ) : (
                      <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 shrink-0" />
                    )}
                    <span className="truncate">
                      {ratingFilter ? `${ratingFilter} Star${ratingFilter === '1' ? '' : 's'}` : 'All'}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-400 shrink-0 transition-transform ${ratingDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {ratingDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setRatingDropdownOpen(false)}
                    ></div>
                    <div
                      className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-2xl"
                      style={{
                        maxHeight: '9rem',
                        overflowY: 'auto',
                        WebkitOverflowScrolling: 'touch',
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#cbd5e1 #f1f5f9',
                        overscrollBehavior: 'contain'
                      }}
                      onWheel={(e) => {
                        e.stopPropagation();
                      }}
                      onTouchMove={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setRatingFilter('');
                            setCurrentPage(1);
                            setRatingDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-yellow-50 active:bg-yellow-100 transition-colors touch-manipulation ${
                            ratingFilter === '' ? 'bg-yellow-50 text-yellow-600' : 'text-gray-900'
                          }`}
                        >
                          <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                          <span>All</span>
                        </button>
                        {[5, 4, 3, 2, 1].map((rating) => (
                          <button
                            key={rating}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRatingFilter(rating.toString());
                              setCurrentPage(1);
                              setRatingDropdownOpen(false);
                            }}
                            className={`w-full px-3 py-2.5 text-left text-xs sm:text-sm flex items-center gap-2 hover:bg-yellow-50 active:bg-yellow-100 transition-colors touch-manipulation ${
                              ratingFilter === rating.toString() ? 'bg-yellow-50 text-yellow-600' : 'text-gray-900'
                            }`}
                          >
                            <Star className={`w-4 h-4 shrink-0 ${
                              rating === 5 ? 'text-yellow-500 fill-yellow-500' :
                              rating === 4 ? 'text-yellow-400 fill-yellow-400' :
                              rating === 3 ? 'text-yellow-300 fill-yellow-300' :
                              rating === 2 ? 'text-orange-400 fill-orange-400' :
                              'text-red-400 fill-red-400'
                            }`} />
                            <span>{rating} Star{rating === 1 ? '' : 's'}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Apply Button - Full Width on Mobile */}
            <div>
              <Button
                type="submit"
                variant="primary"
                className="w-full bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-700 hover:to-amber-700 text-white font-semibold rounded-lg sm:rounded-xl shadow-md hover:shadow-lg transition-all duration-200 py-2.5 sm:py-3"
              >
                <Filter className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                <span className="text-sm sm:text-base">Apply Filters</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Reviews Table Card */}
      <div className="admin-table-card">
        <DataTable
          columns={columns}
          data={reviews}
          loading={loading}
          emptyMessage="No reviews found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone and will update the product's rating."
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

