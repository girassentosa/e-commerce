# 🛍️ Modern E-Commerce Platform

Full-stack e-commerce platform built with **Next.js 14**, **TypeScript**, **Prisma**, and **PostgreSQL**.

---

## ✨ Features

- 🔐 **Authentication** - User registration and login with NextAuth.js
- 📦 **Product Management** - Full CRUD operations for products
- 🛒 **Shopping Cart** - Add, update, and remove items
- ❤️ **Wishlist** - Save favorite products
- 💳 **Checkout Process** - Multi-step checkout with payment
- 📋 **Order Management** - Track and manage orders
- ⭐ **Reviews & Ratings** - Product reviews system
- 👤 **User Dashboard** - Profile, orders, and addresses management
- 🔧 **Admin Panel** - Complete admin dashboard with analytics
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS

---

## 🚀 Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js
- **Styling:** Tailwind CSS
- **State Management:** Zustand
- **Validation:** Zod
- **Icons:** Lucide React
- **Notifications:** React Hot Toast

---

## 📋 Prerequisites

Before running this project, make sure you have:

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **PostgreSQL** database (local or cloud)

---

## 🛠️ Installation & Setup

### 1. Clone atau sudah ada project ini

Project sudah dibuat di: `C:\Users\giras\OneDrive\Dokumen\PROJEK\bebas\ecommerce-app`

### 2. Install dependencies (SUDAH DILAKUKAN ✅)

```bash
npm install
```

### 3. Setup Database

Anda perlu PostgreSQL database. Pilih salah satu opsi:

#### **Option A: Cloud Database (Recommended untuk pemula)**

Gunakan salah satu provider gratis:

**Neon (Recommended):**
1. Buka https://neon.tech
2. Sign up (gratis)
3. Create new project
4. Copy connection string

**Supabase:**
1. Buka https://supabase.com
2. Create new project
3. Copy connection string dari Settings > Database

**Railway:**
1. Buka https://railway.app
2. Create new project > Add PostgreSQL
3. Copy connection string

#### **Option B: Local PostgreSQL**

Jika punya PostgreSQL di local:
```bash
# Default connection string:
postgresql://postgres:password@localhost:5432/ecommerce
```

### 4. Update Environment Variables

File `.env` sudah dibuat dengan template. Update `DATABASE_URL`:

```env
DATABASE_URL="postgresql://username:password@host:5432/database"
```

Ganti dengan connection string dari Step 3.

### 5. Generate Prisma Client & Push Schema

```bash
npm run db:push
```

Ini akan:
- Generate Prisma Client
- Create tables di database
- Tidak create migration files (cocok untuk development)

**Atau** jika ingin pakai migrations (recommended untuk production):

```bash
npm run prisma:migrate
# Akan prompt nama migration, misal: "init"
```

### 6. Seed Database (Optional tapi Recommended)

Isi database dengan sample data:

```bash
npm run prisma:seed
```

Ini akan create:
- 2 users (admin & customer)
- 5 categories
- 8 products dengan images dan variants
- Sample cart, wishlist, orders, dan reviews

**Test Credentials setelah seed:**
- Admin: `admin@ecommerce.com` / `password123`
- Customer: `customer@example.com` / `password123`

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) di browser.

---

## 📁 Project Structure

```
ecommerce-app/
├── app/                          # Next.js App Router
│   ├── (shop)/                   # Shop pages (customer-facing)
│   ├── (admin)/                  # Admin pages
│   ├── (auth)/                   # Authentication pages
│   ├── api/                      # API Routes (Backend)
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
│
├── components/                   # React Components
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   ├── product/                  # Product components
│   └── ...
│
├── lib/                          # Utilities & Configs
│   ├── prisma.ts                 # Prisma client
│   ├── utils.ts                  # Helper functions
│   └── constants.ts              # Constants
│
├── types/                        # TypeScript types
│   └── index.ts                  # Type definitions
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data
│
└── public/                       # Static files
```

---

## 🎯 Available Scripts

```bash
# Development
npm run dev              # Start development server

# Database
npm run db:push          # Push schema to database (no migrations)
npm run db:seed          # Seed database with sample data
npm run prisma:migrate   # Create and run migrations
npm run prisma:generate  # Generate Prisma Client
npm run prisma:studio    # Open Prisma Studio (DB GUI)

# Build & Production
npm run build            # Build for production
npm run start            # Start production server

# Linting
npm run lint             # Run ESLint
```

---

## 🗄️ Database Schema

### Core Tables:
- **users** - User accounts
- **categories** - Product categories
- **products** - Product catalog
- **product_images** - Product images
- **product_variants** - Product variants (size, color, etc)
- **carts** - Shopping carts
- **cart_items** - Cart items
- **orders** - Customer orders
- **order_items** - Order line items
- **shipping_addresses** - Delivery addresses
- **reviews** - Product reviews
- **wishlists** - User wishlists
- **notifications** - User notifications

---

## 🔧 API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Products
- `GET /api/products` - List products (with filters, pagination)
- `GET /api/products/[id]` - Get product details
- `POST /api/products` - Create product (Admin)
- `PUT /api/products/[id]` - Update product (Admin)
- `DELETE /api/products/[id]` - Delete product (Admin)

### Cart
- `GET /api/cart` - Get user cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/[id]` - Update cart item
- `DELETE /api/cart/[id]` - Remove cart item

### Orders
- `GET /api/orders` - Get user orders
- `GET /api/orders/[id]` - Get order details
- `POST /api/orders` - Create new order

### Admin
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/orders` - All orders
- `GET /api/admin/users` - All users

(More API routes akan dibuat di FASE 2-10)

---

## 🎨 UI Components

Base components sudah dibuat di `components/ui/`:
- ✅ **Button** - Multiple variants (primary, secondary, outline, ghost, danger)
- ✅ **Input** - Form input dengan label dan error handling
- ✅ **Card** - Container component dengan variants
- ✅ **Loader** - Loading spinner
- ✅ **Badge** - Status badges

---

## 📱 Pages (Coming in Next Phases)

### Customer Pages:
- `/` - Homepage
- `/products` - Product listing
- `/products/[id]` - Product detail
- `/cart` - Shopping cart
- `/checkout` - Checkout process
- `/orders` - Order history
- `/profile` - User profile

### Admin Pages:
- `/admin` - Dashboard
- `/admin/products` - Product management
- `/admin/orders` - Order management
- `/admin/customers` - Customer management
- `/admin/analytics` - Analytics & reports

---

## 🐛 Troubleshooting

### Database Connection Error

```
Error: Can't reach database server
```

**Solution:**
1. Check `.env` file has correct `DATABASE_URL`
2. Ensure database is running
3. Check firewall/network settings
4. For cloud databases, check if IP is whitelisted

### Prisma Client Error

```
Error: @prisma/client did not initialize yet
```

**Solution:**
```bash
npm run prisma:generate
```

### Port Already in Use

```
Error: Port 3000 is already in use
```

**Solution:**
```bash
# Kill process on port 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or run on different port:
npm run dev -- -p 3001
```

---

## 📝 Development Phases

✅ **FASE 1: Setup Project & Database** (COMPLETED)
- Project initialization
- Database schema
- Base components
- Seed data

⏳ **FASE 2: Authentication System** (Next)
- User registration
- Login/Logout
- Session management
- Protected routes

🔜 **FASE 3-10: Coming Soon**
- Product management
- Shopping cart
- Checkout & payment
- Admin panel
- And more...

---

## 👥 Test Accounts

After running seed:

**Admin Account:**
- Email: `admin@ecommerce.com`
- Password: `password123`

**Customer Account:**
- Email: `customer@example.com`
- Password: `password123`

---

## 📞 Support

Jika ada masalah atau pertanyaan selama development, silakan tanya!

---

## 🎉 Next Steps

FASE 1 sudah selesai! Saatnya lanjut ke **FASE 2: Authentication System**.

Untuk memulai FASE 2, pastikan:
1. ✅ Database sudah running
2. ✅ `npm run dev` berhasil jalan
3. ✅ Bisa akses http://localhost:3000
4. ✅ Prisma Studio bisa dibuka (`npm run prisma:studio`)

---

**Happy Coding! 🚀**
