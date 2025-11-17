'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check } from 'lucide-react';

interface SuccessNotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  /**
   * Total waktu sebelum otomatis menutup (ms).
   * Akan disesuaikan agar tidak lebih singkat dari durasi animasi.
   */
  duration?: number;
}

const ANIMATION_DURATION = 1000; // ms (sesuai pop pembayaran berhasil)
const HOLD_DURATION = 500; // jeda setelah ceklis muncul

export function SuccessNotification({
  title,
  message,
  onClose,
  duration = ANIMATION_DURATION + HOLD_DURATION,
}: SuccessNotificationProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  // Jalankan animasi lingkaran dan ceklis
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

  // Pastikan notif minimal tampil selama animasi berlangsung + hold time
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
              stroke="#e5e7eb"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r={radius}
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - animationProgress / 100)}
            />
          </svg>

          {animationProgress >= 100 && (
            <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300">
              <Check className="w-14 h-14 sm:w-16 sm:h-16 text-green-600" strokeWidth={4} />
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

