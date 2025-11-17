'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';

interface ErrorNotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

const ANIMATION_DURATION = 1000;
const HOLD_DURATION = 500;

export function ErrorNotification({
  title,
  message,
  onClose,
  duration = ANIMATION_DURATION + HOLD_DURATION,
}: ErrorNotificationProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    let frameId: number;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(100, (elapsed / ANIMATION_DURATION) * 100);
      setAnimationProgress(progress);

      if (progress < 100) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, []);

  const safeDuration = useMemo(
    () => Math.max(duration, ANIMATION_DURATION + HOLD_DURATION),
    [duration]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, safeDuration);

    return () => clearTimeout(timer);
  }, [onClose, safeDuration]);

  const radius = 45;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 flex flex-col items-center gap-6 animate-in zoom-in duration-300 max-w-sm w-full mx-4 text-center">
        <div className="relative w-28 h-28 sm:w-32 sm:h-32">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="#fee2e2"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#ef4444"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - animationProgress / 100)}
            />
          </svg>

          {animationProgress >= 100 && (
            <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-100 flex items-center justify-center">
                <X className="w-9 h-9 sm:w-10 sm:h-10 text-red-600" strokeWidth={4} />
              </div>
            </div>
          )}
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm sm:text-base text-gray-600">{message}</p>
        </div>
      </div>
    </div>
  );
}

