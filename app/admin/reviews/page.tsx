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
import { Search, Filter, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

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
        <div className="flex items-center gap-2">
          <Link 
            href={`/products/${review.product.slug}`}
            onClick={(e) => e.stopPropagation()}
          >
            <Button variant="ghost" size="sm" className="w-full sm:w-auto">
              <Eye className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">View</span>
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setReviewToDelete(review.id);
              setShowDeleteDialog(true);
            }}
            className="text-red-600 hover:text-red-700 w-full sm:w-auto"
          >
            <Trash2 className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Delete</span>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Reviews</h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Manage and moderate all customer reviews ({totalCount} total)
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by product, customer, or review content..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <Button type="submit" variant="primary">
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setRatingFilter('');
                  setProductFilter('');
                  setCurrentPage(1);
                }}
              >
                Clear
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <DataTable
          columns={columns}
          data={reviews}
          loading={loading}
          emptyMessage="No reviews found"
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-gray-200">
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

