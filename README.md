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

The catalog editor saves categories, brands, products, sizes, image metadata, colorways, and colorway image metadata to Supabase through authenticated server routes. The public storefront reads active catalog items from Supabase. Customer carts remain browser-local and require no login.

Database and image-infrastructure files are included in `supabase/` and `infra/r2/`. The Supabase migration creates an empty catalog with RLS policies; the separate reset script is destructive and must be run manually. See each folder's README before applying it to an account.

Admin image fields send device-selected JPG, PNG, WebP, and AVIF files through the authenticated server route and into Cloudflare R2. Configure both Supabase and R2 variables from `.env.example` before using the catalog editor. Product images are delivered through the same-origin `/api/images/` route, so a public R2 development domain is not required for local previews.

Never commit `.env.local`, Supabase service-role keys, or R2 secret keys.

## Production check

```bash
npm run build
npm run start
```

## Deployment readiness

The project uses the Next.js App Router and can be connected to a Git-based Next.js host such as Vercel. Add production environment variables in the hosting dashboard rather than committing secrets. The previous static prototype remains in `dist/` for reference.

No hosted deployment is performed by this repository setup.
