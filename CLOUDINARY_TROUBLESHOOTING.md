# 🔧 Cloudinary Troubleshooting Guide

## Error: "Invalid cloud_name" (401)

### Analisa Masalah

Error `Invalid cloud_name e-commerce` dengan HTTP code 401 berarti:
- ❌ Cloudinary tidak mengenali cloud_name yang Anda berikan
- ❌ Kemungkinan cloud_name tidak sesuai dengan yang ada di Cloudinary account Anda
- ❌ Atau ada masalah dengan format/karakter dalam cloud_name

### ✅ Solusi

#### 1. Verifikasi Cloud Name di Cloudinary Dashboard

1. Login ke https://cloudinary.com
2. Buka **Dashboard**
3. Di bagian atas, lihat **Cloud Name** Anda
   - Biasanya terlihat di: `https://console.cloudinary.com/console`
   - Atau di: Dashboard → Account Details
4. **Copy cloud_name yang EXACT** (case-sensitive, tanpa spasi)

#### 2. Format Cloud Name yang Benar

Cloud name di Cloudinary:
- ✅ **Boleh mengandung**: huruf, angka, dan tanda hubung (`-`)
- ✅ **Case-sensitive**: `e-commerce` ≠ `E-Commerce` ≠ `E-COMMERCE`
- ❌ **Tidak boleh mengandung**: spasi, karakter khusus selain `-`

**Contoh yang BENAR:**
```
e-commerce
my-shop
test123
abc-def-ghi
```

**Contoh yang SALAH:**
```
e commerce  (ada spasi)
e_commerce  (underscore tidak valid)
e.commerce  (dot tidak valid)
```

#### 3. Cek Environment Variables

Pastikan di file `.env` atau environment variables:

```env
# ✅ BENAR - tanpa spasi, tanpa quote yang tidak perlu
CLOUDINARY_CLOUD_NAME=e-commerce

# ❌ SALAH - ada spasi
CLOUDINARY_CLOUD_NAME="e-commerce"

# ❌ SALAH - ada spasi di akhir
CLOUDINARY_CLOUD_NAME=e-commerce 

# ❌ SALAH - cloud name salah
CLOUDINARY_CLOUD_NAME=my-cloud-name  # jika cloud name sebenarnya "e-commerce"
```

#### 4. Restart Development Server

Setelah mengubah `.env`, **WAJIB restart server**:

```bash
# Stop server (Ctrl+C)
# Lalu jalankan lagi:
npm run dev
```

#### 5. Verifikasi Semua Credentials

Pastikan **SEMUA** credentials benar:

```env
CLOUDINARY_CLOUD_NAME="your-exact-cloud-name"  # Dari Dashboard
CLOUDINARY_API_KEY="your-api-key"              # Dari Dashboard → Settings → Upload
CLOUDINARY_API_SECRET="your-api-secret"        # Dari Dashboard → Settings → Upload
```

#### 6. Debug dengan Logging

Setelah restart server, cek console log. Anda akan melihat:

```
✅ Cloudinary configured: {
  cloud_name: 'e-commerce',
  api_key: '1234...',
  api_secret: '***'
}
```

Jika melihat:
```
⚠️ Cloudinary not configured - will use local storage
```

Berarti environment variables tidak ter-load dengan benar.

### 🔍 Cara Cek Cloud Name yang Benar

#### Method 1: Dari Dashboard
1. Login Cloudinary
2. Dashboard → Lihat URL: `https://console.cloudinary.com/console`
3. Cloud name biasanya terlihat di URL atau di bagian atas dashboard

#### Method 2: Dari Settings
1. Dashboard → **Settings** (ikon gear)
2. **Account** atau **Upload Settings**
3. Lihat **Cloud name** di sana

#### Method 3: Dari Media Library
1. Buka **Media Library**
2. Upload satu gambar test
3. Lihat URL hasil upload, contoh:
   ```
   https://res.cloudinary.com/YOUR-CLOUD-NAME/image/upload/...
   ```
4. `YOUR-CLOUD-NAME` adalah cloud name Anda

### ⚠️ Common Mistakes

1. **Copy-paste dengan spasi tersembunyi**
   - Solusi: Ketik manual atau paste di text editor dulu, lalu copy lagi

2. **Menggunakan cloud name yang salah**
   - Solusi: Pastikan cloud name sesuai dengan yang di Dashboard

3. **Tidak restart server setelah ubah .env**
   - Solusi: **WAJIB restart** `npm run dev`

4. **Menggunakan quote yang tidak perlu**
   - Solusi: Di `.env`, tidak perlu quote kecuali ada spasi (tapi lebih baik tanpa spasi)

5. **Case-sensitive**
   - Solusi: Pastikan huruf besar/kecil sesuai dengan Dashboard

### 📝 Checklist

- [ ] Cloud name sudah di-copy dari Cloudinary Dashboard
- [ ] Cloud name tidak ada spasi
- [ ] Cloud name case-sensitive sesuai Dashboard
- [ ] API Key sudah benar
- [ ] API Secret sudah benar (klik "Reveal" untuk melihat)
- [ ] File `.env` sudah disimpan
- [ ] Server sudah di-restart setelah ubah `.env`
- [ ] Console log menunjukkan "✅ Cloudinary configured"

### 🆘 Masih Error?

Jika masih error setelah semua langkah di atas:

1. **Double-check cloud name**:
   - Login Cloudinary
   - Dashboard → Copy cloud name lagi
   - Paste ke `.env` (tanpa spasi, tanpa quote)

2. **Test dengan curl** (opsional):
   ```bash
   curl -X GET "https://api.cloudinary.com/v1_1/YOUR-CLOUD-NAME/resources/image" \
     -u "YOUR-API-KEY:YOUR-API-SECRET"
   ```
   Ganti `YOUR-CLOUD-NAME`, `YOUR-API-KEY`, `YOUR-API-SECRET` dengan credentials Anda.

3. **Cek apakah account aktif**:
   - Pastikan Cloudinary account Anda masih aktif
   - Free tier masih berlaku

4. **Contact support**:
   - Jika semua sudah benar tapi masih error, mungkin ada masalah dengan Cloudinary account
   - Hubungi Cloudinary support

---

**Note**: Setelah fix, pastikan restart development server (`npm run dev`)

