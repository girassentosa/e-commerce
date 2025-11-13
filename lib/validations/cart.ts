/**
 * Cart Validation Schemas
 * Zod schemas untuk validasi Cart API requests
 */

import { z } from 'zod';

/**
 * Schema untuk add item to cart
 */
export const addToCartSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Maximum quantity is 99')
    .default(1),
  variantId: z.string().optional(),
  color: z.string().optional(),
  size: z.string().optional(),
  imageUrl: z.string().optional(),
});

/**
 * Schema untuk update cart item quantity
 */
export const updateCartItemSchema = z.object({
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .min(1, 'Quantity must be at least 1')
    .max(99, 'Maximum quantity is 99'),
});

// Export types
export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

