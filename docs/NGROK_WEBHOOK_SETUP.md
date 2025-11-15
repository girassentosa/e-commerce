# Setup Ngrok untuk Midtrans Webhook

## Perbedaan .dev vs .app di Ngrok

### Ngrok Domain Types:

1. **`.ngrok-free.app`** (Free Plan - Default)
   - Domain default untuk ngrok free tier
   - Format: `https://xxxx-xxxx-xxxx.ngrok-free.app`
   - **INI YANG HARUS DIGUNAKAN**

2. **`.ngrok.dev`** (Alternative/Legacy)
   - Domain alternatif atau versi lama
   - Mungkin tidak selalu accessible
   - **JANGAN GUNAKAN jika tidak muncul di terminal**

3. **`.ngrok.io`** (Paid Plan)
   - Untuk ngrok paid plan
   - Custom domain support

## Cara Mendapatkan URL yang Benar

### Step 1: Jalankan Ngrok

```bash
ngrok http 3000
```
(Ganti 3000 dengan port aplikasi Anda - Next.js biasanya 3000)

### Step 2: Lihat Output di Terminal

Ngrok akan menampilkan:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        Asia Pacific (ap)
Latency                      50ms
Web Interface                  http://127.0.0.1:4040
Forwarding                    https://xxxx-xxxx-xxxx.ngrok-free.app -> http://localhost:3000
```

**Yang penting:** Baris `Forwarding` - **INI URL YANG BENAR**

Format: `https://xxxx-xxxx-xxxx.ngrok-free.app`

### Step 3: Test URL di Browser

Buka URL di browser:
```
https://xxxx-xxxx-xxxx.ngrok-free.app/api/payments/midtrans
```

**Expected Response:**
```json
{
  "message": "Midtrans webhook endpoint",
  "note": "This endpoint only accepts POST requests from Midtrans",
  "status": "active"
}
```

Jika muncul response ini = **URL BENAR dan ACCESSIBLE**

### Step 4: Copy URL Lengkap untuk Webhook

URL webhook yang benar:
```
https://xxxx-xxxx-xxxx.ngrok-free.app/api/payments/midtrans
```

**PENTING:**
- Gunakan URL yang muncul di terminal (bukan yang .dev)
- Pastikan ada `/api/payments/midtrans` di akhir
- Test dulu di browser sebelum paste ke Midtrans

## Cara Cek URL yang Benar

### Method 1: Via Terminal Output
Lihat output ngrok, cari baris `Forwarding` - itu URL yang benar.

### Method 2: Via Ngrok Web Interface
1. Buka: `http://127.0.0.1:4040`
2. Lihat tab "Status"
3. Copy URL dari "Forwarding" section

### Method 3: Test dengan cURL
```bash
curl https://YOUR-URL.ngrok-free.app/api/payments/midtrans
```

Jika return JSON message = URL benar.

## Troubleshooting

### Problem: URL .dev tidak accessible

**Penyebab:**
- URL .dev mungkin bukan dari ngrok yang sedang running
- Atau URL dari session ngrok sebelumnya

**Solusi:**
1. **Stop ngrok** (Ctrl+C)
2. **Restart ngrok**: `ngrok http 3000`
3. **Copy URL baru** yang muncul di terminal (yang `.ngrok-free.app`)
4. **Test di browser** dulu
5. **Paste ke Midtrans** jika sudah accessible

### Problem: URL berubah setiap restart

**Ini normal untuk ngrok free tier!**

**Solusi:**
- Setiap restart ngrok, URL baru akan muncul
- Update webhook URL di Midtrans setiap kali restart
- Atau gunakan ngrok paid plan untuk static domain

### Problem: Browser warning page

**Gejala:** Saat akses URL, muncul halaman warning ngrok

**Solusi:**
1. Setup ngrok authtoken (gratis):
   ```bash
   ngrok config add-authtoken YOUR_AUTH_TOKEN
   ```
   Daftar di: https://dashboard.ngrok.com/signup

2. Restart ngrok setelah setup authtoken
3. URL akan lebih stabil tanpa warning

## Setup di Midtrans Dashboard

1. **Login:** https://dashboard.midtrans.com
2. **Pastikan Sandbox Mode** (bukan Production)
3. **Buka:** Settings → Configuration → Payment Notification
4. **Paste URL webhook:**
   ```
   https://xxxx-xxxx-xxxx.ngrok-free.app/api/payments/midtrans
   ```
   (Ganti xxxx dengan URL dari terminal Anda)
5. **Klik Save**
6. **Test:** Buat transaksi baru dan cek console server

## Checklist Sebelum Setup

- [ ] Ngrok sudah running (`ngrok http 3000`)
- [ ] Aplikasi Next.js sudah running (`npm run dev`)
- [ ] URL di terminal adalah `.ngrok-free.app` (bukan `.dev`)
- [ ] Test URL di browser berhasil (return JSON message)
- [ ] URL lengkap dengan `/api/payments/midtrans` di akhir
- [ ] Midtrans Dashboard dalam mode Sandbox

## Quick Test Command

```bash
# Test apakah URL accessible
curl https://YOUR-URL.ngrok-free.app/api/payments/midtrans

# Expected output:
# {"message":"Midtrans webhook endpoint","note":"This endpoint only accepts POST requests from Midtrans","status":"active"}
```

Jika muncul output seperti di atas = **URL BENAR!**

