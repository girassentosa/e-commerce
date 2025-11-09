# 🔧 Fix: Environment Variables Tidak Ter-Load di Production

## 🔍 Analisa Masalah

### Gejala:
- ✅ Di `npm run dev` bisa upload (tanpa Cloudinary)
- ❌ Di production dapat error: "Cloudinary is required in production"
- ✅ Environment variables sudah di-set di hosting platform
- ❌ Tapi masih error

### Penyebab Kemungkinan:

#### 1. **Environment Variables Tidak Ter-Load di Runtime**
- Next.js mungkin cache environment variables saat build time
- Environment variables perlu di-read di runtime, bukan di module load time

#### 2. **Tidak Redeploy Setelah Set Environment Variables**
- Setelah set env vars di hosting platform, **WAJIB redeploy**
- Environment variables hanya ter-load saat build/deploy

#### 3. **Environment Variables Di-Set di Environment yang Salah**
- Di Vercel: Pastikan set di **Production** (bukan Preview atau Development)
- Di Netlify: Pastikan set di **Production**

#### 4. **Format Environment Variables Salah**
- Ada spasi tersembunyi
- Ada quote yang tidak perlu
- Case-sensitive

---

## ✅ Solusi yang Sudah Diimplementasikan

### 1. **Runtime Environment Variable Reading**
- Environment variables sekarang di-read di runtime (setiap kali function dipanggil)
- Tidak lagi cache di module load time

### 2. **Re-configure Cloudinary di Runtime**
- Cloudinary di-configure ulang setiap kali upload
- Memastikan config selalu fresh

### 3. **Better Production Detection**
- Cek `NODE_ENV === 'production'`
- Cek `VERCEL_ENV === 'production'`
- Cek `VERCEL === '1'`

### 4. **Debug Logging**
- Logging detail untuk troubleshooting
- Endpoint debug: `/api/debug/env` (Admin only)

---

## 🔧 Cara Fix di Production

### Step 1: Verifikasi Environment Variables di Hosting Platform

#### **Jika Pakai Vercel:**

1. Buka https://vercel.com
2. Pilih project Anda
3. **Settings** → **Environment Variables**
4. Pastikan ada 3 variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
5. **PENTING**: Pastikan environment-nya adalah **Production** (bukan Preview atau Development)
6. Cek apakah ada typo atau spasi

#### **Jika Pakai Netlify:**

1. Buka https://netlify.com
2. Pilih site Anda
3. **Site settings** → **Environment variables**
4. Pastikan ada 3 variables
5. Pastikan scope-nya adalah **Production**

### Step 2: Redeploy Setelah Set Environment Variables

**⚠️ PENTING**: Setelah set/ubah environment variables, **WAJIB redeploy**!

#### **Vercel:**
- Setelah set env vars, klik **Redeploy** di deployment terbaru
- Atau push commit baru ke GitHub (akan auto-redeploy)

#### **Netlify:**
- Setelah set env vars, klik **Trigger deploy** → **Deploy site**
- Atau push commit baru ke GitHub

### Step 3: Test dengan Debug Endpoint

Setelah redeploy, test dengan debug endpoint:

1. Login sebagai Admin
2. Buka: `https://your-domain.com/api/debug/env`
3. Cek response:
   ```json
   {
     "success": true,
     "data": {
       "cloudinary": {
         "configured": true,  // ← Harus true
         "has_cloud_name": true,
         "has_api_key": true,
         "has_api_secret": true
       }
     }
   }
   ```

### Step 4: Cek Logs di Hosting Platform

#### **Vercel:**
1. Project → **Deployments** → Pilih deployment terbaru
2. Klik **Functions** tab
3. Cari log yang berisi: `✅ Cloudinary configured`
4. Jika tidak ada, berarti env vars tidak ter-load

#### **Netlify:**
1. Site → **Functions** → **Logs**
2. Cari log Cloudinary configuration

---

## 🐛 Troubleshooting

### Masalah 1: Environment Variables Tidak Ter-Load

**Gejala:**
- Debug endpoint menunjukkan `configured: false`
- Logs tidak menunjukkan "✅ Cloudinary configured"

**Solusi:**
1. Double-check env vars di hosting platform
2. Pastikan tidak ada typo
3. Pastikan environment scope benar (Production)
4. **Redeploy** setelah set env vars
5. Cek apakah ada spasi di awal/akhir value

### Masalah 2: Environment Variables Ter-Load Tapi Masih Error

**Gejala:**
- Debug endpoint menunjukkan `configured: true`
- Tapi upload masih error

**Solusi:**
1. Cek error message di logs
2. Kemungkinan credentials salah (cloud_name, api_key, api_secret)
3. Test credentials di Cloudinary dashboard
4. Pastikan account Cloudinary masih aktif

### Masalah 3: Bisa di Development, Tidak Bisa di Production

**Gejala:**
- `npm run dev` → bisa upload
- Production → error

**Solusi:**
1. Ini normal! Development pakai local storage
2. Production **WAJIB** pakai Cloudinary
3. Pastikan Cloudinary credentials sudah di-set di production
4. Redeploy setelah set env vars

---

## 📋 Checklist

- [ ] ✅ Environment variables sudah di-set di hosting platform
- [ ] ✅ Environment scope adalah **Production** (bukan Preview)
- [ ] ✅ Tidak ada typo di nama variable
- [ ] ✅ Tidak ada spasi di awal/akhir value
- [ ] ✅ Sudah **redeploy** setelah set env vars
- [ ] ✅ Debug endpoint (`/api/debug/env`) menunjukkan `configured: true`
- [ ] ✅ Logs menunjukkan "✅ Cloudinary configured"
- [ ] ✅ Test upload di production

---

## 🔍 Debug Endpoint

Endpoint: `GET /api/debug/env` (Admin only)

**Response:**
```json
{
  "success": true,
  "data": {
    "environment": {
      "NODE_ENV": "production",
      "VERCEL_ENV": "production",
      "VERCEL": "1"
    },
    "cloudinary": {
      "configured": true,
      "has_cloud_name": true,
      "has_api_key": true,
      "has_api_secret": true,
      "cloud_name_length": 10,
      "api_key_length": 20,
      "api_secret_length": 40
    },
    "is_production": true
  }
}
```

**Cara Test:**
1. Login sebagai Admin
2. Buka: `https://your-domain.com/api/debug/env`
3. Cek apakah `cloudinary.configured` adalah `true`

---

## ⚠️ Catatan Penting

1. **Environment variables hanya ter-load saat build/deploy**
   - Set env vars → **WAJIB redeploy**
   - Tidak bisa hot-reload env vars di production

2. **Environment scope penting**
   - Vercel: Set di **Production** environment
   - Netlify: Set di **Production** scope

3. **Format environment variables**
   - Tidak perlu quote: `CLOUDINARY_CLOUD_NAME=my-cloud-name` ✅
   - Jangan ada spasi: `CLOUDINARY_CLOUD_NAME= my-cloud-name` ❌

4. **Development vs Production**
   - Development: Bisa pakai local storage (tanpa Cloudinary)
   - Production: **WAJIB** pakai Cloudinary

---

## 🆘 Masih Error?

Jika masih error setelah semua langkah di atas:

1. **Cek logs di hosting platform** untuk error detail
2. **Test debug endpoint** untuk verifikasi env vars
3. **Double-check Cloudinary credentials** di Cloudinary dashboard
4. **Contact support** hosting platform jika env vars tidak ter-load

