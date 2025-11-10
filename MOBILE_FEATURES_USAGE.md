# 📱 Mobile-First Features - Usage Guide

Panduan lengkap penggunaan semua fitur mobile optimization.

---

## ✅ **FITUR YANG SUDAH DIIMPLEMENTASI:**

### 1. ✅ Bottom Navigation Bar

**Location:** `app/(shop)/layout.tsx`

**Features:**
- Home, Categories, Cart, Profile
- Thumb-friendly: min 44px touch targets
- Active state indicators
- Cart badge dengan count
- Hidden di desktop (sm:hidden)

**Auto-applied:** Tidak perlu setup, sudah terintegrasi di layout

---

### 2. ✅ Thumb-Friendly Touch Targets (44px+)

**Location:** `app/globals.css`

**Auto-applied ke:**
- All buttons
- All links
- All interactive elements
- Input fields (mobile: 44px min-height)
- Checkboxes/Radio (mobile: 24px)

**Customization:**
```tsx
// Small button (36px + padding = 44px total)
<button className="small px-3 py-2">Small</button>

// Regular button (auto 44px+)
<button className="px-4 py-3">Regular</button>
```

---

### 3. ✅ Swipe Gestures

**Location:** `components/mobile/SwipeGesture.tsx`

**Usage Example - Product Images:**
```tsx
import { SwipeGesture } from '@/components/mobile/SwipeGesture';

function ProductImageGallery({ images }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  return (
    <SwipeGesture
      onSwipeLeft={() => setCurrentIndex((i) => (i + 1) % images.length)}
      onSwipeRight={() => setCurrentIndex((i) => (i - 1 + images.length) % images.length)}
      className="relative aspect-square"
    >
      <Image src={images[currentIndex]} alt="Product" fill />
    </SwipeGesture>
  );
}
```

**Usage Example - Categories Horizontal Scroll:**
```tsx
<SwipeGesture
  onSwipeLeft={() => scrollCategories('right')}
  onSwipeRight={() => scrollCategories('left')}
  className="overflow-x-auto scrollbar-hide"
>
  <div className="flex gap-4">
    {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
  </div>
</SwipeGesture>
```

**Props:**
- `onSwipeLeft`: Callback saat swipe kiri
- `onSwipeRight`: Callback saat swipe kanan
- `onSwipeUp`: Callback saat swipe atas
- `onSwipeDown`: Callback saat swipe bawah
- `threshold`: Minimum distance (default: 50px)

---

### 4. ✅ Pull-to-Refresh

**Location:** `components/mobile/PullToRefresh.tsx`

**Usage Example - Homepage:**
```tsx
import { PullToRefresh } from '@/components/mobile/PullToRefresh';

function HomePage() {
  const [products, setProducts] = useState([]);

  const handleRefresh = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="products-grid">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </PullToRefresh>
  );
}
```

**Features:**
- Visual indicator dengan spinner
- "Release to refresh" text
- Damping effect (harder to pull further)
- Auto-reset setelah refresh
- Disabled saat scroll > 0

**Props:**
- `onRefresh`: Async function untuk refresh data
- `threshold`: Distance to pull (default: 80px)
- `disabled`: Disable pull-to-refresh

---

### 5. ✅ Filter Bottom Sheet

**Location:** `components/products/FilterModal.tsx`

**Auto-applied:** Filter modal sudah menggunakan bottom sheet style

**Features:**
- Slide up from bottom animation
- Rounded top corners (rounded-t-3xl)
- Max height 90vh dengan scroll
- Touch-friendly buttons (44px+)
- Backdrop click to close

**Usage:**
```tsx
import { FilterModal } from '@/components/products/FilterModal';

<FilterModal
  isOpen={isFiltersOpen}
  onClose={() => setIsFiltersOpen(false)}
  categories={categories}
  // ... other props
/>
```

---

### 6. ✅ Persistent Search Bar

**Location:** `components/layout/Header.tsx`

**Features:**
- Always visible di header
- Expandable search (mobile)
- Auto-focus saat dibuka
- Mobile-friendly (44px touch target)
- Persistent across pages

**Auto-applied:** Tidak perlu setup, sudah terintegrasi

---

### 7. ✅ One-Tap Checkout

**Location:** `components/mobile/OneTapCheckout.tsx`

**Usage Example - Product Page:**
```tsx
import { OneTapCheckout } from '@/components/mobile/OneTapCheckout';

function ProductDetailPage({ product }) {
  return (
    <div>
      {/* Product details */}
      
      {/* One-Tap Checkout - Floating Button */}
      <OneTapCheckout
        productId={product.id}
        quantity={quantity}
        variant="floating"
      />
    </div>
  );
}
```

**Usage Example - Cart Page:**
```tsx
function CartPage() {
  return (
    <div>
      {/* Cart items */}
      
      {/* One-Tap Checkout - Inline Button */}
      <OneTapCheckout
        variant="inline"
        className="mt-6"
      />
    </div>
  );
}
```

**Features:**
- Floating button (bottom-right, mobile only)
- Inline button variant
- Auto-adds product to cart (if productId provided)
- Navigates to checkout
- Login check & redirect
- Loading state
- Thumb-friendly (56px min)

**Props:**
- `productId`: Optional - auto-adds to cart
- `quantity`: Quantity to add (default: 1)
- `variant`: 'floating' | 'inline' (default: 'floating')
- `className`: Additional classes

---

## 🎯 **INTEGRATION EXAMPLES:**

### Homepage dengan Pull-to-Refresh & Swipe:
```tsx
import { PullToRefresh } from '@/components/mobile/PullToRefresh';
import { SwipeGesture } from '@/components/mobile/SwipeGesture';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [categoryIndex, setCategoryIndex] = useState(0);

  const handleRefresh = async () => {
    const res = await fetch('/api/products');
    const data = await res.json();
    setProducts(data.products);
  };

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="container">
        {/* Categories dengan Swipe */}
        <SwipeGesture
          onSwipeLeft={() => setCategoryIndex(i => i + 1)}
          onSwipeRight={() => setCategoryIndex(i => i - 1)}
        >
          <div className="categories-scroll">
            {categories.map(cat => <CategoryCard key={cat.id} category={cat} />)}
          </div>
        </SwipeGesture>

        {/* Products Grid */}
        <div className="products-grid">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
```

### Product Detail dengan Swipe Images & One-Tap:
```tsx
import { SwipeGesture } from '@/components/mobile/SwipeGesture';
import { OneTapCheckout } from '@/components/mobile/OneTapCheckout';

export default function ProductDetailPage({ product }) {
  const [imageIndex, setImageIndex] = useState(0);

  return (
    <div>
      {/* Image Gallery dengan Swipe */}
      <SwipeGesture
        onSwipeLeft={() => setImageIndex(i => (i + 1) % product.images.length)}
        onSwipeRight={() => setImageIndex(i => (i - 1 + product.images.length) % product.images.length)}
      >
        <div className="product-image">
          <Image src={product.images[imageIndex]} alt={product.name} fill />
        </div>
      </SwipeGesture>

      {/* Product Info */}
      <div className="product-info">
        {/* ... */}
      </div>

      {/* One-Tap Checkout - Floating */}
      <OneTapCheckout
        productId={product.id}
        quantity={quantity}
        variant="floating"
      />
    </div>
  );
}
```

---

## 📊 **MOBILE OPTIMIZATION CHECKLIST:**

✅ **Bottom Navigation**
- [x] Home, Categories, Cart, Profile
- [x] Thumb-friendly (44px+)
- [x] Active states
- [x] Cart badge

✅ **Touch Targets**
- [x] All buttons min 44px
- [x] All links min 44px
- [x] Inputs min 44px (mobile)
- [x] Checkboxes 24px (mobile)

✅ **Swipe Gestures**
- [x] Product images
- [x] Categories scroll
- [x] Configurable threshold

✅ **Pull-to-Refresh**
- [x] Visual indicator
- [x] Damping effect
- [x] Auto-reset

✅ **Filter Bottom Sheet**
- [x] Slide up animation
- [x] Touch-friendly
- [x] Backdrop close

✅ **Persistent Search**
- [x] Always visible
- [x] Expandable (mobile)
- [x] Auto-focus

✅ **One-Tap Checkout**
- [x] Floating button
- [x] Inline variant
- [x] Auto-add to cart
- [x] Login check

---

## 🎨 **BEST PRACTICES:**

### Touch Targets:
- ✅ Minimum 44x44px untuk semua interactive elements
- ✅ Padding included dalam calculation
- ✅ Spacing antara buttons min 8px

### Gestures:
- ✅ Swipe threshold: 50px (configurable)
- ✅ Prevent default scroll saat swipe
- ✅ Visual feedback untuk gestures

### Performance:
- ✅ CSS animations (GPU-accelerated)
- ✅ Debounced scroll handlers
- ✅ Lazy load images
- ✅ Optimized touch events

### UX:
- ✅ Clear visual feedback
- ✅ Loading states
- ✅ Error handling
- ✅ Smooth animations

---

**Semua fitur mobile sudah ready to use! 📱✨**

