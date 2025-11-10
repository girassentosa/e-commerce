# 🌟 Fitur Engaging - Implementation Guide

Panduan lengkap untuk implementasi fitur-fitur engaging yang meningkatkan conversion dan user experience.

---

## ✅ **SUDAH DIIMPLEMENTASI:**

### 1. Quick View Modal ✓
**File:** `components/products/QuickViewModal.tsx`

**Features:**
- Popup detail produk tanpa pindah halaman
- Slide from bottom di mobile
- Image gallery dengan thumbnails
- Add to cart & wishlist
- Link ke full product page

**Usage:**
```tsx
import { QuickViewModal } from '@/components/products/QuickViewModal';

const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

<QuickViewModal
  product={quickViewProduct}
  isOpen={!!quickViewProduct}
  onClose={() => setQuickViewProduct(null)}
  onAddToCart={handleAddToCart}
  onToggleWishlist={handleToggleWishlist}
  isWishlisted={isInWishlist(quickViewProduct?.id)}
/>

// Trigger dari Product Card:
<button onClick={() => setQuickViewProduct(product)}>
  Quick View
</button>
```

---

### 2. Stock Indicator dengan Progress Bar ✓
**File:** `components/products/StockIndicator.tsx`

**Features:**
- Warning colors berdasarkan stock level
- Progress bar untuk visualisasi stock
- Responsive sizes (sm/md/lg)
- Compact badge variant

**Usage:**
```tsx
import { StockIndicator, StockBadge } from '@/components/products/StockIndicator';

// Full indicator dengan progress bar
<StockIndicator 
  stock={product.stock}
  maxStock={100}
  showProgressBar={true}
  size="md"
/>

// Compact badge untuk product cards
<StockBadge stock={product.stock} />
```

**Stock Levels:**
- **0**: Out of Stock (red, no progress)
- **1-3**: Critical (red, pulsing, "Only X left!")
- **4-10**: Low (orange, "Only X left in stock")
- **11-30**: Medium (yellow, with progress)
- **31+**: High (green, no badge needed)

---

### 3. Bundle Deals Component ✓
**File:** `components/products/BundleDeals.tsx`

**Features:**
- "Buy 2 Save 10%", "Buy 3 Save 15%", "Buy 5+ Save 20%"
- Visual pricing dengan savings calculation
- Best deal highlighting
- Gradient background yang attractive
- Auto-selects based on quantity

**Usage:**
```tsx
import { BundleDeals, BundleBadge } from '@/components/products/BundleDeals';

// Full bundle selector
<BundleDeals
  productPrice={parseFloat(product.price)}
  selectedQuantity={quantity}
  onSelectDeal={(deal) => setQuantity(deal.quantity)}
/>

// Compact badge
<BundleBadge discount={20} />
```

---

## 📝 **TODO - IMPLEMENTATION GUIDES:**

### 4. Recently Viewed Sticky Bar

**Design:**
```
┌──────────────────────────────────────────────────────────┐
│  Recently Viewed (5 items) [← →]  [Hide]                 │
│  [Card] [Card] [Card] [Card] [Card] ───────►            │
└──────────────────────────────────────────────────────────┘
```

**Implementation Steps:**

1. **Create Component** `components/products/RecentlyViewedBar.tsx`:
```tsx
'use client';

import { useState, useEffect } from 'react';
import { ProductCard } from '@/components/products/ProductCard';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

export function RecentlyViewedBar() {
  const [products, setProducts] = useState([]);
  const [isVisible, setIsVisible] = useState(true);
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    // Fetch from /api/last-viewed
    fetch('/api/last-viewed')
      .then(res => res.json())
      .then(data => setProducts(data.products || []));
  }, []);

  if (!isVisible || products.length === 0) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
      <div className="max-w-[1440px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-900">
            Recently Viewed ({products.length})
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Scroll Container */}
        <div className="relative">
          <button
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-4 pb-2">
              {products.map(product => (
                <div key={product.id} className="w-48 flex-shrink-0">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-white rounded-full shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

2. **Add to Layout** `app/(shop)/layout.tsx`:
```tsx
import { RecentlyViewedBar } from '@/components/products/RecentlyViewedBar';

export default function ShopLayout({ children }) {
  return (
    <>
      {children}
      <RecentlyViewedBar />
    </>
  );
}
```

3. **Styling Considerations:**
- Desktop: Sticky at bottom-4, full width
- Mobile: Above bottom nav (bottom-20)
- Hide/show toggle dengan localStorage
- Auto-hide after 30 seconds (optional)

---

### 5. Size Guide Modal

**Design:**
```
┌─────────────────────────────────────────┐
│  Size Guide                        [×]   │
├─────────────────────────────────────────┤
│  How to Measure                         │
│  [Image showing measurement points]     │
│                                          │
│  Size Chart:                             │
│  ┌────┬────┬────┬────┬────┐            │
│  │Size│Bust│Waist│Hip │Length│         │
│  ├────┼────┼────┼────┼────┤            │
│  │ XS │ 32 │ 24 │ 34 │ 24  │           │
│  │ S  │ 34 │ 26 │ 36 │ 25  │           │
│  │ M  │ 36 │ 28 │ 38 │ 26  │           │
│  │ L  │ 38 │ 30 │ 40 │ 27  │           │
│  │ XL │ 40 │ 32 │ 42 │ 28  │           │
│  └────┴────┴────┴────┴────┘            │
│                                          │
│  [Find Your Size]                        │
└─────────────────────────────────────────┘
```

**Implementation:**

1. **Create Component** `components/products/SizeGuideModal.tsx`:
```tsx
'use client';

import { X, Ruler } from 'lucide-react';

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  category?: string; // 'clothing', 'shoes', 'accessories'
}

export function SizeGuideModal({ isOpen, onClose, category = 'clothing' }: SizeGuideModalProps) {
  if (!isOpen) return null;

  const sizeCharts = {
    clothing: [
      { size: 'XS', bust: '32"', waist: '24"', hip: '34"', length: '24"' },
      { size: 'S', bust: '34"', waist: '26"', hip: '36"', length: '25"' },
      { size: 'M', bust: '36"', waist: '28"', hip: '38"', length: '26"' },
      { size: 'L', bust: '38"', waist: '30"', hip: '40"', length: '27"' },
      { size: 'XL', bust: '40"', waist: '32"', hip: '42"', length: '28"' },
    ],
    shoes: [
      { size: 'US 6', eu: '36', uk: '3.5', cm: '23' },
      { size: 'US 7', eu: '37', uk: '4.5', cm: '24' },
      { size: 'US 8', eu: '38', uk: '5.5', cm: '25' },
      { size: 'US 9', eu: '39', uk: '6.5', cm: '26' },
      { size: 'US 10', eu: '40', uk: '7.5', cm: '27' },
    ],
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Size Guide</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* How to Measure */}
            <div>
              <h3 className="font-bold mb-2">How to Measure</h3>
              <div className="bg-gray-100 rounded-lg p-4 space-y-2 text-sm">
                <p>• <strong>Bust:</strong> Measure around the fullest part</p>
                <p>• <strong>Waist:</strong> Measure around natural waistline</p>
                <p>• <strong>Hip:</strong> Measure around the fullest part</p>
                <p>• <strong>Length:</strong> Measure from shoulder to hem</p>
              </div>
            </div>

            {/* Size Chart Table */}
            <div>
              <h3 className="font-bold mb-2">Size Chart</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-blue-50">
                      {Object.keys(sizeCharts[category][0]).map(key => (
                        <th key={key} className="border border-gray-300 px-4 py-2 text-left font-semibold">
                          {key.toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sizeCharts[category].map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        {Object.values(row).map((value, j) => (
                          <td key={j} className="border border-gray-300 px-4 py-2">
                            {value}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>💡 Tip:</strong> If you're between sizes, we recommend sizing up for a more comfortable fit.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
```

2. **Trigger Button:**
```tsx
<button
  onClick={() => setShowSizeGuide(true)}
  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
>
  <Ruler className="w-4 h-4" />
  Size Guide
</button>
```

---

### 6. Product Comparison

**Design:**
```
[✓] Compare (0/3 selected)

┌─────────────────────────────────────────────────┐
│ Compare Products                           [×]  │
├─────────────┬─────────────┬─────────────────────┤
│  Product A  │  Product B  │   Product C         │
├─────────────┼─────────────┼─────────────────────┤
│ Price       │ $199        │ $249      │ $299    │
│ Rating      │ ⭐⭐⭐⭐⭐   │ ⭐⭐⭐⭐    │ ⭐⭐⭐⭐⭐  │
│ Stock       │ In Stock    │ Low       │ In Stock│
│ Brand       │ Nike        │ Adidas    │ Puma    │
└─────────────┴─────────────┴─────────────────────┘
```

**Implementation:**

1. **Create Context** `contexts/ComparisonContext.tsx`:
```tsx
'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface Product {
  id: string;
  name: string;
  price: string;
  // ... other fields
}

interface ComparisonContextType {
  comparisonList: Product[];
  addToComparison: (product: Product) => void;
  removeFromComparison: (productId: string) => void;
  clearComparison: () => void;
  isInComparison: (productId: string) => boolean;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonList, setComparisonList] = useState<Product[]>([]);
  const MAX_COMPARISON = 3;

  const addToComparison = (product: Product) => {
    if (comparisonList.length >= MAX_COMPARISON) {
      alert(`You can only compare up to ${MAX_COMPARISON} products`);
      return;
    }
    if (!isInComparison(product.id)) {
      setComparisonList([...comparisonList, product]);
    }
  };

  const removeFromComparison = (productId: string) => {
    setComparisonList(comparisonList.filter(p => p.id !== productId));
  };

  const clearComparison = () => setComparisonList([]);

  const isInComparison = (productId: string) => 
    comparisonList.some(p => p.id === productId);

  return (
    <ComparisonContext.Provider
      value={{
        comparisonList,
        addToComparison,
        removeFromComparison,
        clearComparison,
        isInComparison,
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (!context) throw new Error('useComparison must be used within ComparisonProvider');
  return context;
};
```

2. **Comparison Button on Product Card:**
```tsx
<input
  type="checkbox"
  checked={isInComparison(product.id)}
  onChange={() => isInComparison(product.id) 
    ? removeFromComparison(product.id) 
    : addToComparison(product)
  }
  className="w-4 h-4"
/>
<label>Compare</label>
```

3. **Comparison Modal** `components/products/ComparisonModal.tsx`:
```tsx
// Similar structure to QuickViewModal
// Show side-by-side table with product specs
```

---

### 7. Live Chat Widget

**Design:**
```
                                    ┌──────────────┐
                                    │ Chat with us │
                                    │    [💬]       │
                                    └──────────────┘
                                    (bottom-right)
```

**Implementation Options:**

**A) Custom Implementation:**
```tsx
'use client';

import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';

export function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  return (
    <>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-4 right-4 z-50 w-14 h-14 bg-blue-600 text-white rounded-full shadow-2xl hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-6 h-6 mx-auto" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 w-80 h-96 bg-white rounded-2xl shadow-2xl flex flex-col">
          {/* Header */}
          <div className="bg-blue-600 text-white p-4 rounded-t-2xl flex justify-between items-center">
            <div>
              <h3 className="font-bold">Live Chat</h3>
              <p className="text-xs opacity-90">We reply instantly</p>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-3 py-2 rounded-lg text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 border rounded-lg text-sm"
            />
            <button
              onClick={handleSend}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
```

**B) Third-Party Integration (Recommended):**
- **Tawk.to** (Free): https://www.tawk.to
- **Crisp** (Freemium): https://crisp.chat
- **Intercom** (Premium): https://www.intercom.com

```tsx
// Add script to app/layout.tsx
<Script id="tawk-to">
  {`
    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
    (function(){
      var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      s1.async=true;
      s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
      s1.charset='UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();
  `}
</Script>
```

---

### 8. Customer Photos Section

**Design:**
```
┌────────────────────────────────────────────────┐
│  Customer Photos (24)                     [+]  │
├────────────────────────────────────────────────┤
│  [Photo] [Photo] [Photo] [Photo] [Photo] →    │
│  ⭐⭐⭐⭐⭐  ⭐⭐⭐⭐    ⭐⭐⭐⭐⭐              │
│  "Great!"  "Love it" "Amazing"                │
└────────────────────────────────────────────────┘
```

**Implementation:**

1. **Database Schema Update** `prisma/schema.prisma`:
```prisma
model Review {
  id        String   @id @default(cuid())
  // ... existing fields
  images    String[] @default([]) // Array of image URLs
  verified  Boolean  @default(false) // Verified purchase
}
```

2. **Component** `components/products/CustomerPhotos.tsx`:
```tsx
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Star, X } from 'lucide-react';

interface CustomerPhoto {
  id: string;
  imageUrl: string;
  rating: number;
  comment: string;
  userName: string;
  verified: boolean;
}

export function CustomerPhotos({ productId }: { productId: string }) {
  const [photos, setPhotos] = useState<CustomerPhoto[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<CustomerPhoto | null>(null);

  useEffect(() => {
    // Fetch customer photos
    fetch(`/api/products/${productId}/customer-photos`)
      .then(res => res.json())
      .then(data => setPhotos(data.photos || []));
  }, [productId]);

  if (photos.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">
          Customer Photos ({photos.length})
        </h3>
        <button className="text-sm text-blue-600 hover:underline">
          Upload Photo
        </button>
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {photos.map(photo => (
          <button
            key={photo.id}
            onClick={() => setSelectedPhoto(photo)}
            className="relative aspect-square rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
          >
            <Image
              src={photo.imageUrl}
              alt="Customer photo"
              fill
              className="object-cover"
            />
            {photo.verified && (
              <div className="absolute top-1 right-1 bg-green-500 text-white text-[10px] px-1 rounded">
                ✓
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-90 z-50" onClick={() => setSelectedPhoto(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6">
              <div className="flex justify-between mb-4">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < selectedPhoto.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                    ))}
                  </div>
                  <p className="font-semibold">{selectedPhoto.userName}</p>
                </div>
                <button onClick={() => setSelectedPhoto(null)}>
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-square mb-4">
                <Image
                  src={selectedPhoto.imageUrl}
                  alt="Customer photo"
                  fill
                  className="object-cover rounded-lg"
                />
              </div>

              <p className="text-gray-700">{selectedPhoto.comment}</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

3. **API Endpoint** `app/api/products/[id]/customer-photos/route.ts`:
```tsx
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const reviews = await prisma.review.findMany({
    where: {
      productId: params.id,
      images: {
        isEmpty: false, // Only reviews with images
      },
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const photos = reviews.flatMap(review =>
    review.images.map(imageUrl => ({
      id: review.id,
      imageUrl,
      rating: review.rating,
      comment: review.comment,
      userName: `${review.user.firstName} ${review.user.lastName}`,
      verified: true, // Check if verified purchase
    }))
  );

  return NextResponse.json({ photos });
}
```

---

## 📊 **Implementation Priority Ranking:**

| Feature | Priority | Complexity | Impact | Status |
|---------|----------|------------|--------|--------|
| Quick View Modal | 🔥 High | Medium | High | ✅ Done |
| Stock Indicator | 🔥 High | Low | High | ✅ Done |
| Bundle Deals | 🔥 High | Medium | High | ✅ Done |
| Recently Viewed | 🔸 Medium | Medium | Medium | 📝 Guide |
| Size Guide | 🔸 Medium | Low | Medium | 📝 Guide |
| Product Comparison | 🔹 Low | High | Medium | 📝 Guide |
| Live Chat | 🔸 Medium | Low* | High | 📝 Guide |
| Customer Photos | 🔸 Medium | High | High | 📝 Guide |

*Low if using third-party, High if custom

---

## 🚀 **Next Steps:**

1. **Immediate** (This session):
   - ✅ Quick View Modal
   - ✅ Stock Indicator
   - ✅ Bundle Deals

2. **Phase 2** (Next sprint):
   - Recently Viewed Bar
   - Size Guide Modal
   - Live Chat Widget (use Tawk.to)

3. **Phase 3** (Future):
   - Product Comparison
   - Customer Photos Section

---

## 💡 **Tips:**

- **Test on mobile first** - Most features look different on mobile
- **Use progressive enhancement** - Features should work without JS
- **Optimize images** - Use Next.js Image component with blur placeholder
- **Monitor performance** - Don't load too many heavy components at once
- **A/B test** - Test which features actually improve conversion

---

**Happy coding! 🎉**

