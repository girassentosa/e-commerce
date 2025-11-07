/**
 * Wishlist Validation Schemas
 * Zod schemas untuk validasi Wishlist API requests
 */

import { z } from 'zod';

/**
 * Schema untuk add item to wishlist
 */
export const addToWishlistSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
});

// Export types
export type AddToWishlistInput = z.infer<typeof addToWishlistSchema>;

