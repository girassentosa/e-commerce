# Setup Midtrans Sandbox

## Environment Variables

Untuk menggunakan Midtrans Sandbox, pastikan environment variables berikut diatur dengan benar:

### 1. Local Development (.env.local)

```env
# Midtrans Sandbox Configuration
MIDTRANS_SERVER_KEY=your-sandbox-server-key-here
MIDTRANS_BASE_URL=https://api.sandbox.midtrans.com
```

**Catatan:** Jika `MIDTRANS_BASE_URL` tidak diatur, sistem akan otomatis menggunakan Sandbox sebagai default.

### 2. Vercel Deployment

1. Login ke Vercel Dashboard
2. Pilih project Anda
3. Buka **Settings** → **Environment Variables**
4. Set atau update environment variables berikut:

   - **MIDTRANS_SERVER_KEY**: Masukkan Sandbox Server Key dari Midtrans Dashboard
   - **MIDTRANS_BASE_URL**: Set ke `https://api.sandbox.midtrans.com` (atau biarkan kosong untuk default sandbox)

5. **Redeploy** aplikasi setelah mengubah environment variables

## Cara Mendapatkan Sandbox Server Key

1. Login ke [Midtrans Dashboard](https://dashboard.midtrans.com)
2. Pastikan Anda berada di **Sandbox Mode** (bukan Production)
3. Buka **Settings** → **Access Keys**
4. Copy **Server Key** (bukan Client Key)
5. Paste ke environment variable `MIDTRANS_SERVER_KEY`

## Verifikasi Setup

Setelah setup, cek console log saat aplikasi berjalan. Anda akan melihat:

```
Midtrans Base URL: https://api.sandbox.midtrans.com (SANDBOX MODE)
Midtrans Server Key loaded: SB-Mid-...xxxx
```

## Catatan Penting

- **Sandbox Server Key** berbeda dengan **Production Server Key**
- Pastikan menggunakan **Server Key**, bukan **Client Key**
- Di Sandbox, semua payment method sudah aktif secara default (tidak perlu aktivasi manual)
- Transaksi di Sandbox tidak akan memproses pembayaran real (hanya simulasi)

## Testing Payment Methods

Di Sandbox mode, semua payment method berikut dapat langsung digunakan tanpa aktivasi:
- ✅ QRIS
- ✅ Virtual Account (BCA, MANDIRI, BNI, BRI, BSI, PERMATA)

## Switch ke Production

Jika ingin kembali ke Production mode:

1. Ganti `MIDTRANS_SERVER_KEY` dengan Production Server Key
2. Set `MIDTRANS_BASE_URL=https://api.midtrans.com`
3. Aktifkan payment methods di Midtrans Dashboard (Production)
4. Redeploy aplikasi

