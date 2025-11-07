/**
 * Order Validation Schemas
 * Zod schemas untuk validasi Order API requests
 */

import { z } from 'zod';

/**
 * Schema untuk order query parameters
 */
export const orderQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  status: z
    .enum(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .optional(),
});

// Export types
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;

