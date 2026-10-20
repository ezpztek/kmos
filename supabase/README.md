# Supabase setup

The migration creates an empty KMOS catalog and applies Row Level Security to every exposed table.

1. Create a Supabase project.
2. Run `migrations/20261021000100_create_kmos_catalog.sql` in the SQL Editor or through the Supabase CLI.
3. In Supabase Authentication, create the administrator account.
4. Copy that account's UUID from `auth.users`, then run:

```sql
insert into public.admin_users (user_id)
values ('ADMIN_AUTH_USER_UUID');
```

5. Add the project URL and keys to the deployment environment. Keep the service-role key server-side only.

`reset.sql` deletes all categories, brands, products, sizes, colorways, and image metadata while preserving administrator access. It is intentionally not part of automatic migrations.

Images are not stored in Postgres. `product_images` and `colorway_images` hold the Cloudflare R2 object key and public delivery URL.
