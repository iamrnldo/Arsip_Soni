# REST API — Desa Kediri

## Persiapan lokal

1. Pastikan service PostgreSQL aktif. Pengaturan lokal `server/.env` memakai host `localhost:5432`, user `postgres`, database `kediri_desa` (file `.env` diabaikan Git). Jika konfigurasi PostgreSQL Anda berbeda, sesuaikan `server/.env`.
2. Buat file lokal `.env` dari template. Di PowerShell dari folder proyek: `Copy-Item server/.env.example server/.env`, lalu edit `server/.env` dan isi password PostgreSQL yang benar serta JWT secret. Jangan commit file `.env`.
3. Cara termudah menjalankan keduanya: dari folder `client/`, jalankan `npm install` lalu `npm run dev`. Script `predev` memasang dependensi server; proses `dev` memeriksa API di port 5000, memakai ulang API yang sudah aktif (agar tidak bentrok `EADDRINUSE`), atau menjalankan API jika belum aktif. Setelah itu Vite dibuka. Alternatifnya, jalankan `npm install && npm run dev` di folder `server/` serta Vite di terminal terpisah. Jika `npm run dev` backend dijalankan lagi saat API lama masih aktif, server mengenali instance tersebut dan keluar normal tanpa mencoba bind port kedua.
4. Saat startup, server otomatis menyambung ke database maintenance `postgres`, membuat database target bila belum ada, lalu membuat/memperbarui tabel dan index dari `src/config/schema.sql`. DDL skema bersifat idempotent; aman dijalankan lagi saat restart.
5. Saat belum ada akun Admin, backend otomatis membuat akun bootstrap dari `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, dan `BOOTSTRAP_ADMIN_PASSWORD` di `.env`. Seed berjalan sekali saja dan tidak mereset password pada startup berikutnya. Untuk mengganti akun/password setelah ada Admin, gunakan manajemen pengguna atau perintah `npm run create-admin -- "Nama Admin" admin-baru@desakediri.id "password-kuat-minimal-10"` (password bootstrap minimal 12 karakter).

Akun PostgreSQL yang digunakan perlu memiliki izin `CREATEDB` dan izin membuat extension `pgcrypto`/tabel pada database baru (user `postgres` biasanya memilikinya). Jika inisialisasi gagal, API tetap hidup agar `/api/health` dapat menunjukkan status, namun autentikasi dan endpoint data belum aktif. Periksa `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` dan log startup.

## Endpoint

- `GET /api/health` — status API dan koneksi database
- `POST /api/v1/auth/login`, `GET /api/v1/auth/me`
- `GET /api/v1/dashboard` (surat diperbarui berkala oleh frontend)
- `GET /api/v1/surat?search=&category=` (kategori Rahasia hanya untuk Admin melalui `category=Rahasia`), `POST /api/v1/surat` (multipart: `file` dan, untuk Rahasia, `secret_password`), `PATCH /api/v1/surat/:id`, `DELETE /api/v1/surat/:id`
- `POST /api/v1/surat/:id/preview`, `POST /api/v1/surat/:id/download` menerima JSON `{ "secret_password": "..." }`; password per surat Rahasia disimpan sebagai hash.

Surat Rahasia dikecualikan dari dashboard dan daftar surat umum; tampil di menu **Arsip Rahasia** untuk Admin. Skema otomatis menambahkan kolom password hash pada startup. Pratinjau dokumen mendukung PDF, gambar, DOCX, XLSX/XLS/XLSM, teks, audio, dan video. Format Word `.doc` lama tidak dirender; gunakan DOCX atau unduh berkasnya.
- `GET /api/v1/users`, `POST /api/v1/users`, `PATCH /api/v1/users/:id` (Admin)
- `GET /api/v1/calendar/events` (Google Calendar opsional)

Frontend mengatur base URL dengan `client/.env` (`VITE_API_BASE_URL`). Default development `/api/v1`, diteruskan oleh Vite proxy ke Express di port 5000. Endpoint health tetap `/api/health`.

Semua endpoint selain health dan login memerlukan `Authorization: Bearer <token>`. Staff tidak menerima akses arsip Rahasia; file diunduh melalui endpoint terotorisasi, bukan URL publik. Batas unggahan default 25 MB. Meski berbagai tipe file diterima, gunakan antivirus/validasi tambahan dan object storage privat sebelum produksi.
