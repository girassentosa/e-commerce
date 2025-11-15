/**
 * ReviewForm Component
 * Form for creating or editing a review
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { StarRating } from './StarRating';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import toast from 'react-hot-toast';

interface Review {
  id?: string;
  rating: number;
  title?: string | null;
  comment?: string | null;
  images?: string[];
}

interface ReviewFormProps {
  productId: string;
  productName?: string;
  initialData?: Review;
  onSubmit: (data: { rating: number; title?: string; comment?: string; images?: string[] }) => Promise<void>;
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
  const [reviewImages, setReviewImages] = useState<string[]>(initialData?.images || []);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<{ rating?: string; title?: string; comment?: string; images?: string }>({});

  useEffect(() => {
    if (initialData) {
      setRating(initialData.rating || 0);
      setTitle(initialData.title || '');
      setComment(initialData.comment || '');
      setReviewImages(initialData.images || []);
    }
  }, [initialData]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File must be an image');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Validate max images (max 3)
    if (reviewImages.length >= 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/reviews/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      setReviewImages([...reviewImages, data.data.url]);
      toast.success('Image uploaded successfully');
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.message || 'Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  const validate = () => {
    const newErrors: { rating?: string; title?: string; comment?: string; images?: string } = {};

    if (rating < 1 || rating > 5) {
      newErrors.rating = 'Please select a rating';
    }

    if (title && title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (comment && comment.length > 2000) {
      newErrors.comment = 'Comment must be less than 2000 characters';
    }

    if (reviewImages.length > 3) {
      newErrors.images = 'Maximum 3 images allowed';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedComment = comment.trim();
    
    await onSubmit({
      rating,
      title: trimmedTitle.length > 0 ? trimmedTitle : undefined,
      comment: trimmedComment.length > 0 ? trimmedComment : undefined,
      images: reviewImages.length > 0 ? reviewImages : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {productName && (
        <div className="mb-2 pb-3 border-b border-gray-200">
          <p className="text-xs text-gray-500">
            <span className="font-medium text-gray-600">Mengulas:</span>{' '}
            <span className="text-gray-700">{productName}</span>
          </p>
        </div>
      )}

      {/* Rating */}
      <div>
        <label className="block !text-xs !font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Rating <span className="text-red-500">*</span>
        </label>
        <StarRating
          rating={rating}
          interactive
          onRatingChange={setRating}
          showLabel
        />
        {errors.rating && (
          <p className="text-xs text-red-600 mt-1">{errors.rating}</p>
        )}
      </div>

      {/* Title */}
      <div>
        <label 
          htmlFor="review-title" 
          className="block !text-xs !font-semibold text-gray-500 uppercase tracking-wide mb-2"
        >
          Judul Ulasan (Opsional)
        </label>
        <Input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Berikan judul untuk ulasan Anda..."
          maxLength={200}
          error={errors.title}
          className="text-sm"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/200 karakter</p>
      </div>

      {/* Comment */}
      <div>
        <label 
          htmlFor="review-comment" 
          className="block !text-xs !font-semibold text-gray-500 uppercase tracking-wide mb-2"
        >
          Ulasan (Opsional)
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Bagikan pengalaman Anda dengan produk ini..."
          rows={5}
          maxLength={2000}
          className={`
            w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500
            ${errors.comment ? 'border-red-300' : 'border-gray-300'}
          `}
        />
        {errors.comment && (
          <p className="text-xs text-red-600 mt-1">{errors.comment}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">{comment.length}/2000 karakter</p>
      </div>

      {/* Review Images */}
      <div>
        <label className="block !text-xs !font-semibold text-gray-500 uppercase tracking-wide mb-2">
          📷 Foto Ulasan (Opsional, maks 3)
        </label>
        <div className="space-y-2">
          {/* Image Preview Grid */}
          {reviewImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {reviewImages.map((imageUrl, index) => (
                <div key={index} className="relative group">
                  <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                    <Image
                      src={imageUrl}
                      alt={`Review photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    aria-label="Remove image"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload Button */}
          {reviewImages.length < 3 && (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="hidden"
                id="review-image-upload"
              />
              <label
                htmlFor="review-image-upload"
                className={`
                  flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed rounded-lg cursor-pointer transition-colors text-sm
                  ${uploadingImage 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  }
                `}
              >
                {uploadingImage ? (
                  <>
                    <Loader size="sm" />
                    <span className="text-xs text-gray-600">Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600">
                      {reviewImages.length === 0 ? 'Tambah Foto' : `Tambah Foto Lagi (${reviewImages.length}/3)`}
                    </span>
                  </>
                )}
              </label>
            </div>
          )}
        </div>
        {errors.images && (
          <p className="text-xs text-red-600 mt-1">{errors.images}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Anda dapat mengunggah hingga 3 foto. Format yang didukung: JPG, PNG, WebP (maks 5MB per foto)
        </p>
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

