/**
 * Checkout Validation Schemas
 * Zod schemas untuk validasi Checkout API requests
 */

import { z } from 'zod';

/**
 * Schema untuk checkout (create order)
 */
export const checkoutSchema = z.object({
  addressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.enum(['COD', 'CREDIT_CARD', 'BANK_TRANSFER', 'VIRTUAL_ACCOUNT', 'QRIS'], {
    message: 'Invalid payment method',
  }),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  couponCode: z.string().optional(),
});

/**
 * Schema untuk buy now checkout
 */
export const buyNowCheckoutSchema = z.object({
  addressId: z.string().min(1, 'Shipping address is required'),
  paymentMethod: z.enum(['COD', 'VIRTUAL_ACCOUNT', 'QRIS'], {
    message: 'Invalid payment method',
  }),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be positive'),
  color: z.string().optional(),
  size: z.string().optional(),
  imageUrl: z.string().optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  couponCode: z.string().optional(),
});

/**
 * Schema untuk calculate totals
 */
export const calculateTotalsSchema = z.object({
  addressId: z.string().min(1, 'Address is required'),
  couponCode: z.string().optional(),
});

// Export types
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type BuyNowCheckoutInput = z.infer<typeof buyNowCheckoutSchema>;
export type CalculateTotalsInput = z.infer<typeof calculateTotalsSchema>;

