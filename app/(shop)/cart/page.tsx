'use client';

/**
 * Shopping Cart Page
 * Display user's cart with items and checkout summary
 */

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/contexts/CartContext';
import { Loader } from '@/components/ui/Loader';
import { Badge } from '@/components/ui/Badge';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Check } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

// Helper function to format color and size labels (same as checkout)
const toTitleCase = (str: string) =>
  str
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const colorLabelMap: Record<string, string> = {
  hitam: 'Hitam',
  putih: 'Putih',
  'biru-navy': 'Biru Navy',
  'merah-maroon': 'Merah Maroon',
};

const getVariantLabels = (
  variant: { name: string; value: string } | null,
  productVariants?: Array<{ id: string; name: string; value: string }>,
  selectedColor?: string | null,
  selectedSize?: string | null
) => {
  let colorLabel: string | null = null;
  let sizeLabel: string | null = null;

  // First priority: use selectedColor and selectedSize from metadata (if available)
  if (selectedColor) {
    const colorValue = selectedColor.toLowerCase();
    colorLabel = colorLabelMap[colorValue] ?? toTitleCase(selectedColor);
  }

  if (selectedSize) {
    sizeLabel = selectedSize.toUpperCase();
  }

  // Second priority: use the stored variant
  if (!colorLabel && !sizeLabel && variant) {
    if (variant.name === 'Color' || variant.name.toLowerCase() === 'color') {
      const colorValue = variant.value.toLowerCase();
      colorLabel = colorLabelMap[colorValue] ?? toTitleCase(variant.value);
    } else if (variant.name === 'Size' || variant.name.toLowerCase() === 'size') {
      sizeLabel = variant.value.toUpperCase();
    }
  }

  // Third priority: if we still don't have both, try to find from product variants
  if (productVariants && productVariants.length > 0) {
    // If we don't have color yet, find color variant
    if (!colorLabel) {
      const colorVariant = productVariants.find(
        (v) => v.name === 'Color' || v.name.toLowerCase() === 'color'
      );
      if (colorVariant) {
        const colorValue = colorVariant.value.toLowerCase();
        colorLabel = colorLabelMap[colorValue] ?? toTitleCase(colorVariant.value);
      }
    }

    // If we don't have size yet, find size variant
    if (!sizeLabel) {
      const sizeVariant = productVariants.find(
        (v) => v.name === 'Size' || v.name.toLowerCase() === 'size'
      );
      if (sizeVariant) {
        sizeLabel = sizeVariant.value.toUpperCase();
      }
    }
  }

  return { colorLabel, sizeLabel };
};

export default function CartPage() {
  const router = useRouter();
  const { status } = useSession();
  const { items, itemCount, subtotal, loading, updateQuantity, removeItem, clearCart, selectedItems, setSelectedItems } = useCart();
  const [updatingItem, setUpdatingItem] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  // Redirect to login if not authenticated
  if (status === 'unauthenticated') {
    router.push('/login?callbackUrl=/cart');
    return null;
  }

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/products');
    }
  };

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
    // Remove from selected items if it was selected
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      newSet.delete(itemId);
      return newSet;
    });
  };

  // Handle item selection (toggle like payment page)
  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Handle checkout - navigate to checkout (cart flow, no flow parameter)
  const handleCheckout = () => {
    if (selectedItems.size === 0) {
      return;
    }
    // Navigate to checkout without flow parameter (default cart flow)
    // This is different from buy-now flow which uses ?flow=buy-now
    router.push('/checkout');
  };

  const currencyCode = 'USD';
  
  // Calculate total discount and subtotal only from selected items
  const selectedItemsArray = items.filter(item => selectedItems.has(item.id));
  
  const discountTotal = selectedItemsArray.reduce((total, item) => {
    const basePrice = parseFloat(item.product.price);
    const salePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
    if (salePrice && salePrice < basePrice) {
      const itemDiscount = (basePrice - salePrice) * item.quantity;
      return total + itemDiscount;
    }
    return total;
  }, 0);
  
  const totalPembayaran = selectedItemsArray.reduce((total, item) => {
    const price = parseFloat(item.product.salePrice || item.product.price);
    return total + (price * item.quantity);
  }, 0);
  
  const hasDiscount = discountTotal > 0;

  // Loading state
  if (loading && items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader size="lg" />
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="sticky top-0 z-40 bg-white shadow-sm">
          <div className="px-4 sm:px-6 border-b border-gray-200">
            <div className="max-w-[1440px] mx-auto">
              <div className="flex items-center justify-between h-14 sm:h-16">
                <button
                  onClick={handleBack}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Kembali"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-700" />
                </button>
                <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                  Keranjang
                </h1>
                <div className="min-h-[44px] min-w-[44px]" />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-10">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6">
            <div className="text-center py-12">
              <div className="mb-6">
                <ShoppingBag className="w-24 h-24 mx-auto text-gray-300" strokeWidth={1} />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Keranjang Anda Kosong</h2>
              <p className="text-sm text-gray-600 mb-6">
                Belum ada produk di keranjang Anda.
              </p>
              <button
                onClick={() => router.push('/products')}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-semibold"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Jelajahi Produk
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 sm:px-6 border-b border-gray-200">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex items-center justify-between h-14 sm:h-16">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Kembali"
              >
                <ArrowLeft className="w-5 h-5 text-gray-700" />
              </button>
              <h1 className="!text-base sm:!text-lg !font-semibold text-gray-900 flex-1 text-center">
                Keranjang
              </h1>
              <div className="min-h-[44px] min-w-[44px]" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-28">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 pt-6 space-y-4">
          {/* Group items by brand/category */}
          {(() => {
            // Group items by brand (or category if no brand)
            const groupedItems = items.reduce((acc, item) => {
              const brandKey = item.product.brand?.trim() || item.product.category.name || 'Produk';
              if (!acc[brandKey]) {
                acc[brandKey] = [];
              }
              acc[brandKey].push(item);
              return acc;
            }, {} as Record<string, typeof items>);

            return Object.entries(groupedItems).map(([brandKey, brandItems]) => {
              // Calculate discount percentage for this brand group
              const brandDiscount = brandItems.reduce((total, item) => {
                const basePrice = parseFloat(item.product.price);
                const salePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
                if (salePrice && salePrice < basePrice) {
                  const itemDiscount = (basePrice - salePrice) * item.quantity;
                  return total + itemDiscount;
                }
                return total;
              }, 0);

              const brandHasDiscount = brandDiscount > 0;
              const brandDiscountPercentage = brandItems.reduce((max, item) => {
                const basePrice = parseFloat(item.product.price);
                const salePrice = item.product.salePrice ? parseFloat(item.product.salePrice) : null;
                if (salePrice && salePrice < basePrice && basePrice > 0) {
                  const percentage = Math.round(((basePrice - salePrice) / basePrice) * 100);
                  return Math.max(max, percentage);
                }
                return max;
              }, 0);

              return (
                <section
                  key={brandKey}
                  className="-mx-4 sm:-mx-6 bg-white border border-gray-200 rounded-none sm:rounded-3xl shadow-sm px-4 py-4 sm:px-5 sm:py-5"
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 truncate">
                        {brandKey}
                      </p>
                      {brandHasDiscount && brandDiscountPercentage > 0 && (
                        <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-600 whitespace-nowrap">
                          -{brandDiscountPercentage}%
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      {brandItems.map((item) => {
                        const price = parseFloat(item.product.salePrice || item.product.price);
                        const basePrice = parseFloat(item.product.price);
                        const hasDiscount = item.product.salePrice && parseFloat(item.product.salePrice) < basePrice;
                        const effectivePrice = price;
                        // Use selectedImageUrl if available, otherwise fallback to first product image
                        const imageUrl = item.selectedImageUrl || item.product.images[0]?.imageUrl;
                        const isUpdating = updatingItem === item.id;
                        const isLowStock = item.product.stockQuantity <= 5;
                        const isOutOfStock = item.product.stockQuantity === 0;

                        const isSelected = selectedItems.has(item.id);

                        return (
                          <div
                            key={item.id}
                            onClick={() => handleSelectItem(item.id)}
                            className={`relative cursor-pointer rounded-lg transition-all ${
                              isSelected
                                ? 'border-2 border-blue-600 bg-blue-50'
                                : 'border border-transparent hover:bg-gray-50'
                            }`}
                          >
                            {/* Loading overlay */}
                            {isUpdating && (
                              <div className="absolute inset-0 bg-white/50 rounded-lg flex items-center justify-center z-10">
                                <Loader />
                              </div>
                            )}

                            {/* Check icon when selected */}
                            {isSelected && (
                              <div className="absolute top-3 right-3 z-20 flex-shrink-0">
                                <Check className="w-5 h-5 text-blue-600" />
                              </div>
                            )}

                            <div className="flex items-start gap-3 min-w-0 p-2">
                              {/* Product Image */}
                              <div className="relative h-16 w-16 rounded-lg border border-gray-100 bg-gray-100 flex-shrink-0 overflow-hidden sm:h-18 sm:w-18">
                                {imageUrl && imageUrl.trim() !== '' && !imageErrors[item.id] ? (
                                  <Image
                                    src={imageUrl}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                    sizes="72px"
                                    onError={() => setImageErrors(prev => ({ ...prev, [item.id]: true }))}
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center px-2 text-center text-[11px] font-medium text-gray-400">
                                    Tidak ada gambar
                                  </div>
                                )}
                              </div>

                              {/* Product Details */}
                              <div className="flex-1 min-w-0 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className="text-sm font-semibold text-gray-900 truncate"
                                      title={item.product.name}
                                    >
                                      {item.product.name}
                                    </p>
                                    {(() => {
                                      // Get color and size from metadata (selectedColor, selectedSize) or variants
                                      const { colorLabel, sizeLabel } = getVariantLabels(
                                        item.variant,
                                        item.product.variants,
                                        item.selectedColor,
                                        item.selectedSize
                                      );
                                      const variantText = colorLabel && sizeLabel
                                        ? `${colorLabel}, ${sizeLabel}`
                                        : colorLabel ?? sizeLabel ?? '';
                                      
                                      return variantText ? (
                                        <p
                                          className="text-xs font-medium text-gray-700 truncate mt-0.5"
                                          title={variantText}
                                        >
                                          {variantText}
                                        </p>
                                      ) : null;
                                    })()}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveItem(item.id);
                                    }}
                                    disabled={isUpdating}
                                    className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0 transition-colors"
                                    title="Hapus item"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Stock Status */}
                                {isOutOfStock && (
                                  <Badge variant="destructive" className="text-xs">
                                    Stok Habis
                                  </Badge>
                                )}
                                {!isOutOfStock && isLowStock && (
                                  <Badge variant="warning" className="text-xs">
                                    Hanya {item.product.stockQuantity} tersisa
                                  </Badge>
                                )}

                                {/* Quantity Controls and Price */}
                                <div className="mt-2 grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4 w-[calc(100%+1rem+1rem)] -ml-4 -mr-4 pl-4 pr-4 sm:w-[calc(100%+1.25rem+1.25rem)] sm:-ml-5 sm:-mr-5 sm:pl-5 sm:pr-5">
                                  <div className="flex items-center gap-2">
                                    {/* Quantity Controls */}
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuantityChange(item.id, item.quantity, -1);
                                        }}
                                        disabled={isUpdating || item.quantity <= 1}
                                        className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <Minus className="w-4 h-4" />
                                      </button>
                                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleQuantityChange(item.id, item.quantity, 1);
                                        }}
                                        disabled={isUpdating || item.quantity >= item.product.stockQuantity}
                                        className="w-8 h-8 rounded-md border hover:bg-gray-100 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                      >
                                        <Plus className="w-4 h-4" />
                                      </button>
                                    </div>
                                    {/* Price */}
                                    <div className="flex items-end gap-2 whitespace-nowrap">
                                      <span className="text-base font-bold text-blue-600">
                                        {formatCurrency(effectivePrice, currencyCode)}
                                      </span>
                                      {hasDiscount && (
                                        <span className="text-xs text-gray-400 line-through">
                                          {formatCurrency(basePrice, currencyCode)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500 whitespace-nowrap justify-self-end -mr-2 sm:mr-0">
                                    x{item.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </section>
              );
            });
          })()}
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-6px_24px_rgba(15,23,42,0.06)] backdrop-blur supports-[padding:max(env(safe-area-inset-bottom))]">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
          <div className="flex items-center justify-end gap-3">
            {selectedItems.size > 0 ? (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-base font-bold text-gray-900">
                  {formatCurrency(totalPembayaran, currencyCode)}
                </span>
                {hasDiscount && discountTotal > 0 && (
                  <span className="text-[11px] font-semibold text-red-500">
                    Hemat {formatCurrency(discountTotal, currencyCode)}
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-end leading-tight">
                <span className="text-base font-bold text-gray-400">
                  {formatCurrency(0, currencyCode)}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={selectedItems.size === 0}
              className={`h-10 min-w-[140px] rounded-lg px-4 text-sm font-semibold transition-colors ${
                selectedItems.size > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
              }`}
            >
              Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
