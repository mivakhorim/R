# Original Intent - Arsitektur Autentikasi & Manajemen Member Duta RAB S1

## 1. Latar Belakang Masalah
Pada versi sebelumnya (v1.13 ke bawah), berkas konfigurasi `auth-license-config.json`, modul `google-auth-manager.js`, dan berkas `google-account-chooser.html` mengekspos data kredensial sensitif:
- Daftar email pribadi administrator dan pemilik sistem (`mivakhorim@gmail.com`, `dutadigitalagensi@gmail.com`).
- Hardcoded list email member pro (`kontraktor.juara@gmail.com`, `admin@dutamik.id`).
- Logika otorisasi lokal di client-side yang mudah dimanipulasi melalui inspect element / devtools.

## 2. Arahan & Tujuan Pengguna
1. Bersihkan seluruh kebocoran email admin dan pengaturan member dari client-side source code.
2. Migrasikan arsitektur login menggunakan Google Auth resmi (Google OAuth 2.0 / Google Identity Services) serta integrasikan ke Supabase Auth & Database untuk manajemen member/lisensi yang aman.
3. Seluruh manajemen role (`admin`, `estimator_pro`, `free_trial`) dan status lisensi dikelola secara terpusat di tabel Supabase (`profiles` / `memberships`) dengan Row Level Security (RLS).
4. Sediakan skrip SQL Supabase yang siap dieksekusi sekali klik di dashboard Supabase (Create Table, RLS Policies, Trigger on auth.users).
