# K-Market Online Shopper

Next.js storefront for KMOS. The customer cart is saved in browser `localStorage`; no customer account is required.

## Local development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Admin panel

Open `http://localhost:3000/@dm1n`. Admin access is protected by a signed, HTTP-only session cookie. Copy `.env.example` to `.env.local` and set:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_SESSION_SECRET` (at least 32 random characters)

The catalog editor currently saves a working draft to browser `localStorage` under `kmos-admin-catalog-v2`. The previous local draft key is removed automatically. The panel models categories, brands, product placement, display order, tags, sizes, item images, and colorways. Its Storage section intentionally reports Supabase and R2 as disconnected until their server adapters and production credentials are added.

Database and image-infrastructure files are included in `supabase/` and `infra/r2/`. The Supabase migration creates an empty catalog with RLS policies; the separate reset script is destructive and must be run manually. See each folder's README before applying it to an account.

Never commit `.env.local`, Supabase service-role keys, or R2 secret keys.

## Production check

```bash
npm run build
npm run start
```

## Deployment readiness

The project uses the Next.js App Router and can be connected to a Git-based Next.js host such as Vercel. Add production environment variables in the hosting dashboard rather than committing secrets. The previous static prototype remains in `dist/` for reference.

No hosted deployment is performed by this repository setup.
