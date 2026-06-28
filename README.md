# Belajar Vibe Coding (User Management API)

Aplikasi ini adalah sistem *backend* (API) ringan untuk manajemen pengguna (Autentikasi). Dibuat sebagai wadah eksplorasi dan pembelajaran (*Belajar Vibe Coding*) dalam membangun API yang cepat dan efisien. Fitur utamanya mencakup Registrasi pengguna, Login, melihat Profil pengguna saat ini, dan Logout berbasis sistem sesi (Token-based authentication).

---

## 🛠️ Technology Stack & Libraries
- **Runtime & Package Manager:** [Bun.js](https://bun.sh/) (Cepat, tangguh, dan sudah *all-in-one* dengan *test runner*).
- **Bahasa Pemrograman:** TypeScript.
- **Database:** MySQL.
- **Web Framework:** [Elysia.js](https://elysiajs.com/) (Framework web paling cepat untuk ekosistem Bun).
- **ORM (Object Relational Mapping):** [Drizzle ORM](https://orm.drizzle.team/) (ORM TypeScript modern dan ringan).
- **Database Driver:** `mysql2`.
- **Testing Framework:** `bun:test` (Bawaan dari ekosistem Bun).

---

## 📂 Arsitektur dan Struktur Folder

Aplikasi ini memisahkan lapisan antara konfigurasi jalur API (*routing*) dengan logika bisnis (*business logic*) dan akses data (*data access*).

```text
belajar-vibe-coding/
├── src/
│   ├── index.ts              # Entry point aplikasi (Inisialisasi Elysia)
│   ├── routes/               # Lapisan Routing (Menangani request, HTTP status, dan validasi)
│   │   └── users-route.ts    # Format penamaan: [nama-modul]-route.ts
│   ├── services/             # Lapisan Bisnis (Menangani query ke DB dan logika utama)
│   │   └── users-services.ts # Format penamaan: [nama-modul]-services.ts
│   └── db/
│       ├── index.ts          # Koneksi Drizzle ke MySQL
│       └── schema.ts         # Definisi struktur tabel (Schema)
├── tests/
│   └── users.test.ts         # Berisi file-file pengujian (Unit Test)
└── package.json
```

---

## 🗄️ Database Schema

Sistem ini menggunakan dua tabel utama yang saling berelasi:

### 1. `users` (Tabel Pengguna)
- `id` (INT, Primary Key, Auto Increment)
- `name` (VARCHAR(255), Not Null)
- `email` (VARCHAR(255), Not Null, Unique)
- `password` (VARCHAR(255), Not Null)
- `created_at` (TIMESTAMP, Default: Now)

### 2. `sessions` (Tabel Sesi Login)
- `id` (INT, Primary Key, Auto Increment)
- `token` (VARCHAR(255), Not Null)
- `user_id` (INT, Not Null, Foreign Key mengarah ke `users.id`)
- `created_at` (TIMESTAMP, Default: Now)

---

## 🔌 API Endpoints (Tersedia)

### 1. Register User
- **Endpoint:** `POST /api/users`
- **Deskripsi:** Mendaftarkan pengguna baru ke sistem.
- **Body Request:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "pasword": "rahasia123"
  }
  ```

### 2. Login User
- **Endpoint:** `POST /api/users/login`
- **Deskripsi:** Melakukan login dan mendapatkan token otorisasi.
- **Body Request:**
  ```json
  {
    "email": "john@example.com",
    "pasword": "rahasia123"
  }
  ```
- **Response Sukses:** Mengembalikan objek token yang akan dimasukkan ke dalam tabel sesi.

### 3. Get Current User
- **Endpoint:** `GET /api/users/current`
- **Deskripsi:** Mengambil detail informasi pengguna yang sedang login.
- **Headers:** 
  - `Authorization`: `Bearer <token>` (Token didapatkan dari endpoint Login)
- **Response Sukses:** Mengembalikan data `id`, `username`, `email`, dan `created_at`.

### 4. Logout User
- **Endpoint:** `DELETE /api/users/logout`
- **Deskripsi:** Menghapus sesi/token pengguna dari database sehingga token tersebut tidak dapat digunakan lagi.
- **Headers:** 
  - `Authorization`: `Bearer <token>`

*(Catatan: Endpoint registrasi dan login memiliki lapisan validasi yang menolak data berformat salah atau field berukuran lebih dari 255 karakter).*

---

## 🚀 Cara Setup dan Menjalankan Aplikasi

### Persiapan
1. Pastikan Anda telah menginstal **[Bun](https://bun.sh/)** di sistem operasi Anda.
2. Pastikan layanan database **MySQL** telah berjalan secara lokal (XAMPP/Laragon/Docker) pada port `3306`.
3. Buat database baru di MySQL dengan nama `belajar_vibe_coding`.
4. *Clone* repositori ini.

### Instalasi Dependensi
Jalankan perintah ini di dalam *root* direktori proyek Anda:
```bash
bun install
```

### Sinkronisasi Skema Database
Untuk membuat tabel yang dibutuhkan secara otomatis, lakukan *push* skema menggunakan Drizzle:
```bash
bun run drizzle-kit push
```

### Menjalankan Server Aplikasi
Anda dapat menyalakan *server* lokal (dengan mode *hot-reload*) menggunakan perintah:
```bash
bun run dev
```
*(Catatan: Aplikasi secara default berjalan pada port `3000`)*

---

## 🧪 Cara Menjalankan Pengujian (Testing)

Aplikasi ini dilengkapi dengan sekumpulan *Unit Test* dan *Integration Test* komprehensif. Pengujian ini menggunakan *test runner* super cepat bawaan dari Bun (`bun:test`).

**Penting:** Pengujian memerlukan database MySQL yang sedang aktif. Pengujian akan menghapus dan mengisi ulang data sesi dan *user* (di-reset secara otomatis pada setiap *test case*) agar hasil ujian tetap konsisten.

Jalankan seluruh skenario pengujian dengan perintah:
```bash
bun test
```
