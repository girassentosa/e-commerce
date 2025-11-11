'use client';

/**
 * Swipe Gesture Component
 * Handles swipe gestures untuk product images, categories, dll
 */

import { useState, useRef, ReactNode } from 'react';

interface SwipeGestureProps {
  children: ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // Minimum distance untuk trigger swipe (default: 50px)
  className?: string;
  disableNativeDrag?: boolean; // Prevent native image/element drag (default: true)
}

export function SwipeGesture({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  className = '',
  disableNativeDrag = true,
}: SwipeGestureProps) {
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = threshold;

  const onTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) return;
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) return;
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Prioritize horizontal swipes over vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && onSwipeLeft) {
        onSwipeLeft();
      }
      if (isRightSwipe && onSwipeRight) {
        onSwipeRight();
      }
    } else {
      if (isUpSwipe && onSwipeUp) {
        onSwipeUp();
      }
      if (isDownSwipe && onSwipeDown) {
        onSwipeDown();
      }
    }
  };

  // Pointer events (desktop/laptop with mouse/trackpad)
  const [pointerStart, setPointerStart] = useState<{ x: number; y: number } | null>(null);
  const [pointerEnd, setPointerEnd] = useState<{ x: number; y: number } | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    // Only primary button
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) return;
    // Prevent native drag/selection behavior
    if (disableNativeDrag) e.preventDefault();
    try {
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    } catch {}
    setPointerEnd(null);
    setPointerStart({ x: e.clientX, y: e.clientY });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerStart) return;
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-swipe="true"]')) return;
    if (disableNativeDrag) e.preventDefault();
    setPointerEnd({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = () => {
    if (!pointerStart || !pointerEnd) {
      setPointerStart(null);
      setPointerEnd(null);
      return;
    }
    const distanceX = pointerStart.x - pointerEnd.x;
    const distanceY = pointerStart.y - pointerEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;

    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe && onSwipeLeft) onSwipeLeft();
      if (isRightSwipe && onSwipeRight) onSwipeRight();
    }
    setPointerStart(null);
    setPointerEnd(null);
  };

  return (
    <div
      ref={containerRef}
      className={`touch-pan-y select-none ${className}`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onDragStart={(e) => {
        if (disableNativeDrag) e.preventDefault();
      }}
    >
      {children}
    </div>
  );
}

