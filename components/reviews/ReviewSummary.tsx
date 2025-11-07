/**
 * ReviewSummary Component
 * Summary of ratings (average, distribution)
 */

'use client';

import { StarRating } from './StarRating';
import { Star } from 'lucide-react';

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution?: {
    rating: number;
    count: number;
    percentage: number;
  }[];
  showDistribution?: boolean;
}

export function ReviewSummary({
  averageRating,
  totalReviews,
  ratingDistribution,
  showDistribution = false,
}: ReviewSummaryProps) {
  const getPercentage = (rating: number) => {
    if (!ratingDistribution) return 0;
    const dist = ratingDistribution.find((d) => d.rating === rating);
    return dist ? dist.percentage : 0;
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Average Rating */}
        <div className="text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="text-4xl font-bold text-gray-900">
              {averageRating.toFixed(1)}
            </span>
            <div className="flex flex-col">
              <StarRating rating={averageRating} size="md" />
              <span className="text-sm text-gray-600 mt-1">
                {totalReviews} review{totalReviews !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        {showDistribution && ratingDistribution && (
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const percentage = getPercentage(rating);
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium text-gray-700">{rating}</span>
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

