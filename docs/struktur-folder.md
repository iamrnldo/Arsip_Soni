# Struktur folder — Sistem Persuratan Desa Kediri

```text
kediri-desa-app/
├── client/                         # React + Vite + Tailwind CSS + Lenis
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── assets/                 # Logo Pemdes/Pemkab dan aset visual Kediri
│       ├── components/
│       │   ├── auth/               # Form login
│       │   ├── dashboard/          # Kartu statistik, pengumuman, berita acara
│       │   ├── layout/             # Sidebar, navbar, layout halaman
│       │   ├── surat/              # Form dan tabel surat
│       │   └── users/              # Form dan tabel pengguna/role
│       ├── hooks/                  # Custom hooks (mis. data realtime)
│       ├── layouts/
│       ├── pages/
│       │   ├── auth/
│       │   ├── dashboard/
│       │   ├── surat/
│       │   └── users/
│       ├── routes/                 # Routing dan proteksi halaman
│       ├── services/               # Klien REST API
│       ├── styles/
│       └── utils/
├── server/                         # Express.js REST API
│   ├── package.json
│   ├── .env.example                # Template konfigurasi; jangan commit .env
│   ├── uploads/                    # Penyimpanan lokal sementara/awal berkas surat
│   └── src/
│       ├── app.js
│       ├── server.js
│       ├── config/
│       │   ├── database.js         # Koneksi PostgreSQL
│       │   ├── calendar.js         # Konfigurasi Google Calendar
│       │   └── schema.sql          # Skema awal database
│       ├── controllers/            # Handler endpoint
│       ├── middlewares/            # Autentikasi, role, upload, error
│       ├── routes/                 # Rute REST API
│       ├── services/               # Logika bisnis/integrasi
│       ├── validators/             # Validasi input API
│       └── utils/
├── docs/                           # Dokumentasi proyek
├── .gitignore
└── README.md
```

## Pembagian akses yang direncanakan

- **Admin:** mengelola pengguna dan role, serta fitur persuratan.
- **Staff:** mengunggah/mencatat surat; tidak dapat mengelola role pengguna.
- Surat **rahasia** harus dilindungi otorisasi dan penyimpanan aman di backend—bukan hanya disembunyikan di antarmuka. Untuk produksi, pertimbangkan object storage privat alih-alih folder `uploads/` lokal.

## Catatan konfigurasi

Kredensial database dan Google Calendar akan dimasukkan melalui environment variable di `server/.env` (file tersebut tidak di-commit). Jangan menaruh password database langsung di kode atau repository. Password yang disebutkan dalam permintaan belum ditulis ke berkas apa pun.