# Feature Freeze Ledger

Daftar modul yang berstatus LOCKED (TERKUNCI) dan tidak boleh dirombak logikanya:

| Modul | File Path | Status | Catatan |
|---|---|---|---|
| AHSP Engine SE PUPR No. 47/2026 | `js/modules/ahsp-engine.js` | LOCKED | Standar koefisien & perhitungan baku |
| RAB Calculator | `js/modules/rab-calculator.js` | LOCKED | Algoritma subtotal, rekap, & pajak 11% |
| S-Curve Diagram | `js/modules/scurve-diagram.js` | LOCKED | Visualisasi kurva S & kumulatif progres |
| BAP Invoicing | `js/modules/bap-invoicing.js` | LOCKED | Berita Acara Pembayaran & termin proyek |
| Volume Analysis | `js/modules/volume-analysis.js` | LOCKED | Analisis volume galian, struktur, arsitektur |
| Print Engine A4 | `js/utils/print-engine.js` | LOCKED | Ekspor cetak presisi A4 |
| Responsive Sidebar Drawer | `css/main.css`, `index.html` | LOCKED | Desain responsif tablet & off-canvas v1.13 |
| Supabase & Google Auth Manager | `js/modules/google-auth-manager.js` | REVISED v1.14 | Menggantikan hardcoded auth dengan Supabase |
