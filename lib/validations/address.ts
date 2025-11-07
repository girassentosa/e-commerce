/**
 * Shipping Address Validation Schemas
 * Zod schemas untuk validasi Address API requests
 */

import { z } from 'zod';

/**
 * Schema untuk add new address
 */
export const addAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State/Province is required'),
  postalCode: z.string().min(3, 'Postal code is required'),
  country: z.string().min(2, 'Country is required'),
  isDefault: z.boolean().default(false),
});

/**
 * Schema untuk update address
 */
export const updateAddressSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: z.string().min(10, 'Phone number must be at least 10 characters').optional(),
  addressLine1: z.string().min(5, 'Address must be at least 5 characters').optional(),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required').optional(),
  state: z.string().min(2, 'State/Province is required').optional(),
  postalCode: z.string().min(3, 'Postal code is required').optional(),
  country: z.string().min(2, 'Country is required').optional(),
  isDefault: z.boolean().optional(),
});

// Export types
export type AddAddressInput = z.infer<typeof addAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;

