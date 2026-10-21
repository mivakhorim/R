# Active Requirements - Autentikasi Google & Manajemen Member Supabase

## 1. Zero Leaked Credentials & Privacy Policy
- Dilarang keras menaruh email admin, email member, atau daftar akun terotorisasi di file JSON, JS, maupun HTML client-side.
- Seluruh verifikasi role (apakah user adalah `admin` atau `estimator_pro`) diverifikasi langsung melalui query Supabase atau JWT metadata dari server.

## 2. Supabase Integration Architecture
- Mendukung konfigurasi URL Supabase dan Supabase Anonymous Key (Anon Key) yang aman dipasang di client-side (karena diamankan via RLS di Postgres).
- Tabel Utama di Supabase:
  - `user_profiles`: Menyimpan `id` (UUID relasi ke `auth.users`), `email`, `full_name`, `avatar_url`, `role` (`admin`, `estimator_pro`, `free_trial`), `status` (`ACTIVE`, `SUSPENDED`), `created_at`, `updated_at`.
  - `orders_billing`: Menyimpan riwayat tagihan QRIS dan aktivasi member.
- Row Level Security (RLS):
  - User hanya bisa membaca profile miliknya sendiri.
  - Hanya user dengan role `admin` yang dapat mengubah role member lain atau menyetujui aktivasi Pro.

## 3. Google Sign-In Flow
- Dukungan login resmi melalui Supabase Auth OAuth Google (`supabase.auth.signInWithOAuth({ provider: 'google' })`).
- Fallback GIS / Popup yang tetap kompatibel dengan GitHub Pages dan offline desktop.
- Penghapusan seluruh simulasi akun dummy yang membocorkan email asli di `google-account-chooser.html`.
