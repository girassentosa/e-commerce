/**
 * Product Validation Schemas
 * Zod schemas untuk validate product data
 */

import { z } from 'zod';

// Create Product Schema
export const createProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes')
    .max(255, 'Slug is too long'),
  categoryId: z
    .string()
    .min(1, 'Category is required'),
  description: z
    .string()
    .optional(),
  price: z
    .number()
    .positive('Price must be positive')
    .max(999999.99, 'Price is too high'),
  salePrice: z
    .number()
    .positive('Sale price must be positive')
    .max(999999.99, 'Sale price is too high')
    .optional()
    .nullable(),
  stockQuantity: z
    .number()
    .int('Stock must be an integer')
    .min(0, 'Stock cannot be negative')
    .default(0),
  lowStockThreshold: z
    .number()
    .int('Threshold must be an integer')
    .min(0, 'Threshold cannot be negative')
    .default(10),
  sku: z
    .string()
    .max(50, 'SKU is too long')
    .optional()
    .nullable(),
  brand: z
    .string()
    .max(100, 'Brand name is too long')
    .optional()
    .nullable(),
  weight: z
    .number()
    .positive('Weight must be positive')
    .optional()
    .nullable(),
  isFeatured: z
    .boolean()
    .default(false),
  isActive: z
    .boolean()
    .default(true),
  metaTitle: z
    .string()
    .max(255, 'Meta title is too long')
    .optional()
    .nullable(),
  metaDescription: z
    .string()
    .max(500, 'Meta description is too long')
    .optional()
    .nullable(),
  images: z
    .array(
      z.object({
        url: z.string().url('Invalid image URL'),
        altText: z.string().optional(),
        isPrimary: z.boolean().default(false),
        sortOrder: z.number().int().min(0).default(0),
      })
    )
    .optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1, 'Variant name is required'),
        value: z.string().min(1, 'Variant value is required'),
        priceModifier: z.number().default(0),
        stockQuantity: z.number().int().min(0).default(0),
      })
    )
    .optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;

// Update Product Schema (all fields optional except id)
export const updateProductSchema = createProductSchema.partial();

export type UpdateProductInput = z.infer<typeof updateProductSchema>;

// Product Query/Filter Schema
export const productQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val) || 1),
  limit: z
    .string()
    .optional()
    .default('12')
    .transform((val) => parseInt(val) || 12),
  categoryId: z
    .string()
    .optional()
    .nullable(),
  search: z
    .string()
    .optional()
    .nullable(),
  minPrice: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  maxPrice: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val ? parseFloat(val) : undefined)),
  brand: z
    .string()
    .optional()
    .nullable(),
  isFeatured: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val === 'true' ? true : undefined),
  isActive: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val === 'true' ? true : val === 'false' ? false : undefined),
  sort: z
    .enum(['newest', 'price_asc', 'price_desc', 'popular', 'rating'])
    .optional()
    .default('newest'),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

