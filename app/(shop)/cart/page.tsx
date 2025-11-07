'use client';

/**
 * Shopping Cart Page
 * Display user's cart with items and checkout summary
 */

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, itemCount, subtotal, loading, updateQuantity, removeItem, clearCart } = useCart();
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/cart');
    return null;
  }

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader size="lg" />
        </div>
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-6">
            <ShoppingBag className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
          </div>
          <h1 className="text-3xl font-bold mb-4">Your Cart is Empty</h1>
          <p className="text-gray-600 mb-8">
            Looks like you haven't added anything to your cart yet.
          </p>
          <Link href="/products">
            <Button size="lg">
              <ShoppingBag className="w-5 h-5 mr-2" />
              Browse Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Handle quantity change
  const handleQuantityChange = async (itemId: string, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty < 1) return;
    
    setUpdatingItem(itemId);
    await updateQuantity(itemId, newQty);
    setUpdatingItem(null);
  };

  // Handle remove item
  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItem(itemId);
    await removeItem(itemId);
    setUpdatingItem(null);
  };

  // Handle clear cart
  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/products" 
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Continue Shopping
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Shopping Cart</h1>
            <p className="text-gray-600 mt-1">
              {itemCount} {itemCount === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
          {items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCart}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => {
            const price = parseFloat(item.product.salePrice || item.product.price);
            const total = price * item.quantity;
            const imageUrl = item.product.images[0]?.imageUrl;
            const isUpdating = updatingItem === item.id;
            const isLowStock = item.product.stockQuantity <= 5;
            const isOutOfStock = item.product.stockQuantity === 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border p-4 flex gap-4 relative"
              >
                {/* Loading overlay */}
                {isUpdating && (
                  <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                    <Loader />
                  </div>
                )}

                {/* Product Image */}
                <Link
                  href={`/products/${item.product.slug}`}
                  className="flex-shrink-0"
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                    {imageUrl && imageUrl.trim() !== '' && !imageErrors[item.id] ? (
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                        onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>
                </Link>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-4">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="text-lg font-semibold hover:text-blue-600 block truncate"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500">{item.product.category.name}</p>
                      {item.variant && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.variant.name}: {item.variant.value}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={isUpdating}
                      className="text-gray-400 hover:text-red-500 p-1"
                      title="Remove item"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Stock Status */}
                  {isOutOfStock && (
                    <Badge variant="destructive" className="mb-2">
                      Out of Stock
                    </Badge>
                  )}
                  {!isOutOfStock && isLowStock && (
                    <Badge variant="warning" className="mb-2">
                      Only {item.product.stockQuantity} left
                    </Badge>
                  )}

                  {/* Price and Quantity */}
                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, -1)}
                        disabled={isUpdating || item.quantity <= 1}
                        className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item.id, item.quantity, 1)}
                        disabled={isUpdating || item.quantity >= item.product.stockQuantity}
                        className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <p className="text-sm text-gray-500">${price.toFixed(2)} each</p>
                      <p className="text-lg font-bold">${total.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Order Summary (Sticky) */}
        <div className="lg:col-span-1">
          <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal ({itemCount} items)</span>
                <span>${subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Shipping</span>
                <span className="text-sm text-gray-500">Calculated at checkout</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax</span>
                <span className="text-sm text-gray-500">Calculated at checkout</span>
              </div>
              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total</span>
                  <span>${subtotal}</span>
                </div>
              </div>
            </div>

            <Button
              size="lg"
              className="w-full mb-3"
              onClick={() => router.push('/checkout')}
            >
              Proceed to Checkout
            </Button>

            <Link href="/products">
              <Button variant="outline" className="w-full">
                Continue Shopping
              </Button>
            </Link>

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-600">
                <strong>Free Shipping</strong> on orders over $50
              </p>
              <p className="text-sm text-gray-600 mt-2">
                <strong>Secure Checkout</strong> - Your payment information is encrypted
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

