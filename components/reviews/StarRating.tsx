/**
 * StarRating Component
 * Interactive star rating component for displaying and selecting ratings
 */

'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  showLabel?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  interactive = false,
  onRatingChange,
  showLabel = false,
  className = '',
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const handleClick = (value: number) => {
    if (interactive && onRatingChange) {
      // Logika: 
      // - Jika rating saat ini = value yang diklik, toggle off bintang tersebut (set ke value - 1, min 0)
      // - Jika rating saat ini != value yang diklik, set ke value tersebut
      if (rating === value) {
        // Toggle off: set ke value - 1 (bintang yang diklik mati)
        onRatingChange(Math.max(0, value - 1));
      } else {
        // Set ke rating yang diklik
        onRatingChange(value);
      }
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex items-center">
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= Math.round(rating);

          return (
            <button
              key={starValue}
              type="button"
              onClick={() => handleClick(starValue)}
              disabled={!interactive}
              className={`
                ${sizeClasses[size]}
                ${interactive ? 'cursor-pointer' : 'cursor-default'}
                ${isFilled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                star-rating-button
              `}
              style={{ 
                transform: 'none !important',
                width: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem',
                height: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem',
                minWidth: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem',
                minHeight: size === 'sm' ? '1rem' : size === 'md' ? '1.25rem' : '1.5rem',
              }}
              aria-label={`${starValue} star${starValue !== 1 ? 's' : ''}`}
            >
              <Star className="w-full h-full" style={{ width: '100%', height: '100%' }} />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span className="text-sm text-gray-600 ml-2">
          {rating.toFixed(1)} / {maxRating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

