# 🚀 Deployment Guide

Panduan lengkap untuk deploy aplikasi E-Commerce ke production.

---

## ✅ Kesiapan Deployment

### Status Build
- ✅ Build berhasil (`npm run build` passed)
- ✅ TypeScript check passed
- ✅ Semua halaman berhasil di-generate
- ✅ Tidak ada error atau warning yang critical

### File yang Sudah Siap
- ✅ `.gitignore` sudah dikonfigurasi dengan benar
- ✅ `package.json` sudah lengkap dengan scripts
- ✅ `next.config.ts` sudah ada
- ✅ `prisma/schema.prisma` sudah ada

---

## 📋 Environment Variables yang Diperlukan

Sebelum deploy, pastikan Anda sudah menyiapkan environment variables berikut:

### 1. Database
```env
DATABASE_URL="postgresql://username:password@host:5432/database"
```

**Cara mendapatkan:**
- **Neon (Recommended):** https://neon.tech → Create Project → Copy connection string
- **Supabase:** https://supabase.com → Create Project → Settings > Database → Connection string
- **Railway:** https://railway.app → Create Project > Add PostgreSQL → Copy connection string

### 2. NextAuth
```env
NEXTAUTH_SECRET="your-secret-key-here-min-32-characters"
NEXTAUTH_URL="https://your-domain.com"
```

**Cara generate NEXTAUTH_SECRET:**
```bash
# Di terminal, jalankan:
openssl rand -base64 32

# Atau gunakan online generator:
# https://generate-secret.vercel.app/32
```

**NEXTAUTH_URL:**
- Development: `http://localhost:3000`
- Production: `https://your-domain.com` (ganti dengan domain Anda)

### 3. Cloudinary (Recommended untuk Production - Image Storage)
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Cara mendapatkan:**
1. Buka https://cloudinary.com
2. Sign up / Login (gratis untuk tier free)
3. Dashboard → Settings → Upload
4. Copy:
   - **Cloud Name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → `CLOUDINARY_API_SECRET`

**⚠️ PENTING:**
- **Development:** Jika tidak di-set, aplikasi akan menggunakan local storage (`public/images/`)
- **Production:** Cloudinary **WAJIB** di-set! 
  - ❌ Local storage **TIDAK BISA** digunakan di production (Vercel, Netlify, dll memiliki read-only file system)
  - ✅ Upload akan **GAGAL** jika Cloudinary tidak dikonfigurasi di production
  - ✅ Keuntungan Cloudinary:
    - Foto lama tetap tersimpan dan bisa diakses (tidak hilang)
    - CDN global untuk loading cepat
    - Auto optimization (resize, compress)
    - Reliable storage (tidak terbatas server storage)

### 4. Optional (jika diperlukan)
```env
NODE_ENV="production"
```

---

## 🔐 Keamanan Environment Variables

### ⚠️ PENTING: Jangan Commit File `.env` ke GitHub!

File `.env` sudah di-ignore oleh `.gitignore`, jadi aman. Tapi pastikan:

1. ✅ File `.env` tidak ada di repository
2. ✅ File `.env.local` tidak ada di repository
3. ✅ Semua environment variables diset di platform deployment (Vercel, Netlify, dll)

---

## 🚀 Cara Deploy

### Option 1: Vercel (Recommended untuk Next.js)

**Vercel adalah platform terbaik untuk Next.js karena:**
- ✅ Zero-config deployment
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Environment variables management
- ✅ Database integration (Neon, Supabase)

#### Langkah-langkah:

1. **Push ke GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/your-repo.git
   git push -u origin main
   ```

2. **Deploy ke Vercel**
   - Buka https://vercel.com
   - Sign up / Login dengan GitHub
   - Klik "Add New Project"
   - Import repository dari GitHub
   - Vercel akan auto-detect Next.js

3. **Set Environment Variables di Vercel**
   - Di project settings → Environment Variables
   - Tambahkan:
     - `DATABASE_URL`
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL` (akan auto-set oleh Vercel, tapi bisa override)
     - `CLOUDINARY_CLOUD_NAME` (recommended untuk production)
     - `CLOUDINARY_API_KEY` (recommended untuk production)
     - `CLOUDINARY_API_SECRET` (recommended untuk production)

4. **Deploy Database**
   - Jika belum punya database, gunakan Neon (gratis):
     - Buka https://neon.tech
     - Create project
     - Copy connection string
     - Paste ke `DATABASE_URL` di Vercel

5. **Run Database Migrations**
   ```bash
   # Setelah deploy, jalankan di Vercel CLI atau via script:
   npx prisma migrate deploy
   # Atau
   npx prisma db push
   ```

6. **Deploy!**
   - Klik "Deploy"
   - Tunggu build selesai
   - Aplikasi akan live di `https://your-project.vercel.app`

---

### Option 2: Netlify

1. **Push ke GitHub** (sama seperti Vercel)

2. **Deploy ke Netlify**
   - Buka https://netlify.com
   - Sign up / Login
   - Klik "Add new site" → "Import an existing project"
   - Connect GitHub repository

3. **Build Settings**
   ```
   Build command: npm run build
   Publish directory: .next
   ```

4. **Set Environment Variables**
   - Site settings → Environment variables
   - Tambahkan semua environment variables

5. **Deploy!**

---

### Option 3: Railway

1. **Push ke GitHub**

2. **Deploy ke Railway**
   - Buka https://railway.app
   - Sign up / Login dengan GitHub
   - New Project → Deploy from GitHub repo

3. **Add PostgreSQL Database**
   - Klik "New" → "Database" → "Add PostgreSQL"
   - Railway akan auto-create database

4. **Set Environment Variables**
   - Project settings → Variables
   - Tambahkan:
     - `DATABASE_URL` (auto-set oleh Railway jika pakai Railway DB)
     - `NEXTAUTH_SECRET`
     - `NEXTAUTH_URL`

5. **Deploy!**

---

## 📝 Checklist Sebelum Deploy

- [ ] ✅ Build berhasil (`npm run build`)
- [ ] ✅ Environment variables sudah disiapkan
- [ ] ✅ Database sudah dibuat (Neon, Supabase, atau Railway)
- [ ] ✅ `.env` file tidak di-commit ke GitHub
- [ ] ✅ Repository sudah di-push ke GitHub
- [ ] ✅ Environment variables sudah di-set di platform deployment
- [ ] ✅ Database migrations sudah di-run (jika pakai migrations)

---

## 🔄 Post-Deployment Steps

### 1. Run Database Migrations

Setelah deploy pertama kali, jalankan:

```bash
# Via Vercel CLI (jika pakai Vercel):
vercel env pull
npx prisma migrate deploy

# Atau via script di package.json:
npm run prisma:migrate
```

### 2. Seed Database (Optional)

Jika ingin isi database dengan sample data:

```bash
npm run prisma:seed
```

**Note:** Seed hanya untuk development. Jangan run di production dengan data real!

### 3. Verify Deployment

- ✅ Cek apakah aplikasi bisa diakses
- ✅ Test login/register
- ✅ Test create product (jika admin)
- ✅ Test add to cart
- ✅ Cek database connection

---

## 🐛 Troubleshooting Deployment

### Error: "Cannot find module '@prisma/client'"

**Solution:**
```bash
# Di platform deployment, tambahkan build command:
npm install && npm run prisma:generate && npm run build
```

### Error: "Database connection failed"

**Solution:**
1. Check `DATABASE_URL` di environment variables
2. Pastikan database sudah running
3. Untuk cloud databases, pastikan IP whitelist sudah di-set (jika diperlukan)

### Error: "NEXTAUTH_SECRET is missing" atau "error=configuration"

**Penyebab:**
- `NEXTAUTH_SECRET` atau `NEXTAUTH_URL` tidak di-set di production
- NextAuth **WAJIB** kedua env vars ini di production (tidak ada fallback)

**Solution:**
1. Generate secret: `openssl rand -base64 32`
2. Set di environment variables platform deployment:
   - `NEXTAUTH_SECRET` (minimal 32 karakter)
   - `NEXTAUTH_URL` (format: `https://your-domain.com`, tanpa trailing slash)
3. **PENTING:** Pastikan set di **Production** environment (bukan Preview)
4. **Redeploy** setelah set env vars

**Kenapa Wajib:**
- Development: NextAuth punya fallback (auto-generate secret, auto-detect URL)
- Production: NextAuth **TIDAK** punya fallback, **WAJIB** di-set manual

### Error: "Cloudinary is required in production"

**Penyebab:**
- Cloudinary credentials tidak di-set atau tidak ter-load di production
- File system di production (Vercel/Netlify) adalah read-only, tidak bisa pakai local storage

**Solution:**
1. Set 3 environment variables di hosting platform:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
2. Pastikan set di **Production** environment
3. **Redeploy** setelah set env vars
4. Test dengan debug endpoint: `/api/debug/env` (Admin only)

**Note:** 
- Development: Bisa pakai local storage (tanpa Cloudinary)
- Production: **WAJIB** pakai Cloudinary (local storage tidak bisa write)

### Error: "Environment Variables Tidak Ter-Load di Production"

**Penyebab:**
- Environment variables di-set tapi tidak ter-load saat runtime
- Tidak redeploy setelah set env vars

**Solution:**
1. Verifikasi env vars di hosting platform (Settings → Environment Variables)
2. Pastikan environment scope benar (Production, bukan Preview)
3. **Redeploy** setelah set/ubah env vars (env vars hanya ter-load saat build/deploy)
4. Cek logs di hosting platform untuk error detail
5. Test dengan debug endpoint: `/api/debug/env` (Admin only)

### Error: "Build failed"

**Solution:**
1. Check build logs di platform deployment
2. Pastikan semua dependencies terinstall
3. Pastikan TypeScript tidak ada error
4. Pastikan `npm run build` berhasil di local

---

## 📚 Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Deployment:** https://nextjs.org/docs/deployment
- **Prisma Deployment:** https://www.prisma.io/docs/guides/deployment
- **Neon Database:** https://neon.tech/docs

---

## ✅ Kesimpulan

**Ya, aplikasi sudah siap untuk di-deploy!** 

Yang perlu dilakukan:
1. ✅ Push ke GitHub
2. ✅ Setup database (Neon/Supabase/Railway)
3. ✅ Deploy ke Vercel/Netlify/Railway
4. ✅ Set environment variables
5. ✅ Run database migrations
6. ✅ Done! 🎉

---

**Happy Deploying! 🚀**

