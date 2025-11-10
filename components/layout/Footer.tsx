/**
 * Footer Component
 * Main footer dengan links dan info
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';
import { getStoreSettings } from '@/lib/settings';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [storeSettings, setStoreSettings] = useState<{
    storeName?: string;
    storeDescription?: string;
    contactEmail?: string;
    contactPhone?: string;
    storeAddress?: string;
  }>({});

  useEffect(() => {
    getStoreSettings().then((settings) => {
      setStoreSettings(settings);
    });
  }, []);

  const displayName = storeSettings.storeName || APP_NAME;
  const displayDescription = storeSettings.storeDescription || 
    'Your one-stop shop for everything you need. Quality products, great prices, and excellent service.';

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <span className="text-2xl">🛍️</span>
              <span className="text-xl font-bold text-white">{displayName}</span>
            </div>
            <p className="text-sm">
              {displayDescription}
            </p>
            {storeSettings.contactEmail && (
              <p className="text-sm mt-2">
                <a href={`mailto:${storeSettings.contactEmail}`} className="hover:text-white transition-colors">
                  {storeSettings.contactEmail}
                </a>
              </p>
            )}
            {storeSettings.contactPhone && (
              <p className="text-sm">
                <a href={`tel:${storeSettings.contactPhone}`} className="hover:text-white transition-colors">
                  {storeSettings.contactPhone}
                </a>
              </p>
            )}
          </div>

          {/* Shop Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Shop</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  All Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Account</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/profile" className="hover:text-white transition-colors">
                  Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Help Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Help</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm">
              © {currentYear} {displayName}. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link href="/privacy" className="text-sm hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm hover:text-white transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

