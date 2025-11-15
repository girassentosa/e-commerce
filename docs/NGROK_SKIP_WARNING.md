# Cara Menghilangkan Ngrok Browser Warning (GRATIS)

## Masalah

Ngrok free tier menampilkan warning page yang **MENGHALANGI WEBHOOK** dari Midtrans. Webhook tidak bisa klik "Visit Site", jadi webhook akan gagal.

## Solusi: Setup Ngrok Authtoken (GRATIS)

### Step 1: Daftar Akun Ngrok (Gratis)

1. Buka: https://dashboard.ngrok.com/signup
2. Daftar dengan email (gratis, tidak perlu kartu kredit)
3. Verifikasi email

### Step 2: Dapatkan Authtoken

1. Login ke: https://dashboard.ngrok.com
2. Buka: **Your Authtoken** (di sidebar kiri)
3. Copy **Authtoken** Anda (format: `2xxxxx_xxxxxxxxxxxxxxxxxxxxx`)

### Step 3: Setup Authtoken di Terminal

```bash
ngrok config add-authtoken YOUR_AUTHTOKEN_HERE
```

**Contoh:**
```bash
ngrok config add-authtoken 2abc123_xyz789def456ghi789jkl012mno345pq
```

**Expected Output:**
```
Authtoken saved to configuration file: C:\Users\YourName\AppData\Local\ngrok\ngrok.yml
```

### Step 4: Restart Ngrok

1. **Stop ngrok** yang sedang running (Ctrl+C)
2. **Jalankan lagi:**
   ```bash
   ngrok http 3000
   ```

### Step 5: Test URL

Buka URL di browser:
```
https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans
```

**Expected:** Langsung muncul JSON response, **TANPA warning page!**

## Alternatif: Skip Warning dengan Header (Untuk Testing)

Jika tidak bisa setup authtoken, kita bisa modifikasi webhook endpoint untuk skip warning.

### Modifikasi Webhook Endpoint

Tambahkan header check di webhook endpoint untuk skip ngrok warning.

**File:** `app/api/payments/midtrans/route.ts`

Tambahkan di awal function POST:

```typescript
// Skip ngrok browser warning for webhook requests
const headers = request.headers;
const userAgent = headers.get('user-agent') || '';
const isNgrokWarning = userAgent.includes('ngrok') || 
                       headers.get('ngrok-skip-browser-warning');

// If this is ngrok warning page request, return early
if (headers.get('ngrok-skip-browser-warning') === null && 
    !userAgent.includes('Midtrans')) {
  // This might be browser warning page, but we'll process anyway
}
```

**Tapi ini tidak recommended** karena webhook dari Midtrans seharusnya langsung bisa akses tanpa warning jika pakai authtoken.

## Solusi Terbaik: Setup Authtoken

**Setup authtoken adalah solusi TERBAIK karena:**
- ✅ Gratis
- ✅ Menghilangkan warning page
- ✅ Webhook langsung bisa akses
- ✅ Tidak perlu modifikasi code

## Troubleshooting

### Problem: Authtoken tidak bekerja

**Check:**
1. Apakah authtoken sudah di-setup dengan benar?
   ```bash
   ngrok config check
   ```

2. Apakah ngrok sudah di-restart setelah setup authtoken?

3. Cek authtoken di dashboard: https://dashboard.ngrok.com/get-started/your-authtoken

### Problem: Masih muncul warning

**Solusi:**
1. Pastikan ngrok sudah di-restart
2. Clear browser cache
3. Coba incognito/private window
4. Pastikan authtoken benar (copy-paste langsung, jangan ketik manual)

## Quick Start (Copy-Paste)

```bash
# 1. Daftar di https://dashboard.ngrok.com/signup (gratis)

# 2. Copy authtoken dari dashboard

# 3. Setup authtoken
ngrok config add-authtoken PASTE_AUTHTOKEN_DISINI

# 4. Restart ngrok
ngrok http 3000

# 5. Test URL di browser
# https://xxxx-xxxx-xxxx.ngrok-free.dev/api/payments/midtrans
# Seharusnya langsung muncul JSON, tanpa warning!
```

## Setelah Setup Authtoken

1. ✅ URL akan langsung accessible (tanpa warning)
2. ✅ Webhook Midtrans bisa langsung akses
3. ✅ Test di browser langsung muncul JSON response
4. ✅ Paste URL ke Midtrans Dashboard
5. ✅ Webhook akan bekerja dengan baik!

## Catatan

- **Authtoken setup hanya perlu sekali** (setelah itu tersimpan)
- **Ngrok masih gratis** setelah setup authtoken
- **Warning page akan hilang** setelah setup authtoken
- **Webhook akan langsung bekerja** tanpa masalah

