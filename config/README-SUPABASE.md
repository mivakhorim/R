# Panduan Pengelolaan & Migrasi Database Supabase
**Aplikasi Rencana Anggaran Biaya (RAB) Standar SE Bina Konstruksi No. 47/2026**
Pengembang: Duta Digital Agensi (dutamik.id) - Sukoharjo, Jawa Tengah

---

## 1. Menjalankan Perubahan Skema SQL
Setiap kali ada pembaruan tabel, hak akses lisensi, atau penambahan domain resmi:
1. Buka [Dashboard Supabase](https://supabase.com/dashboard) dan pilih proyek Anda.
2. Masuk ke menu **SQL Editor** pada navigasi sisi kiri.
3. Klik **+ New Query**.
4. Buka file `config/supabase-schema-setup.sql` di editor Anda, salin seluruh kodenya.
5. Tempel (Paste) ke editor SQL Supabase, lalu klik tombol **Run**.
6. Skrip ini bersifat *idempotent* (`CREATE TABLE IF NOT EXISTS` dan `ON CONFLICT DO UPDATE`), sehingga aman dijalankan berulang kali tanpa merusak data lama.

---

## 2. Struktur Tabel Inti Supabase
- **`public.member_tiers`**: Menyimpan batasan level akses (`free_trial`, `client_viewer`, `estimator_pro`, `admin`).
- **`public.user_profiles`**: Menyimpan data profil akun pengguna yang terhubung otomatis saat login via Google OAuth.
- **`public.app_domain_locks`**: Menyimpan daftar domain yang diizinkan mengakses sistem lisensi (`rab.dutamik.id`, `dutamik.id`, `localhost`).
- **`public.billing_orders`**: Menyimpan catatan permohonan upgrade lisensi ke paket Estimator Pro.
- **`public.system_secrets`**: Menyimpan kata sandi master administrasi dalam bentuk hash SHA-256.

---

## 3. Menjalankan Script Pengujian & Pemeliharaan
Anda dapat menjalankan script pembantu melalui terminal PowerShell:
```bash
python config/supabase-manager.py
```
Fitur script:
- Menguji ketersediaan endpoint REST API Supabase.
- Memeriksa apakah tabel inti sudah terbentuk dan siap digunakan.
- Memberikan panduan cepat kapan pun dibutuhkan.
