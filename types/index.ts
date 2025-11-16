/**
 * TypeScript Type Definitions
 * Shared types untuk seluruh aplikasi
 */

// ===================================
// USER TYPES
// ===================================

export type UserRole = 'CUSTOMER' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  role: UserRole;
  emailVerified: boolean;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface UserProfile extends User {
  addresses?: ShippingAddress[];
}

// ===================================
// PRODUCT TYPES
// ===================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive: boolean;
  createdAt: Date | string;
}

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText?: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceModifier: number | string;
  stockQuantity: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sku?: string | null;
  description?: string | null;
  price: number | string;
  salePrice?: number | string | null;
  stockQuantity: number;
  lowStockThreshold: number;
  weight?: number | string | null;
  brand?: string | null;
  isFeatured: boolean;
  isActive: boolean;
  viewsCount: number;
  salesCount: number;
  ratingAverage: number | string;
  ratingCount: number;
  metaTitle?: string | null;
  metaDescription?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  category?: Category;
  images?: ProductImage[];
  variants?: ProductVariant[];
}

// ===================================
// CART TYPES
// ===================================

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  price: number | string;
  addedAt: Date | string;
  product?: Product;
  variant?: ProductVariant;
}

export interface Cart {
  id: string;
  userId: string;
  sessionId?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: CartItem[];
}

// ===================================
// ORDER TYPES
// ===================================

export type OrderStatus = 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string | null;
  productName: string;
  quantity: number;
  price: number | string;
  total: number | string;
  product?: Product;
  variant?: ProductVariant;
}

export interface ShippingAddress {
  id: string;
  orderId?: string | null;
  userId?: string | null;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string | null;
  paymentChannel?: string | null;
  transactionId?: string | null;
  subtotal: number | string;
  tax: number | string;
  shippingCost: number | string;
  serviceFee?: number | string;
  paymentFee?: number | string;
  discount: number | string;
  total: number | string;
  currency: string;
  notes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  paidAt?: Date | string | null;
  items?: OrderItem[];
  shippingAddress?: ShippingAddress[];
  user?: User;
  paymentTransactions?: PaymentTransaction[];
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  provider: string;
  paymentType: string;
  channel?: string | null;
  amount: number | string;
  status: PaymentStatus;
  transactionId?: string | null;
  vaNumber?: string | null;
  vaBank?: string | null;
  qrString?: string | null;
  qrImageUrl?: string | null;
  paymentUrl?: string | null;
  instructions?: string | null;
  expiresAt?: Date | string | null;
  rawResponse?: Record<string, any> | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// ===================================
// REVIEW TYPES
// ===================================

export interface Review {
  id: string;
  productId: string;
  userId: string;
  orderId?: string | null;
  rating: number;
  title?: string | null;
  comment?: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  createdAt: Date | string;
  user?: User;
  product?: Product;
}

// ===================================
// WISHLIST TYPES
// ===================================

export interface Wishlist {
  id: string;
  userId: string;
  productId: string;
  addedAt: Date | string;
  product?: Product;
}

// ===================================
// NOTIFICATION TYPES
// ===================================

export type NotificationType = 'order' | 'promotion' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  link?: string | null;
  createdAt: Date | string;
}

// ===================================
// API RESPONSE TYPES
// ===================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  pagination: PaginationMeta;
}

// ===================================
// FORM TYPES
// ===================================

export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

export interface ProductFormData {
  name: string;
  slug: string;
  categoryId: string;
  description?: string;
  price: number;
  salePrice?: number;
  stockQuantity: number;
  sku?: string;
  brand?: string;
  isFeatured?: boolean;
  isActive?: boolean;
  images?: Array<{
    url: string;
    alt?: string;
  }>;
}

export interface CheckoutFormData {
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  paymentMethod: string;
  notes?: string;
}

// ===================================
// FILTER & SORT TYPES
// ===================================

export interface ProductFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  rating?: number;
  inStock?: boolean;
  isFeatured?: boolean;
}

export interface ProductSort {
  sortBy: 'newest' | 'price_asc' | 'price_desc' | 'popular' | 'rating';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface ProductQueryParams extends ProductFilters, ProductSort, PaginationParams {}

// ===================================
// STATS TYPES (for Admin Dashboard)
// ===================================

export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: Order[];
  topProducts: Array<{
    product: Product;
    totalSales: number;
    revenue: number;
  }>;
  salesByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

