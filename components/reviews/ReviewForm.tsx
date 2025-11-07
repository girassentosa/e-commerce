/**
 * ReviewForm Component
 * Form for creating or editing a review
 */

'use client';

import { useState, useEffect } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';

interface Review {
  id?: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
}

interface ReviewFormProps {
  productId: string;
  productName?: string;
  initialData?: Review;
  onSubmit: (data: { rating: number; title?: string; comment?: string }) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
}

export function ReviewForm({
  productId,
  productName,
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: ReviewFormProps) {
  const [rating, setRating] = useState(initialData?.rating || 0);
  const [title, setTitle] = useState(initialData?.title || '');
  const [comment, setComment] = useState(initialData?.comment || '');
  const [errors, setErrors] = useState<{ rating?: string; title?: string; comment?: string }>({});

  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating || 0);
      setTitle(initialData.title || '');
      setComment(initialData.comment || '');
    }
  }, [initialData]);

  const validate = () => {
    const newErrors: { rating?: string; title?: string; comment?: string } = {};

    if (rating < 1 || rating > 5) {
      newErrors.rating = 'Please select a rating';
    }

    if (title && title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (comment && comment.length > 2000) {
      newErrors.comment = 'Comment must be less than 2000 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    await onSubmit({
      rating,
      title: title.trim() || undefined,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {productName && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">Reviewing: <span className="font-medium text-gray-900">{productName}</span></p>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          showLabel
        />
        {errors.rating && (
          <p className="text-sm text-red-600 mt-1">{errors.rating}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-2">
          Title (Optional)
        </label>
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Give your review a title..."
          maxLength={200}
          error={errors.title}
        />
        <p className="text-xs text-gray-500 mt-1">{title.length}/200 characters</p>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product..."
          rows={6}
          maxLength={2000}
          className={`
            w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500
            ${errors.comment ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        {errors.comment && (
          <p className="text-sm text-red-600 mt-1">{errors.comment}</p>
        )}
        <p className="text-xs text-gray-500 mt-1">{comment.length}/2000 characters</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          disabled={loading || rating === 0}
          className="flex-1"
        >
          {loading ? (
            <>
              <Loader size="sm" className="mr-2" />
              {initialData ? 'Updating...' : 'Submitting...'}
            </>
          ) : (
            initialData ? 'Update Review' : 'Submit Review'
          )}
        </Button>
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

