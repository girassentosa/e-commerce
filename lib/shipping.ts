/**
 * Shipping Calculation Helper
 * Handles both per-product and global shipping settings
 */

interface ProductShippingSettings {
  freeShippingThreshold: number | null;
  defaultShippingCost: number | null;
  serviceFee: number | null;
}

interface GlobalShippingSettings {
  freeShippingThreshold: number;
  defaultShippingCost: number;
}

interface CartItem {
  productId: string;
  quantity: number;
  subtotal: number;
  shippingSettings: ProductShippingSettings;
}

/**
 * Calculate shipping cost based on hybrid logic:
 * - If all items are same product: use per-product settings
 * - If mixed products: use global settings
 * - If product settings are NULL: use global or free shipping
 */
export function calculateShipping(
  cartItems: CartItem[],
  globalSettings: GlobalShippingSettings
): {
  shippingCost: number;
  serviceFee: number;
  isFreeShipping: boolean;
  reason: string;
} {
  if (cartItems.length === 0) {
    return {
      shippingCost: 0,
      serviceFee: 0,
      isFreeShipping: true,
      reason: 'No items in cart',
    };
  }

  // Calculate total subtotal
  const totalSubtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Check if all items are the same product
  const uniqueProductIds = new Set(cartItems.map((item) => item.productId));
  const isSingleProduct = uniqueProductIds.size === 1;

  if (isSingleProduct) {
    // Use per-product settings
    const productSettings = cartItems[0].shippingSettings;
    const serviceFee = productSettings.serviceFee || 0;

    // If product settings are NULL, use global or free shipping
    if (
      productSettings.freeShippingThreshold === null ||
      productSettings.defaultShippingCost === null
    ) {
      // Check global settings as fallback
      if (totalSubtotal >= globalSettings.freeShippingThreshold) {
        return {
          shippingCost: 0,
          serviceFee,
          isFreeShipping: true,
          reason: 'Free shipping (global threshold reached)',
        };
      } else {
        // Free shipping if global not set, or charge global cost
        return {
          shippingCost: globalSettings.defaultShippingCost || 0,
          serviceFee,
          isFreeShipping: globalSettings.defaultShippingCost === 0,
          reason:
            globalSettings.defaultShippingCost === 0
              ? 'Free shipping (no settings)'
              : 'Global shipping cost applied',
        };
      }
    }

    // Use product-specific settings
    if (totalSubtotal >= productSettings.freeShippingThreshold!) {
      return {
        shippingCost: 0,
        serviceFee,
        isFreeShipping: true,
        reason: 'Free shipping (product threshold reached)',
      };
    } else {
      return {
        shippingCost: productSettings.defaultShippingCost!,
        serviceFee,
        isFreeShipping: false,
        reason: 'Product-specific shipping cost',
      };
    }
  } else {
    // Mixed products: use average of all settings
    const totalServiceFee = cartItems.reduce((sum, item) => sum + (item.shippingSettings.serviceFee || 0), 0);
    const avgServiceFee = totalServiceFee / uniqueProductIds.size;

    const totalThreshold = cartItems.reduce((sum, item) => {
      const uniqueItems = cartItems.filter(ci => ci.productId === item.productId);
      if (uniqueItems.length > 0 && uniqueItems[0].shippingSettings.freeShippingThreshold !== null) {
        return sum + uniqueItems[0].shippingSettings.freeShippingThreshold;
      }
      return sum;
    }, 0);
    const avgThreshold = totalThreshold / uniqueProductIds.size;

    const totalShippingCost = cartItems.reduce((sum, item) => {
      const uniqueItems = cartItems.filter(ci => ci.productId === item.productId);
      if (uniqueItems.length > 0 && uniqueItems[0].shippingSettings.defaultShippingCost !== null) {
        return sum + uniqueItems[0].shippingSettings.defaultShippingCost;
      }
      return sum;
    }, 0);
    const avgShippingCost = totalShippingCost / uniqueProductIds.size;

    // Check average threshold
    if (totalSubtotal >= avgThreshold) {
      return {
        shippingCost: 0,
        serviceFee: avgServiceFee,
        isFreeShipping: true,
        reason: 'Free shipping (average threshold reached - mixed products)',
      };
    } else {
      return {
        shippingCost: avgShippingCost,
        serviceFee: avgServiceFee,
        isFreeShipping: false,
        reason: 'Average shipping cost (mixed products)',
      };
    }
  }
}

