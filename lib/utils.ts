/**
 * Utility Functions
 * Helper functions yang digunakan di seluruh aplikasi
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes dengan conflict resolution
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format currency to readable string
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
  }).format(numericAmount);
}

/**
 * Format number to Indonesian format (with dots as thousand separators)
 * Example: 59500 → "59.500"
 */
export function formatIndonesianNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '';
  }
  
  // Format dengan titik sebagai pemisah ribuan, tanpa desimal
  return Math.floor(numValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Parse Indonesian number format to number
 * Example: "59.500" → 59500
 * Handles both "59.500" and "59500" formats
 */
export function parseIndonesianNumber(value: string | null | undefined): number | null {
  if (!value || value === '') {
    return null;
  }
  
  // Remove all dots (thousand separators) and spaces
  const cleaned = value.toString().replace(/\./g, '').replace(/\s/g, '').trim();
  
  // Parse to number
  const parsed = parseFloat(cleaned);
  
  if (isNaN(parsed)) {
    return null;
  }
  
  return parsed;
}

/**
 * Format date to readable string
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', options).format(dateObj);
}

/**
 * Generate random string for order number, etc
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate unique order number
 */
export function generateOrderNumber(): string {
  const prefix = 'ORD';
  const timestamp = Date.now().toString().slice(-6);
  const random = generateRandomString(4);
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Slugify string for URLs
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-')      // Replace multiple - with single -
    .replace(/^-+/, '')          // Trim - from start of text
    .replace(/-+$/, '');         // Trim - from end of text
}

/**
 * Calculate discount percentage
 */
export function calculateDiscountPercentage(
  originalPrice: number,
  salePrice: number
): number {
  if (originalPrice <= 0) return 0;
  const discount = ((originalPrice - salePrice) / originalPrice) * 100;
  return Math.round(discount);
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

/**
 * Calculate cart total
 */
export function calculateCartTotal(
  items: Array<{ quantity: number; price: number | string }>
): number {
  return items.reduce((total, item) => {
    const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
    return total + (item.quantity * price);
  }, 0);
}

/**
 * Get image URL or fallback
 */
export function getImageUrl(url: string | null | undefined, fallback: string = '/placeholder.png'): string {
  return url || fallback;
}

/**
 * Sleep function for delays
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if user is admin
 */
export function isAdmin(role: string | undefined): boolean {
  return role === 'ADMIN';
}

/**
 * Format phone number
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}

