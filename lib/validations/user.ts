import { z } from 'zod';

/**
 * User form validation schema (Admin)
 */
export const userSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'CUSTOMER'], {
    message: 'Role must be ADMIN or CUSTOMER',
  }),
  isActive: z.boolean().default(true),
});

export type UserFormData = z.infer<typeof userSchema>;

/**
 * User create schema (requires password)
 */
export const userCreateSchema = userSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * User update schema (password optional)
 */
export const userUpdateSchema = userSchema.extend({
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

