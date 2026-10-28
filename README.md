# Sistem Persuratan Desa Kediri

Aplikasi terdiri dari:
- `client/` — React, Vite, Tailwind CSS, Lenis; frontend memanggil REST API lewat proxy `/api`.
- `server/` — Express REST API, PostgreSQL, JWT, upload berkas, serta integrasi Google Calendar opsional.
- `docs/struktur-folder.md` — struktur folder proyek.
- `server/README.md` — konfigurasi lokal dan daftar endpoint.

Jalankan PostgreSQL, salin `server/.env.example` menjadi `server/.env`, lalu isi password PostgreSQL yang benar. Dari `client/`, jalankan `npm install` lalu `npm run dev`. Script akan memakai API port 5000 yang sudah berjalan atau menjalankan backend bila belum aktif, jadi tidak menyalakan API kedua dan memicu `EADDRINUSE`. Pastikan role PostgreSQL punya izin membuat database. Backend otomatis membuat database, skema, dan Admin awal (jika belum ada Admin).

Frontend menampilkan dashboard setelah autentikasi; indikator di layar login membedakan status API dan PostgreSQL. Jika database belum tersambung, cek `GET /api/health` dan log backend. Jangan commit `server/.env` (file ini sudah diabaikan Git).
