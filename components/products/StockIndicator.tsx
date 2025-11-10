'use client';

/**
 * Stock Indicator Component
 * Shows stock availability dengan progress bar dan warning colors
 */

import { AlertCircle, Check, Package } from 'lucide-react';

interface StockIndicatorProps {
  stock: number;
  maxStock?: number;
  showProgressBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StockIndicator({ 
  stock, 
  maxStock = 100,
  showProgressBar = true,
  size = 'md' 
}: StockIndicatorProps) {
  const stockPercentage = Math.min((stock / maxStock) * 100, 100);
  
  // Determine status
  const getStockStatus = () => {
    if (stock === 0) return 'out';
    if (stock <= 3) return 'critical';
    if (stock <= 10) return 'low';
    if (stock <= 30) return 'medium';
    return 'high';
  };

  const status = getStockStatus();

  // Size variants
  const sizeClasses = {
    sm: {
      text: 'text-xs',
      icon: 'w-3.5 h-3.5',
      padding: 'p-2',
      progressHeight: 'h-1',
    },
    md: {
      text: 'text-sm',
      icon: 'w-4 h-4',
      padding: 'p-3',
      progressHeight: 'h-1.5',
    },
    lg: {
      text: 'text-base',
      icon: 'w-5 h-5',
      padding: 'p-4',
      progressHeight: 'h-2',
    },
  };

  const classes = sizeClasses[size];

  // Status configurations
  const statusConfig = {
    out: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: Package,
      iconColor: 'text-red-500',
      label: 'Out of Stock',
      description: 'Currently unavailable',
      progressColor: 'bg-red-500',
      showProgress: false,
    },
    critical: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      icon: AlertCircle,
      iconColor: 'text-red-500',
      label: `Only ${stock} left!`,
      description: 'Order soon - almost sold out',
      progressColor: 'bg-red-500',
      showProgress: true,
    },
    low: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      text: 'text-orange-700',
      icon: AlertCircle,
      iconColor: 'text-orange-500',
      label: `Only ${stock} left in stock`,
      description: 'Limited availability',
      progressColor: 'bg-orange-500',
      showProgress: true,
    },
    medium: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: Check,
      iconColor: 'text-yellow-600',
      label: 'In Stock',
      description: `${stock} available`,
      progressColor: 'bg-yellow-500',
      showProgress: true,
    },
    high: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-700',
      icon: Check,
      iconColor: 'text-green-500',
      label: 'In Stock',
      description: `${stock}+ available`,
      progressColor: 'bg-green-500',
      showProgress: false, // Don't show progress for high stock
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} ${config.border} border rounded-lg ${classes.padding}`}>
      <div className="flex items-start gap-2 mb-2">
        <Icon className={`${classes.icon} ${config.iconColor} flex-shrink-0 mt-0.5`} />
        <div className="flex-1 min-w-0">
          <p className={`${classes.text} ${config.text} font-semibold leading-tight`}>
            {config.label}
          </p>
          {config.description && (
            <p className={`${classes.text} ${config.text} opacity-75 mt-0.5`}>
              {config.description}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {showProgressBar && config.showProgress && (
        <div className="space-y-1">
          <div className={`w-full bg-gray-200 rounded-full overflow-hidden ${classes.progressHeight}`}>
            <div
              className={`${config.progressColor} ${classes.progressHeight} rounded-full transition-all duration-500`}
              style={{ width: `${stockPercentage}%` }}
            />
          </div>
          {stock > 0 && (
            <p className="text-[10px] text-gray-500 text-right">
              {stock} / {maxStock} units
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Compact variant for product cards
export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded">
        Out of Stock
      </span>
    );
  }

  if (stock <= 3) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded animate-pulse">
        <AlertCircle className="w-3 h-3" />
        Only {stock} left!
      </span>
    );
  }

  if (stock <= 10) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500 text-white text-xs font-semibold rounded">
        Only {stock} left
      </span>
    );
  }

  return null; // Don't show badge for good stock levels
}

