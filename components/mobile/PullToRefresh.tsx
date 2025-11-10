'use client';

/**
 * Pull-to-Refresh Component
 * Mobile-friendly pull to refresh functionality
 */

import { useState, useEffect, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  threshold?: number; // Distance to pull before triggering (default: 80px)
  disabled?: boolean;
}

export function PullToRefresh({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);

  useEffect(() => {
    let touchStartY = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (disabled || window.scrollY > 0) return;
      touchStartY = e.touches[0].clientY;
      isDragging = true;
      setStartY(touchStartY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || disabled || window.scrollY > 0) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY;

      if (distance > 0) {
        e.preventDefault(); // Prevent default scroll
        setIsPulling(true);
        // Damping effect - harder to pull further
        const dampedDistance = distance * 0.5;
        setPullDistance(Math.min(dampedDistance, threshold * 1.5));
      }
    };

    const handleTouchEnd = async () => {
      if (!isDragging || disabled) return;

      isDragging = false;
      setIsPulling(false);

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(threshold);
        try {
          await onRefresh();
        } finally {
          setTimeout(() => {
            setIsRefreshing(false);
            setPullDistance(0);
          }, 500);
        }
      } else {
        setPullDistance(0);
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance, threshold, onRefresh, isRefreshing, disabled]);

  const pullProgress = Math.min(pullDistance / threshold, 1);
  const shouldShowIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div className="relative">
      {/* Pull Indicator */}
      {shouldShowIndicator && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-white transition-all duration-300"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`,
            opacity: pullProgress,
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <RefreshCw
              className={`w-6 h-6 text-blue-600 transition-transform ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{
                transform: `rotate(${pullProgress * 360}deg)`,
              }}
            />
            {pullDistance >= threshold && !isRefreshing && (
              <span className="text-xs text-gray-600 font-medium">Release to refresh</span>
            )}
            {isRefreshing && (
              <span className="text-xs text-gray-600 font-medium">Refreshing...</span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: isRefreshing ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

