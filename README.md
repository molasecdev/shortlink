# Shortlink

Sistem manajemen URL pendek yang ringan dan modern, dibangun dengan Astro, TypeScript, dan TailwindCSS. Mendukung deployment lokal (file JSON) maupun serverless (Vercel + Upstash Redis) tanpa perubahan kode.

## Fitur

- Autentikasi pengguna dengan bcrypt password hashing
- Sesi stateless berbasis HMAC (aman untuk serverless, tidak menulis file)
- Buat, edit, dan hapus short URL
- Redirect cepat dengan status 302
- Pelacakan klik per link
- Role-based access control (Admin / User)
- Panel admin untuk manajemen pengguna dan link
- Storage adaptif: file JSON di lokal, Upstash Redis di production
- UI responsif dengan TailwindCSS
- TypeScript dengan strict mode

## Tech Stack

| Layer                | Teknologi                      |
| -------------------- | ------------------------------ |
| Framework            | Astro 5 + TypeScript           |
| Styling              | TailwindCSS 3                  |
| Auth                 | bcrypt + HMAC session cookie   |
| Storage (lokal)      | JSON files                     |
| Storage (production) | Upstash Redis via `@vercel/kv` |
| Deployment           | Vercel (serverless)            |
| Runtime              | Node.js 18+                    |

## Kebutuhan Sistem

- Node.js 18 atau lebih baru
- npm

## Instalasi

```bash
# Clone repository
git clone https://github.com/molasecdev/shortlink.git
cd shortlink

# Install dependencies
npm install
```

## Konfigurasi

Salin file `.env.example` menjadi `.env`:

```bash
cp .env.example .env
```

Isi variabel berikut:

```env
NODE_ENV=development
SESSION_SECRET=isi_dengan_random_string_minimal_32_karakter
```

Untuk generate `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
openssl rand -hex 32
```

## Menjalankan Aplikasi

### Development (lokal)

```bash
npm run dev
```

Aplikasi berjalan di `http://localhost:4321`. Data disimpan di folder `data/` sebagai file JSON.

### Build Production

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## Setup Awal

1. Jalankan aplikasi dengan `npm run dev`
2. Buka `http://localhost:4321/register`
3. Buat akun pertama — akun pertama bisa dijadikan admin lewat edit manual di `data/users.json` (set `"role": "admin"`)
4. Login di `/login`
5. Tambah user lain via panel admin

## Struktur Project

```
Shortlink/
├── constants.ts                     # URL dan konfigurasi site
├── astro.config.mjs                 # Konfigurasi Astro
├── tailwind.config.mjs
├── tsconfig.json
├── package.json
├── .env.example
│
├── data/                            # Storage lokal (tidak di-commit ke git)
│   ├── users.json
│   ├── links.json
│   └── config.json
│
└── src/
    ├── lib/
    │   ├── kv.ts                    # Storage adapter (lokal ↔ Upstash Redis)
    │   ├── storage.ts               # Operasi file JSON (lokal)
    │   ├── auth.ts                  # Manajemen user
    │   ├── session.ts               # HMAC session (stateless)
    │   ├── links.ts                 # Manajemen short link
    │   └── date.ts                  # Helper tanggal
    │
    ├── middleware/
    │   └── middleware.ts            # Auth middleware (inject user ke locals)
    │
    ├── layouts/
    │   └── MainLayout.astro
    │
    ├── components/
    │   ├── SiteHeader.astro
    │   ├── SiteNav.astro
    │   ├── Footer.astro
    │   ├── GlobalScripts.astro
    │   └── GlobalStyles.astro
    │
    └── pages/
        ├── index.astro              # Halaman utama
        ├── login.astro
        ├── register.astro
        ├── dashboard.astro
        ├── [slug].astro             # Redirect handler (fallback)
        ├── links/
        │   ├── index.astro          # Daftar link
        │   ├── create.astro
        │   └── edit/[id].astro
        ├── users/
        │   ├── index.astro          # Daftar user (admin only)
        │   ├── create.astro         # Buat user (admin only)
        │   └── edit/[id].astro
        └── api/
            ├── [slug].ts            # Redirect endpoint
            ├── health.ts
            ├── auth/
            │   ├── login.ts
            │   ├── logout.ts
            │   └── register.ts
            ├── links/
            │   ├── create.ts
            │   └── [id].ts          # PUT, POST (form), DELETE
            └── users/
                ├── create.ts
                └── [id].ts          # PUT, POST (form), DELETE
```

## Deployment ke Vercel

### 1. Siapkan Upstash Redis

Di Vercel Dashboard → Storage → **Upstash for Redis** → Create → Connect ke project.

Setelah connect, Vercel otomatis inject env variables:

```
KV_REST_API_URL
KV_REST_API_TOKEN
```

### 2. Tambahkan Environment Variables

Di Vercel Dashboard → Project → Settings → Environment Variables:

```
SESSION_SECRET = <random string 32+ karakter>
```

Generate:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Deploy

```bash
git push origin main
```

Vercel akan otomatis build dan deploy. Storage akan menggunakan Upstash Redis karena `KV_REST_API_URL` tersedia.

### Cara Kerja Storage Adapter

| Environment           | `KV_REST_API_URL` | Storage yang dipakai |
| --------------------- | ----------------- | -------------------- |
| Lokal (`npm run dev`) | Tidak ada         | File JSON di `data/` |
| Vercel production     | Ada (auto-inject) | Upstash Redis        |

Tidak ada perubahan kode yang diperlukan saat berpindah environment.

## Cara Kerja Sesi

Sesi disimpan sepenuhnya di cookie (stateless), tidak ada yang ditulis ke disk atau database:

1. Saat login, server membuat token: `base64url(userId|expiry|hmac_signature)`
2. Token disimpan di cookie `session` (HttpOnly, Secure, SameSite=Lax)
3. Setiap request, server memvalidasi HMAC signature dan expiry
4. Logout cukup menghapus cookie di client

Keuntungan: aman untuk serverless karena tidak ada state di server.

## API Endpoints

| Method | Endpoint             | Deskripsi                      |
| ------ | -------------------- | ------------------------------ |
| POST   | `/api/auth/login`    | Login                          |
| POST   | `/api/auth/register` | Register                       |
| GET    | `/api/auth/logout`   | Logout                         |
| GET    | `/api/health`        | Health check                   |
| GET    | `/api/:slug`         | Redirect ke target URL         |
| POST   | `/api/links/create`  | Buat link baru                 |
| PUT    | `/api/links/:id`     | Update link (JSON)             |
| POST   | `/api/links/:id`     | Update/hapus link (form)       |
| DELETE | `/api/links/:id`     | Hapus link (JSON)              |
| POST   | `/api/users/create`  | Buat user (admin only)         |
| PUT    | `/api/users/:id`     | Update user (admin only, JSON) |
| POST   | `/api/users/:id`     | Update/hapus user (form)       |
| DELETE | `/api/users/:id`     | Hapus user (admin only, JSON)  |

## Fitur Keamanan

- bcrypt password hashing (salt rounds: 10)
- HMAC-SHA256 untuk signing session token
- Timing-safe comparison untuk validasi signature
- Cookie: HttpOnly, Secure (production)
- Session expiry 24 jam
- Validasi input di semua endpoint
- Authorization check di semua protected endpoint
- CSRF protection dinonaktifkan di Astro karena auth ditangani sendiri

## Deployment Alternatif (VPS / Docker)

### PM2

```bash
npm run build
npm install -g pm2
pm2 start "npm run preview" --name "shortlink"
pm2 save
pm2 startup
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4321
CMD ["npm", "run", "preview"]
```

```bash
docker build -t shortlink .
docker run -p 4321:4321 \
  -e SESSION_SECRET=your_secret \
  -v $(pwd)/data:/app/data \
  shortlink
```

Di Docker/VPS, `KV_REST_API_URL` tidak perlu diset — app akan otomatis pakai file JSON di folder `data/`.

## Troubleshooting

**Port sudah dipakai:**

```bash
npm run dev -- --port 3001
```

**Data korup (lokal):**

```bash
rm data/*.json
npm run dev
```

**Session tidak valid setelah deploy:**
Pastikan `SESSION_SECRET` sama antara semua instance. Kalau secret berubah, semua sesi lama otomatis invalid dan user perlu login ulang.

**Vercel: data tidak tersimpan:**
Pastikan `KV_REST_API_URL` dan `KV_REST_API_TOKEN` sudah ter-inject. Cek di Settings → Environment Variables → verifikasi kedua variable ada untuk environment Production.

## Changelog

### v0.2.0

- Migrasi session ke HMAC stateless (tidak perlu `sessions.json`)
- Tambah storage adapter `kv.ts` untuk support Upstash Redis
- Fix CSRF error di Vercel (`security.checkOrigin: false`)
- Fix `SameSite=Strict` → `SameSite=Lax` pada session cookie
- Support deployment ke Vercel tanpa konfigurasi tambahan

### v0.1.0

- Sistem autentikasi lengkap
- Manajemen user dan link
- Click tracking
- Admin dashboard
- UI responsif
