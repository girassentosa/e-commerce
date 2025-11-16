'use client';

import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessNotificationProps {
  title: string;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function SuccessNotification({
  title,
  message,
  onClose,
  duration = 5000,
}: SuccessNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4 animate-in slide-in-from-top-5 fade-in duration-300">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="!text-base sm:!text-lg !font-semibold text-gray-900">
              {title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

