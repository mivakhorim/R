# Revision Ledger (Audit Catatan Versi)

## Versi 1.23 (18 Oktober 2026) - Penguncian Navigasi Setting Proyek, Standarisasi Logo Bersih 60px, Eliminasi Pembungkus Tombol Header, Summary RAB Utuh, dan Redesain QRIS Pro Direct
- **Penguncian Navigasi Tab Informasi & Setting Proyek (Unsaved Changes Guard)**:
  - Mengimplementasikan sistem pelacakan state snapshot `captureInfoProyekState()` dan deteksi perubahan `isInfoProyekDirty()` pada form pengaturan proyek.
  - Saat pengguna mengubah data atau parameter (nama proyek, lokasi, durasi, pajak PPN, overhead, data rekening, pejabat penandatangan, atau logo) lalu mengklik tab menu lain, sistem mengunci perpindahan halaman dan memunculkan pop up modal peringatan eksekutif.
  - Menyediakan 2 tombol aksi:
    - **Simpan Perubahan**: menyimpan seluruh perubahan isian form ke database proyek, menghitung ulang RAB, dan melanjutkan perpindahan menu.
    - **Abaikan**: membatalkan perubahan dan mengembalikan (*revert*) seluruh data ke kondisi semula saat pertama kali masuk ke menu Informasi & Setting Proyek.
- **Standarisasi Logo Dokumen Bersih & Default 60px**:
  - Menghapus kotak pembungkus (*box wrapper*) ber-border abu-abu dan latar `#f1f5f9` pada cetakan dokumen di `print-engine.js`, `bap-invoicing.js`, dan Lembar Setting Proyek (`app.js`).
  - Mengembalikan logo ke format visual standar arsitektural tanpa wadah kotak pembungkus yang tidak diperlukan.
  - Menetapkan nilai default ukuran logo dokumen (*document logo size*) menjadi **60px** (dari sebelumnya 120px) pada slider pengaturan, input data, dan template cetak dokumen.
- **Eliminasi Pembungkus Tombol Header (Login Google & Upgrade Pro)**:
  - Menghapus garis tepi (*border outline*) dan kotak pembungkus pada tombol `#globalAuthBtn` (Login Google) dan `#globalUpgradeBtn` / `.topbar-btn-pro` (Upgrade Pro) di `main.css`.
  - Tombol kini berstatus flat, tenang, dan bersih pada kondisi diam (*rest state*) tanpa border pembungkus, dengan aksen visual halus yang hanya aktif saat kursor melakukan hover sesuai standar Rule 3.
- **Tampilan Data Ringkasan RAB Utuh Tanpa Terpotong (Anti-Truncation)**:
  - Merapikan 3 kartu ringkasan RAB (`rab-summary-card`) di halaman Rincian Detail RAB.
  - Membuang teks redundan yang kurang penting (*Acuan: SE PUPR No. 47/2026...*), dan menampilkan informasi penting **Lokasi Proyek** secara utuh pada baris tersendiri tanpa pemotongan titik-titik (*ellipsis*), didukung struktur CSS proporsional *equal-height*.
- **Redesain Pop Up QRIS Pro Direct & Konfirmasi WhatsApp Cepat**:
  - Menghilangkan formulir 2-tahap pada modal aktivasi akun pro (`google-auth-manager.js`).
  - Pop up kini langsung menampilkan barcode QRIS resmi Duta Digital Agensi beserta nominal pembayaran yang telah dilengkapi **3 digit kode acak unik** (misal: Rp 350.xxx) untuk pencocokan transaksi otomatis.
  - Menyertakan rincian pembeli terlogin (Nama Akun Google dan Alamat Email) serta tombol konfirmasi langsung ke WhatsApp Admin (`0831-3030-0094`) dengan template pesan otomatis lengkap.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.23/`.

## Versi 1.22 (18 Oktober 2026) - Eliminasi Tombol Duplikat Cetak Proposal & Standarisasi Cetak Header
- **Eliminasi Tombol Duplikat Cetak Proposal A4**:
  - Menghapus tombol `Cetak Proposal A4` pada sub-header halaman proposal di `app.js` (`renderProposalView`) untuk menghilangkan redundansi visual dan merapikan panel filter proposal.
  - Sub-header proposal kini hanya menyajikan tombol seleksi cepat `Pilih Semua` dan `Kosongkan`.
- **Standarisasi Cetak Terpusat Melalui Header Utama**:
  - Memastikan pencetakan proposal 100% terintegrasi dengan tombol standar `Cetak A4` di topbar header navigasi utama (`globalPrintBtn`), yang secara otomatis memicu `printProposal()` saat tab Proposal aktif.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.22/`.

## Versi 1.21 (18 Oktober 2026) - Perbaikan Bug DOM Modal Kalender Hari Libur & Auto-Recovery Notification Modal
- **Penyelesaian Bug Pop Up Kalender Hilang Style (DOM Removal)**:
  - Mengidentifikasi dan menghapus pemanggilan destruktif `modal.remove()` di dalam fungsi `toggleCalendarHoliday` (`app.js`). Panggilan tersebut sebelumnya melenyapkan elemen permanen `#notificationModal` dari dokumen HTML saat pengguna menetapkan hari libur pertama kali, sehingga pembukaan pop up pada klik kedua dan seterusnya gagal menemukan node modal dan jatuh ke `alert()` bawaan peramban (*browser native alert*) yang tanpa style.
  - Mengganti logika penutupan dengan `hideNotificationModal()` dan transisi kelas `open` ber-animasi lembut serta `display: none` tanpa merusak integritas DOM.
- **Arsitektur Auto-Recovery Notification Modal**:
  - Menambahkan mekanisme *self-healing / auto-recovery* pada fungsi `showNotificationModal` di `app.js`. Jika elemen modal `#notificationModal` tidak ditemukan di DOM akibat intervensi eksternal, sistem secara otomatis menginjeksi kembali struktur modal Google-style yang lengkap dan mengaitkan seluruh tombol aksi (Close, Paham, Tutup).
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.21/`.

## Versi 1.20 (18 Oktober 2026) - Perbaikan Menu BAP, Redesain Kurva S Anti-Tabrakan & Standarisasi Modal Google Style
- **Perbaikan Fatal Menu BAP & Tagihan Proyek**:
  - Menghapus deklarasi ganda identifier `const phaseIndex` di dalam fungsi `getTerminScheme` (`bap-invoicing.js`) yang sebelumnya menyebabkan `SyntaxError: Identifier 'phaseIndex' has already been declared` dan menggagalkan inisialisasi `window.BapInvoicing`.
  - Melindungi fungsi `renderBapView()` di `app.js` dengan fallback guard dan blok `try...catch` defensif sehingga tab BAP dan Tagihan Proyek terbuka secara instan tanpa error.
- **Redesain Kurva S Anti-Tabrakan & De-Cluttering**:
  - Memindahkan badge deviasi progres (`deviasiBadge`) dari dalam area plot grafik (`padT + 10`) ke baris header SVG luar (`padT - 18`) sejajar dengan badge mode grid, sehingga tidak lagi menabrak garis kurva dan persentase minggu 6-7.
  - Menghapus teks angka persentase pada batang rencana (`planBars`) untuk mencegah cetak ganda di atas titik kurva kumulatif.
  - Mengatur `text-anchor="start"` dengan pergeseran `dx = 4` pada titik awal (M-1) agar label persentase tidak menabrak sumbu vertikal Y.
- **Standarisasi Seluruh Modal / Popup Bergaya Google Login**:
  - Menghapus garis tepi (`border: none !important;`) pada semua dialog modal di `modals.css`, `cloud-drive-sync.js`, dan `google-auth-manager.js`, dilengkapi sudut lengkung halus 14px dan elevasi bayangan lembut.
  - Menerapkan header bersih berlatar putih (`background: #ffffff`) dengan judul warna navy tajam (`#0f172a`), subjudul abu-abu (`#64748b`), serta tombol close minimalis tanpa kotak garis tepi (`border: none; background: transparent;`).
- **Eliminasi Box Pembungkus Tombol (Anti Box-in-Box Clutter)**:
  - Menghapus kotak garis tepi pembungkus pada tombol penetapan hari libur di modal kalender harian (`app.js`). Tombol kini tampil rapi dan langsung tanpa kontainer berlapis.
  - Menyederhanakan kartu aksi sinkronisasi lokal dan Google Drive pada `cloud-drive-sync.js` menjadi elemen datar elegan berlatar `#f8fafc` tanpa border ganda.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.20/`.

## Versi 1.19 (18 Oktober 2026) - Sinkronisasi Otomatis Kalender Proyek & Kurva S
- **Sinkronisasi Dinamis Kalender dari Rincian RAB & Analisis Volume**:
  - Memperbaiki fungsi `syncTasksFromRabDetail` di `project-calendar.js` agar beban Orang-Hari (OH), jumlah tenaga kerja (crew size), durasi kerja, dan tanggal penyelesaian langsung dihitung ulang secara dinamis saat volume pekerjaan diubah di lembar Detail RAB maupun Analisis Volume.
  - Menghapus penguncian semu durasi lama (`manualDuration`) pada pekerjaan yang berstatus 'Belum Mulai' atau belum terkunci, sehingga penambahan atau penghapusan item pekerjaan merapatkan jadwal secara berurutan dan teratur tanpa celah tanggal kosong.
- **Eliminasi Stale Cache & Reaktivitas Kurva S**:
  - Menginvalidasi entri cache render `tabRenderedRevision` di `app.js` pada setiap eksekusi `syncAllProjectFeatures` dan `syncCalendarFromRab`.
  - Ketika pengguna berpindah ke tab Kurva S setelah melakukan sinkronisasi kalender atau pengubahan rincian RAB, Kurva S dijamin selalu merender grafik kurva dan tabel bobot mingguan/harian terbaru.
- **Penyelarasan Realtime Analisis Volume**:
  - Fungsi `handleVolumeChange` di `app.js` kini secara otomatis menyinkronkan tugas kalender dan mengkalkulasi ulang data Kurva S harian maupun mingguan.
- **Tombol Aksi Sinkronkan Kurva S**:
  - Menyediakan tombol aksi 'Sinkronkan Kurva S' (`App.syncKurvaSFromCalendar`) pada header panel Kurva S untuk memberikan kontrol penyegaran instan satu klik bagi pengguna.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.19/`.

## Versi 1.18 (18 Oktober 2026) - Perbaikan Ekspor Modul Kalender Proyek
- **Penyelesaian TypeError countPureWorkDays**:
  - Mendaftarkan dan mengekspor fungsi `countPureWorkDays`, `isProjectHoliday`, `toggleProjectHoliday`, dan `calculateFinishDateFromWorkDays` ke dalam objek pengembalian publik `window.ProjectCalendar` (`project-calendar.js`).
  - Membersihkan blok pengembalian `syncTasksFromRabDetail` yang sebelumnya secara tidak sengaja memuat nama-nama fungsi tersebut.
  - Memperkuat pemanggilan fungsi di `app.js` (`renderInfoProyekView`) dengan validasi `typeof window.ProjectCalendar.countPureWorkDays === 'function'` sehingga kalkulasi rekomendasi tenaga kerja harian berjalan mulus tanpa potensi crash.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.18/`.

## Versi 1.17 (18 Oktober 2026) - Perbaikan Halaman Kosong Tab Informasi & Setting Proyek
- **Penyelesaian ReferenceError Variabel Tenaga Kerja**:
  - Mendeklarasikan variabel `totalProjectLaborQty` dari hasil perhitungan `totalLaborOH` di dalam fungsi `renderInfoProyekView()` (`app.js`). Hal ini menyelesaikan kendala halaman kosong (*blank page*) akibat terhentinya eksekusi template string saat membaca nilai akumulasi beban tenaga kerja.
- **Fallback Guard Modul ResourceUsage**:
  - Menambahkan pengecekan keberadaan `window.ResourceUsage.calculateTotalResources` sehingga kalkulasi tenaga kerja tetap berjalan lancar dan aman.
- **Proteksi Runtime Render View**:
  - Membungkus seluruh eksekusi `renderInfoProyekView()` dalam penanganan kesalahan `try...catch` berperingatan ramah sehingga tab proyek tidak akan pernah mengalami kegagalan render total.
- **Enkapsulasi Scope RabCalculator**:
  - Merapikan posisi fungsi pembantu `toRomanNumeral()` dan `reindexDivisions()` ke dalam *scope* modul `RabCalculator` dan mengekspornya ke API publik modul.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.17/`.

## Versi 1.16 (18 Oktober 2026) - Penomoran Otomatis Divisi & Termin serta Pembersihan Box-in-Box
- **Penomoran Urutan Divisi 100% Otomatis**:
  - Menghapus input teks manual untuk kode romawi divisi pada form modal Tambah Divisi dan Edit Divisi (`app.js`). Pengguna tidak perlu mengisi manual nomor divisi lagi.
  - Setiap kali divisi ditambah, diubah, dihapus, atau dihitung ulang di RAB, fungsi `reindexDivisions()` pada `rab-calculator.js` otomatis menyusun ulang kode divisi secara berurutan (DIVISI I, DIVISI II, DIVISI III, dst.) dan membersihkan prefix teks manual.
- **Penomoran Urutan Skema Termin BAP Otomatis**:
  - Memperbaiki `deleteTerminScheme` dan `getTerminScheme` pada `bap-invoicing.js` agar judul termin (seperti 'Termin I', 'Termin II', 'Termin III', dst.) otomatis disesuaikan secara berurutan dan dinamis dengan nomor urut (phaseIndex) barunya saat ada termin di tengah yang dihapus. Tidak ada lagi nomor termin yang meloncat.
- **Pembersihan Box-in-Box (Anti-Clutter & Rule 3)**:
  - Menghapus semua nested inner box berulang pada modal 'Sinkronisasi Hybrid: Folder Lokal & Google Drive Cloud' (`cloud-drive-sync.js`).
  - Informasi folder penyimpanan lokal dan status Google Drive kini disajikan dengan tipografi label-value arsitektural yang bersih, flat, dan menyatu langsung dengan kartu utama tanpa pembungkus ganda.
  - Pengaturan checkbox Auto-Sync dan bar profil pengguna diratakan dengan pemisah garis horizontal bersih tanpa background box bertumpuk.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.16/`.

## Versi 1.15 (2026-10-17)
- **Auto Re-indexing Nomor Urut Divisi**:
  - Memperbaiki logika `removeDivision(divisionId)` pada `js/modules/rab-calculator.js` dengan menambahkan fungsi cerdas `reindexDivisions()`.
  - Ketika salah satu divisi dihapus (misalnya Divisi II), seluruh divisi setelahnya secara otomatis dinomori ulang secara berurutan (Divisi III menjadi Divisi II, Divisi IV menjadi Divisi III, dst.) menggunakan konversi angka Romawi standar (I, II, III, IV, V, dst.).
  - Memperbarui `deleteDivision(divId)` di `js/app.js` untuk memicu sinkronisasi tugas kalender kerja (`syncTasksFromRabDetail(true)`) dan Kurva S secara langsung.
- **Cadangan Versi**: Tersimpan di `versions/v1.14/`.

## Versi 1.14 (2026-10-17)
- **Keamanan Total**: Menghapus seluruh kebocoran email admin (`mivakhorim@gmail.com`, `dutadigitalagensi@gmail.com`), email member pro, dan akun dummy dari `config/auth-license-config.json`, `js/modules/google-auth-manager.js`, dan `google-account-chooser.html`.
- **Integrasi Supabase Auth & Member Management**:
  - Mengintegrasikan Supabase JS Client (v2) untuk autentikasi Google OAuth yang aman dan terdesentralisasi.
  - Memindahkan verifikasi hak akses member (`admin`, `estimator_pro`, `free_trial`) dari logika client-side ke database Supabase berbasis Row Level Security (RLS).
  - Menyediakan file skema SQL `supabase-schema.sql` untuk inisialisasi tabel profil, trigger otomatis saat pendaftaran Google, dan kebijakan RLS.
  - Menyediakan modal konfigurasi Supabase (URL & Anon Key) yang dapat diatur langsung oleh pengelola tanpa membongkar kode sumber.
- **Kepatuhan Protokol**: Zero HTML comments, Zero CSS comments, Zero dead code JS, dan 0 karakter em dash.
- **Cadangan Versi**: Tersimpan di `versions/v1.13/`.
