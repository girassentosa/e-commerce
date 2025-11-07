import { z } from 'zod';

/**
 * Product form validation schema
 */
export const productSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  name: z.string().min(1, 'Product name is required').max(200, 'Name too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  sku: z.string().optional(),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  salePrice: z.coerce.number().min(0).optional().nullable(),
  stockQuantity: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(0).default(10),
  weight: z.coerce.number().min(0).optional().nullable(),
  brand: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(150).optional(),
  metaDescription: z.string().max(300).optional(),
  images: z
    .array(
      z.object({
        imageUrl: z
          .string()
          .min(1, 'Image URL is required')
          .refine(
            (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
            {
              message: 'Image URL must be a valid path or URL',
            }
          ),
        altText: z.string().optional(),
      })
    )
    .optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

/**
 * Category form validation schema
 */
export const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
  description: z.string().optional(),
  imageUrl: z
    .string()
    .min(1, 'Image URL is required')
    .refine(
      (val) => val.startsWith('/') || val.startsWith('http://') || val.startsWith('https://'),
      {
        message: 'Image URL must be a valid path or URL',
      }
    )
    .optional()
    .nullable(),
  parentId: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export type CategoryFormData = z.infer<typeof categorySchema>;

