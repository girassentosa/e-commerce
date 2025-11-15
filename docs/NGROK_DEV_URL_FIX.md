# Menggunakan Ngrok URL dengan .dev Domain

## Catatan Penting

URL dengan `.ngrok-free.dev` **BISA DIGUNAKAN** jika:
1. ✅ URL muncul di terminal saat ngrok running
2. ✅ URL accessible dari browser
3. ✅ URL bisa diakses dari internet

## URL Anda

```
https://unseethed-misael-stiltedly.ngrok-free.dev -> http://localhost:3000
```

**URL Webhook yang Benar:**
```
https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans
```

## Cara Test URL

### 1. Test di Browser

Buka URL ini di browser:
```
https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans
```

**Expected Response:**
```json
{
  "message": "Midtrans webhook endpoint",
  "note": "This endpoint only accepts POST requests from Midtrans",
  "status": "active"
}
```

Jika muncul response ini = **URL BENAR dan BISA DIGUNAKAN!**

### 2. Test dengan cURL

```bash
curl https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans
```

**Expected:** JSON response seperti di atas.

### 3. Test dengan Postman

1. Buat GET request ke:
   ```
   https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans
   ```
2. Expected: Response 200 dengan JSON message

## Setup di Midtrans Dashboard

1. **Login:** https://dashboard.midtrans.com
2. **Pastikan Sandbox Mode**
3. **Buka:** Settings → Configuration → Payment Notification
4. **Paste URL webhook:**
   ```
   https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans
   ```
5. **Klik Save**

## Catatan Penting

### URL .dev vs .app

- **`.ngrok-free.dev`** = Domain alternatif ngrok, **BISA DIGUNAKAN**
- **`.ngrok-free.app`** = Domain default ngrok, **BISA DIGUNAKAN**
- **Yang penting:** URL harus muncul di terminal dan accessible

### Pastikan:

1. ✅ Ngrok masih running (jangan close terminal)
2. ✅ Aplikasi Next.js running di port 3000
3. ✅ URL test di browser berhasil
4. ✅ URL lengkap dengan `/api/payments/midtrans` di akhir

## Troubleshooting

### Problem: URL tidak accessible

**Check:**
1. Apakah ngrok masih running?
2. Apakah aplikasi Next.js running?
3. Apakah port 3000 benar?

**Solusi:**
```bash
# Restart ngrok
ngrok http 3000

# Pastikan aplikasi running
npm run dev
```

### Problem: Browser warning page

Jika muncul warning page ngrok:
1. Klik "Visit Site" untuk continue
2. Atau setup ngrok authtoken untuk skip warning

### Problem: Webhook tidak terpanggil

**Checklist:**
- [ ] URL test di browser berhasil?
- [ ] URL sudah di-paste ke Midtrans Dashboard?
- [ ] Mode Sandbox di Midtrans sudah benar?
- [ ] Ngrok masih running?

## Quick Test

```bash
# Test URL
curl https://unseethed-misael-stiltedly.ngrok-free.dev/api/payments/midtrans

# Expected output:
# {"message":"Midtrans webhook endpoint","note":"This endpoint only accepts POST requests from Midtrans","status":"active"}
```

Jika muncul output seperti di atas = **URL BENAR dan SIAP DIGUNAKAN!**

