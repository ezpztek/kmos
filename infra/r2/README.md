# Cloudflare R2 setup

Recommended bucket name: `kmos-product-images`.

The current admin upload route sends files to R2 from the server, so upload CORS is not required. The included CORS file remains available if a future version restores direct browser uploads; replace `https://YOUR_PRODUCTION_DOMAIN` before applying it.

```bash
npx wrangler login
npx wrangler r2 bucket create kmos-product-images
npx wrangler r2 bucket cors set kmos-product-images --file infra/r2/cors.json
npx wrangler r2 bucket cors list kmos-product-images
```

Buckets are private by default. For production image delivery, connect a custom domain in the R2 bucket settings; use the `r2.dev` development URL only for testing. Then set `R2_PUBLIC_URL` to that origin.

Create an R2 API token scoped to this bucket for the server upload adapter. Store the access key ID and secret only in the deployment environment—never in Git or browser JavaScript.

Suggested object keys:

- `products/<product-id>/<uuid>.<extension>`
- `colorways/<colorway-id>/<uuid>.<extension>`

The admin app should request a short-lived server-generated upload URL, upload directly to R2, then save the resulting object key and public URL in Supabase.

The implemented upload route is `POST /api/admin/uploads`. It requires a valid KMOS admin session, accepts JPG, PNG, WebP, and AVIF files up to 10 MB, and returns an R2 presigned PUT URL that expires after five minutes. `DELETE /api/admin/uploads` removes the object keys associated with a deleted product.
