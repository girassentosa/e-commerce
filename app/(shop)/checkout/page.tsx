'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCheckout } from '@/contexts/CheckoutContext';
import { useCart } from '@/contexts/CartContext';
import { Stepper } from '@/components/ui/Stepper';
import { AddressSelector } from '@/components/checkout/AddressSelector';
import { PaymentSelector } from '@/components/checkout/PaymentSelector';
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const steps = [
  { label: 'Address', description: 'Shipping details' },
  { label: 'Review', description: 'Order items' },
  { label: 'Payment', description: 'Payment method' },
  { label: 'Confirm', description: 'Place order' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, itemCount, refreshCart } = useCart();
  const {
    step,
    addressId,
    paymentMethod,
    orderSummary,
    loading,
    setAddressId,
    setPaymentMethod,
    validateCart,
    calculateTotals,
    createOrder,
    nextStep,
    prevStep,
  } = useCheckout();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/checkout');
    }
  }, [status, router]);

  useEffect(() => {
    if (status === 'authenticated' && itemCount === 0) {
      router.push('/cart');
    }
  }, [status, itemCount, router]);

  useEffect(() => {
    if (addressId) {
      calculateTotals(addressId);
    }
  }, [addressId, calculateTotals]);

  const handleNext = async () => {
    if (step === 1 && !addressId) {
      return alert('Please select a shipping address');
    }
    if (step === 2) {
      const valid = await validateCart();
      if (!valid) return;
    }
    if (step === 3 && !paymentMethod) {
      return alert('Please select a payment method');
    }
    nextStep();
  };

  const handlePlaceOrder = async () => {
    const orderNumber = await createOrder();
    if (orderNumber) {
      // Refresh cart to sync with database (cart items are deleted on server after order creation)
      await refreshCart();
      router.push(`/checkout/success?order=${orderNumber}`);
    }
  };

  if (status === 'loading' || (status === 'authenticated' && itemCount === 0)) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center"><Loader size="lg" /></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <Stepper steps={steps} currentStep={step} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="lg:col-span-2">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
              <AddressSelector selectedId={addressId} onSelect={setAddressId} />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Review Your Order</h2>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4 border rounded-lg p-4">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      <p className="text-sm font-bold mt-1">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Payment Method</h2>
              <PaymentSelector selected={paymentMethod} onSelect={setPaymentMethod} />
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-xl font-bold mb-4">Confirm Order</h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <p className="text-lg mb-4">Review your order and click Place Order to complete your purchase.</p>
                <p className="text-sm text-gray-600">Payment Method: <strong>{paymentMethod}</strong></p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={loading}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button onClick={handleNext} disabled={loading} className="flex-1">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handlePlaceOrder} disabled={loading} className="flex-1">
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-4">
            <OrderSummary totals={orderSummary} />
          </div>
        </div>
      </div>
    </div>
  );
}

