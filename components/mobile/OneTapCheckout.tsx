'use client';

/**
 * One-Tap Checkout Component
 * Quick checkout button untuk mobile
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ShoppingBag, Loader } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNotification } from '@/contexts/NotificationContext';

interface OneTapCheckoutProps {
  productId?: string;
  quantity?: number;
  className?: string;
  variant?: 'floating' | 'inline';
}

export function OneTapCheckout({
  productId,
  quantity = 1,
  className = '',
  variant = 'floating',
}: OneTapCheckoutProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const { addItem, itemCount } = useCart();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleOneTapCheckout = async () => {
    if (!session) {
      showError('Butuh login', 'Silakan masuk terlebih dahulu untuk checkout.');
      router.push('/login?redirect=/checkout');
      return;
    }

    setLoading(true);
    try {
      // If productId provided, add to cart first
      if (productId) {
        await addItem(productId, quantity);
      }

      // If cart is empty, show error
      if (itemCount === 0 && !productId) {
        showError('Keranjang kosong', 'Tambahkan produk sebelum checkout.');
        setLoading(false);
        return;
      }

      // Navigate to checkout
      router.push('/checkout');
    } catch (error) {
      showError('Gagal melanjutkan', 'Tidak dapat melanjutkan ke checkout.');
      setLoading(false);
    }
  };

  if (variant === 'floating') {
    return (
      <button
        onClick={handleOneTapCheckout}
        disabled={loading || (!productId && itemCount === 0)}
        className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all min-h-[56px] min-w-[56px] flex items-center justify-center gap-2 font-bold text-base sm:hidden ${className}`}
        style={{
          // Ensure thumb-friendly size
          minHeight: '56px',
          minWidth: '56px',
        }}
      >
        {loading ? (
          <Loader className="w-6 h-6 animate-spin" />
        ) : (
          <>
            <ShoppingBag className="w-6 h-6" />
            <span className="hidden sm:inline">Checkout</span>
          </>
        )}
      </button>
    );
  }

  // Inline variant
  return (
    <button
      onClick={handleOneTapCheckout}
      disabled={loading || (!productId && itemCount === 0)}
      className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all min-h-[56px] flex items-center justify-center gap-2 font-bold text-base ${className}`}
    >
      {loading ? (
        <Loader className="w-6 h-6 animate-spin" />
      ) : (
        <>
          <ShoppingBag className="w-6 h-6" />
          <span>One-Tap Checkout</span>
        </>
      )}
    </button>
  );
}

