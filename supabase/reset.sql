-- Destructive development reset for KMOS application data.
-- Run manually in the Supabase SQL Editor only when a full catalog reset is intended.
truncate table
  public.colorway_images,
  public.colorways,
  public.product_images,
  public.product_sizes,
  public.products,
  public.categories,
  public.brands
restart identity cascade;

-- admin_users is intentionally preserved so administrators do not lose access.
