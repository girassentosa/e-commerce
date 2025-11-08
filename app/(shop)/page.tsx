/**
 * Homepage
 * Landing page untuk E-Commerce platform
 */

'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductGridSkeleton } from '@/components/products/ProductSkeleton';
import { Loader } from '@/components/ui/Loader';
import { Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  price: string;
  salePrice?: string | null;
  imageUrl?: string | null;
  images?: string[];
  stock: number;
  category?: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand?: string | null;
  rating?: number | null;
  reviewCount?: number;
  isFeatured?: boolean;
}

function HomePageContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Get filters from URL params
  const currentFilters = useMemo(() => ({
    categoryId: searchParams.get('categoryId') || undefined,
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    sort: searchParams.get('sort') || 'newest',
  }), [searchParams]);

  const fetchAllProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams();
      
      // Add filters to API request
      if (currentFilters.categoryId) params.append('categoryId', currentFilters.categoryId);
      if (currentFilters.minPrice) params.append('minPrice', currentFilters.minPrice.toString());
      if (currentFilters.maxPrice) params.append('maxPrice', currentFilters.maxPrice.toString());
      if (currentFilters.sort) params.append('sort', currentFilters.sort);
      params.append('limit', '1000');

      const response = await fetch(`/api/products?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchAllProducts();
  }, [currentFilters]);

  // If user is logged in, show customer-focused homepage
  if (session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Welcome back, {session.user.firstName || session.user.email}! 👋
            </h1>
            <p className="text-lg text-gray-600">
              Discover amazing products and start shopping
            </p>
          </div>

          {/* All Products Section */}
          <div className="mb-12">
            <div className="mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                ⭐ All Products
              </h2>
            </div>
            
            {loadingProducts && products.length === 0 ? (
              <ProductGridSkeleton count={12} />
            ) : products.length > 0 ? (
              <ProductGrid products={products} columns={4} />
            ) : (
              !loadingProducts && (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">No products available</p>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    );
  }

  // Default landing page for non-logged in users
  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Welcome to{' '}
            <span className="text-indigo-600">Modern E-Commerce</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Full-stack e-commerce platform built with Next.js 14, TypeScript, and Prisma.
            Sign in to start shopping! 🚀
          </p>
        </div>

        {/* All Products Section */}
        <div className="mt-20">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              ⭐ All Products
            </h2>
          </div>
          
          {loadingProducts && products.length === 0 ? (
            <ProductGridSkeleton count={12} />
          ) : products.length > 0 ? (
            <ProductGrid products={products} columns={4} />
          ) : (
            !loadingProducts && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No products available</p>
              </div>
            )
          )}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          <Card variant="elevated" padding="lg">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                FASE 1 Complete
              </h3>
              <p className="text-gray-600 text-sm">
                Project setup, database schema, and base components ready!
              </p>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                FASE 2 Complete
              </h3>
              <p className="text-gray-600 text-sm">
                Authentication system with login, register & session management!
              </p>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                FASE 3-4 Complete
              </h3>
              <p className="text-gray-600 text-sm">
                Product API, listing page, detail page, filters & search ready!
              </p>
            </div>
          </Card>
        </div>

        {/* Features Preview */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What's Inside? 📦
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {features.map((feature, index) => (
              <Card key={index} padding="lg" className="hover:shadow-xl transition-shadow">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
                {feature.status && (
                  <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    {feature.status}
                  </span>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Built With Modern Technologies
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {techStack.map((tech, index) => (
              <div
                key={index}
                className="px-4 py-2 bg-white border-2 border-gray-200 rounded-lg text-sm font-medium text-gray-700"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-indigo-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Shopping?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Create an account or sign in to access all features!
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-indigo-600">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-16 text-center text-gray-600 text-sm">
          <p>
            Made with ❤️ using Next.js 14 | FASE 4: Product Pages Complete ✅
          </p>
        </div>
      </div>
    </div>
  );
}

// Features data
const features = [
  {
    icon: '🔐',
    title: 'Authentication',
    description: 'Secure user login & registration with NextAuth.js',
    status: 'Completed ✅',
  },
  {
    icon: '📦',
    title: 'Product Management',
    description: 'Full CRUD operations for products with filters & search',
    status: 'Completed ✅',
  },
  {
    icon: '🛒',
    title: 'Shopping Cart',
    description: 'Add, update, and manage cart items',
    status: 'Completed ✅',
  },
  {
    icon: '💳',
    title: 'Checkout',
    description: 'Multi-step checkout with payment integration',
    status: 'Completed ✅',
  },
  {
    icon: '📋',
    title: 'Order Management',
    description: 'Track and manage customer orders',
    status: 'Completed ✅',
  },
  {
    icon: '⭐',
    title: 'Reviews & Ratings',
    description: 'Product review system with ratings',
    status: 'Completed ✅',
  },
  {
    icon: '👤',
    title: 'User Dashboard',
    description: 'Profile, orders, and wishlist management',
    status: 'Completed ✅',
  },
  {
    icon: '🔧',
    title: 'Admin Panel',
    description: 'Complete admin dashboard with product, order, user, and review management',
    status: 'Completed ✅',
  },
];

// Tech stack
const techStack = [
  'Next.js 14',
  'TypeScript',
  'PostgreSQL',
  'Prisma ORM',
  'NextAuth.js',
  'Tailwind CSS',
  'Zustand',
  'Zod',
  'React Hot Toast',
];

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}

