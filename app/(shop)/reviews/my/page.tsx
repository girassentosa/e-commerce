/**
 * My Reviews Page
 * Page for customers to view and manage their reviews
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReviewCard } from '@/components/reviews/ReviewCard';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Pagination } from '@/components/ui/Pagination';
import { Edit, Trash2, Package } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string | Date;
  product: {
    id: string;
    name: string;
    slug: string;
  };
  user: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatarUrl: string | null;
  };
}

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/reviews/my');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchMyReviews();
    }
  }, [status, currentPage]);

  const fetchMyReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/reviews?userId=${session?.user?.id}&page=${currentPage}&limit=10`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.data);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (review: Review & { product: { id: string; name: string; slug: string } }) => {
    setEditingReview(review);
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review');
      }

      toast.success('Review deleted successfully');
      fetchMyReviews();
    } catch (error: any) {
      console.error('Error deleting review:', error);
      toast.error(error.message || 'Failed to delete review');
    }
  };

  const handleSubmitReview = async (data: { rating: number; title?: string; comment?: string }) => {
    if (!editingReview) return;

    try {
      const response = await fetch(`/api/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update review');
      }

      toast.success('Review updated successfully!');
      setEditingReview(null);
      fetchMyReviews();
    } catch (error: any) {
      console.error('Error updating review:', error);
      toast.error(error.message || 'Failed to update review');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Reviews</h1>
        <p className="text-gray-600">Manage your product reviews</p>
      </div>

      {/* Edit Review Form */}
      {editingReview && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Edit Review</h2>
          <ReviewForm
            productId={editingReview.product.id}
            productName={editingReview.product.name}
            initialData={editingReview}
            onSubmit={handleSubmitReview}
            onCancel={() => setEditingReview(null)}
          />
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">You haven't written any reviews yet.</p>
          <Link href="/products">
            <Button variant="primary">Browse Products</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Link
                    href={`/products/${review.product.slug}`}
                    className="text-lg font-semibold text-indigo-600 hover:text-indigo-800 mb-2 block"
                  >
                    {review.product.name}
                  </Link>
                  <ReviewCard
                    review={review}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    showActions={true}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

