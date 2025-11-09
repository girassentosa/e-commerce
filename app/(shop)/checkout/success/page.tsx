'use client';

// Disable static generation for this page
export const dynamic = 'force-dynamic';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { Loader } from '@/components/ui/Loader';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { reset } = useCheckout();
  const { refreshCart } = useCart();
  const orderNumber = searchParams?.get('order');

  useEffect(() => {
    if (!orderNumber) {
      router.push('/');
      return;
    }
    // Reset checkout state
    reset();
    // Refresh cart to ensure it's empty (cart items are deleted on server after order creation)
    const syncCart = async () => {
      await refreshCart();
    };
    syncCart();
  }, [orderNumber, router, reset, refreshCart]);

  if (!orderNumber) return null;

  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-6">
        <CheckCircle className="w-20 h-20 mx-auto text-green-500" />
      </div>

      <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-2">Thank you for your order.</p>
      <p className="text-lg font-semibold text-gray-900 mb-8">
        Order Number: <span className="text-blue-600">{orderNumber}</span>
      </p>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="font-semibold mb-4 flex items-center justify-center gap-2">
          <Package className="w-5 h-5" />
          What's Next?
        </h2>
        <ul className="text-left space-y-2 text-gray-700">
          <li>✓ Order confirmation sent to your email</li>
          <li>✓ We'll notify you when your order ships</li>
          <li>✓ Track your order anytime from your account</li>
        </ul>
      </div>

      <div className="flex gap-3 justify-center mb-0">
        <Link href={`/orders/${orderNumber}`}>
          <Button>
            View Order Details
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
        <Link href="/products">
          <Button variant="outline">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center">
        <Loader size="lg" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

