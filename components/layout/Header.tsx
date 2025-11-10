/**
 * Header Component - Modern E-Commerce Navigation
 * Structure: Top Promo Bar → Main Header → Category Navigation
 * Sticky dengan slide-up animation & shadow on scroll
 */

'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ShoppingCart, 
  Search, 
  ChevronDown,
  Truck,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default function Header() {
  const { data: session } = useSession();
  const { itemCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories
  useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Initialize search from URL
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    setSearchQuery(urlSearch);
  }, [searchParams]);


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const isHomepage = pathname === '/';

  return (
    <>
      {/* ========================================
          TOP PROMO BAR (Optional, Thin)
      ======================================== */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center py-2 text-xs sm:text-sm font-medium">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex items-center justify-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Free shipping for orders over $500</span>
          </div>
        </div>
      </div>

      {/* ========================================
          MAIN HEADER (Sticky)
      ======================================== */}
      <header
        className={`sticky top-0 z-50 bg-white transition-all duration-300 ${
          isScrolled
            ? 'shadow-md border-b border-gray-200'
            : 'shadow-sm'
        }`}
      >
        <div className="max-w-[1440px] mx-auto px-4 sm:px-4 md:px-6">
          {/* Main Header Row */}
          <div className="flex items-center h-14 sm:h-16 md:h-20 gap-3 sm:gap-3 md:gap-4">
            
            {/* Center: Search Bar - Simple, No Pop/Card, Responsive with proper spacing */}
            <div className="flex-1 min-w-0 max-w-[calc(100%-64px)] sm:max-w-none">
              <form onSubmit={handleSearch} className="w-full">
                <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 border border-gray-200 rounded-lg px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5">
                  <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-500 flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-xs sm:text-sm md:text-base text-gray-900 placeholder-gray-500"
                  />
                </div>
              </form>
            </div>

            {/* Right: Cart */}
            <div className="flex items-center flex-shrink-0 w-12 sm:w-auto">
              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 sm:p-2 md:p-3 rounded-lg transition-colors group"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-gray-700 group-hover:text-blue-600 transition-colors" />
                {itemCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 bg-red-500 text-white text-[9px] sm:text-xs font-bold rounded-full h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 flex items-center justify-center shadow-lg">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* ========================================
              CATEGORY NAVIGATION BAR
          ======================================== */}
          <div className="border-t border-gray-200 hidden lg:block">
            <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide py-3">
              <Link
                href="/products"
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                  pathname === '/products'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All Products
              </Link>
              {categories.slice(0, 10).map((category) => (
                <Link
                  key={category.id}
                  href={`/products?categoryId=${category.id}`}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                    searchParams.get('categoryId') === category.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {category.name}
                </Link>
              ))}
              {categories.length > 10 && (
                <button className="px-4 py-2 rounded-lg font-medium text-sm text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1 whitespace-nowrap">
                  More
                  <ChevronDown className="w-4 h-4" />
                </button>
              )}
            </nav>
          </div>
        </div>

      </header>
    </>
  );
}
