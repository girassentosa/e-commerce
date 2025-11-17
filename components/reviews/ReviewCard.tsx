/**
 * ReviewCard Component
 * Card component for displaying a single review
 */

'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Star, ThumbsUp, CheckCircle, Edit, Trash2 } from 'lucide-react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';
import { useNotification } from '@/contexts/NotificationContext';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: string | Date;
  product?: {
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

interface ReviewCardProps {
  review: Review;
  onEdit?: (review: Review & { product: { id: string; name: string; slug: string } }) => void;
  onDelete?: (reviewId: string) => void;
  onHelpful?: (reviewId: string) => void;
  showActions?: boolean;
}

export function ReviewCard({
  review,
  onEdit,
  onDelete,
  onHelpful,
  showActions = true,
}: ReviewCardProps) {
  const { data: session } = useSession();
  const [helpfulLoading, setHelpfulLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { showError, showConfirm } = useNotification();

  const isOwnReview = session?.user?.id === review.user.id;
  const isAdmin = session?.user?.role === 'ADMIN';

  const getUserName = () => {
    if (review.user.firstName && review.user.lastName) {
      return `${review.user.firstName} ${review.user.lastName}`;
    }
    return review.user.email.split('@')[0];
  };

  const getAvatarInitial = () => {
    const name = getUserName();
    return name[0].toUpperCase();
  };

  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleHelpful = async () => {
    if (!onHelpful) return;

    try {
      setHelpfulLoading(true);
      await onHelpful(review.id);
    } catch (error) {
      console.error('Error marking review as helpful:', error);
    } finally {
      setHelpfulLoading(false);
    }
  };

  const handleDelete = () => {
    if (!onDelete) return;

    showConfirm(
      'Hapus ulasan?',
      'Ulasan yang dihapus tidak dapat dikembalikan.',
      async () => {
        try {
          setDeleting(true);
          await onDelete(review.id);
        } catch (error) {
          console.error('Error deleting review:', error);
          showError('Gagal menghapus ulasan', 'Terjadi kesalahan saat menghapus ulasan.');
        } finally {
          setDeleting(false);
        }
      },
      undefined,
      'Hapus',
      'Batal',
      'danger'
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-4 flex-1">
          {/* Avatar */}
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0">
            {review.user.avatarUrl ? (
              <Image
                src={review.user.avatarUrl}
                alt={getUserName()}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              getAvatarInitial()
            )}
          </div>

          {/* User Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-900">{getUserName()}</h4>
              {review.isVerifiedPurchase && (
                <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Verified Purchase
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <StarRating rating={review.rating} size="sm" />
              <span className="text-sm text-gray-500">{formatDate(review.createdAt)}</span>
            </div>
            {review.title && (
              <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
            )}
          </div>
        </div>

        {/* Actions */}
        {showActions && (isOwnReview || isAdmin) && (
          <div className="flex items-center gap-2">
            {isOwnReview && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (review.product && onEdit) {
                    onEdit(review as Review & { product: { id: string; name: string; slug: string } });
                  }
                }}
                className="text-gray-600 hover:text-indigo-600"
              >
                <Edit className="w-4 h-4" />
              </Button>
            )}
            {(isOwnReview || isAdmin) && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="text-gray-600 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-gray-700 mb-4 whitespace-pre-wrap">{review.comment}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        {onHelpful && (
          <button
            onClick={handleHelpful}
            disabled={helpfulLoading}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors disabled:opacity-50"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful ({review.helpfulCount})</span>
          </button>
        )}
        {!onHelpful && review.helpfulCount > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <ThumbsUp className="w-4 h-4" />
            <span>{review.helpfulCount} helpful</span>
          </div>
        )}
      </div>
    </div>
  );
}

