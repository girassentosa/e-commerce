/**
 * StatusBadge Component
 * Styled badges for order statuses
 */

interface StatusBadgeProps {
  status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED' | 'PAID' | 'FAILED';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5',
  };

  const statusConfig = {
    PENDING: {
      label: 'Menunggu',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    },
    PROCESSING: {
      label: 'Dikemas',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    SHIPPED: {
      label: 'Dikirim',
      className: 'bg-purple-100 text-purple-800 border-purple-300',
    },
    DELIVERED: {
      label: 'Selesai',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    CANCELLED: {
      label: 'Dibatalkan',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    REFUNDED: {
      label: 'Dikembalikan',
      className: 'bg-gray-100 text-gray-800 border-gray-300',
    },
    // Payment Status
    PAID: {
      label: 'Lunas',
      className: 'bg-green-100 text-green-800 border-green-300',
    },
    FAILED: {
      label: 'Gagal',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
  };

  const config = statusConfig[status];

  // Fallback untuk status yang tidak dikenal
  if (!config) {
    return (
      <span className={`inline-flex items-center font-medium rounded-full border bg-gray-100 text-gray-800 border-gray-300 ${sizeClasses[size]}`}>
        {status}
      </span>
    );
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${sizeClasses[size]}
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}

