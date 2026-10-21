import "server-only";

function configuration() {
  return {
    url: process.env.SUPABASE_URL?.replace(/\/$/, ""),
    key: process.env.SUPABASE_SERVICE_ROLE_KEY
  };
}

export function supabaseConfigured() {
  const { url, key } = configuration();
  return Boolean(url && key);
}

function slugify(value) {
  return String(value ?? "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value ?? "");
}

async function request(path, { method = "GET", body, prefer } = {}) {
  const { url, key } = configuration();
  if (!url || !key) throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY, then restart the server.");

  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    cache: "no-store",
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(prefer ? { prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  if (!response.ok) {
    let details = "";
    try {
      const payload = await response.json();
      details = payload.message || payload.details || payload.hint || "";
    } catch {
      details = await response.text();
    }
    throw new Error(details || `Supabase request failed with status ${response.status}.`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

function queryValue(value) {
  return encodeURIComponent(String(value));
}

async function selectRows(table, filters = "") {
  return request(`${table}?select=*${filters}`);
}

function mapCatalog({ categoryRows, brandRows, productRows, sizeRows, imageRows, colorwayRows, colorwayImageRows }) {
  const categoryNames = new Map(categoryRows.map((row) => [row.id, row.name]));
  const brandNames = new Map(brandRows.map((row) => [row.id, row.name]));
  const sizesByProduct = new Map();
  const imagesByProduct = new Map();
  const colorwaysByProduct = new Map();
  const imagesByColorway = new Map();

  for (const row of sizeRows) {
    if (!sizesByProduct.has(row.product_id)) sizesByProduct.set(row.product_id, []);
    sizesByProduct.get(row.product_id).push(row);
  }
  for (const row of imageRows) {
    if (!imagesByProduct.has(row.product_id)) imagesByProduct.set(row.product_id, []);
    imagesByProduct.get(row.product_id).push(row);
  }
  for (const row of colorwayImageRows) {
    if (!imagesByColorway.has(row.colorway_id)) imagesByColorway.set(row.colorway_id, []);
    imagesByColorway.get(row.colorway_id).push(row);
  }
  for (const row of colorwayRows) {
    if (!colorwaysByProduct.has(row.product_id)) colorwaysByProduct.set(row.product_id, []);
    colorwaysByProduct.get(row.product_id).push(row);
  }

  const mapImage = (row) => ({
    databaseId: row.id,
    name: row.alt_text || row.object_key.split("/").pop(),
    url: row.public_url,
    objectKey: row.object_key,
    ...(row.role ? { role: row.role } : {})
  });

  const products = productRows.map((row) => ({
    id: row.slug,
    databaseId: row.id,
    name: row.name,
    price: Number(row.price),
    description: row.description,
    category: categoryNames.get(row.category_id) ?? "",
    brand: brandNames.get(row.brand_id) ?? "",
    sortOrder: row.sort_order,
    placement: row.placement,
    saleTag: row.sale_tag ?? "",
    limitedTag: row.limited_tag ?? "",
    ordersUntil: row.orders_until ?? "",
    status: row.status,
    colorwayEnabled: row.colorway_enabled,
    sizes: (sizesByProduct.get(row.id) ?? []).sort((a, b) => a.sort_order - b.sort_order).map((size) => size.name),
    images: (imagesByProduct.get(row.id) ?? []).sort((a, b) => a.sort_order - b.sort_order).map(mapImage),
    colorways: (colorwaysByProduct.get(row.id) ?? []).sort((a, b) => a.sort_order - b.sort_order).map((colorway) => ({
      databaseId: colorway.id,
      name: colorway.name,
      color: colorway.color_hex,
      images: (imagesByColorway.get(colorway.id) ?? []).sort((a, b) => a.sort_order - b.sort_order).map(mapImage)
    }))
  }));

  return {
    products,
    categories: categoryRows.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)).map((row) => row.name),
    brands: brandRows.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)).map((row) => row.name)
  };
}

export async function loadCatalog({ publicOnly = false } = {}) {
  const [categoryRows, brandRows, productRows] = await Promise.all([
    selectRows("categories", publicOnly ? "&active=eq.true" : ""),
    selectRows("brands", publicOnly ? "&active=eq.true" : ""),
    selectRows("products", publicOnly ? "&status=in.(active,draft)" : "")
  ]);

  const productIds = productRows.map((row) => row.id);
  if (!productIds.length) return mapCatalog({ categoryRows, brandRows, productRows, sizeRows: [], imageRows: [], colorwayRows: [], colorwayImageRows: [] });
  const productFilter = `&product_id=in.(${productIds.join(",")})`;
  const [sizeRows, imageRows, colorwayRows] = await Promise.all([
    selectRows("product_sizes", productFilter),
    selectRows("product_images", productFilter),
    selectRows("colorways", productFilter)
  ]);
  const colorwayIds = colorwayRows.map((row) => row.id);
  const colorwayImageRows = colorwayIds.length ? await selectRows("colorway_images", `&colorway_id=in.(${colorwayIds.join(",")})`) : [];
  return mapCatalog({ categoryRows, brandRows, productRows, sizeRows, imageRows, colorwayRows, colorwayImageRows });
}

async function ensureTaxonomy(table, name) {
  const cleanName = String(name ?? "").trim();
  const slug = slugify(cleanName);
  if (!cleanName || !slug) throw new Error(`Choose a valid ${table === "categories" ? "category" : "brand"}.`);
  const rows = await request(`${table}?on_conflict=slug`, {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: [{ name: cleanName, slug, active: true }]
  });
  return rows[0];
}

export async function saveTaxonomy(type, name) {
  if (!new Set(["category", "brand"]).has(type)) throw new Error("Unsupported catalog type.");
  return ensureTaxonomy(type === "category" ? "categories" : "brands", name);
}

function validateProduct(product) {
  if (!String(product.name ?? "").trim()) throw new Error("Item name is required.");
  if (!String(product.description ?? "").trim()) throw new Error("Item description is required.");
  if (!Number.isFinite(Number(product.price)) || Number(product.price) < 0) throw new Error("Enter a valid item price.");
  if (!Array.isArray(product.sizes) || !product.sizes.length) throw new Error("Add at least one available size.");
  if (!new Set(["limited", "popular", "sale"]).has(product.placement)) throw new Error("Choose a valid storefront section.");
  if (!new Set(["draft", "active", "hidden"]).has(product.status)) throw new Error("Choose a valid item status.");
  if ((product.images ?? []).length > 5) throw new Error("An item can have at most five images.");
  if ((product.colorways ?? []).some((colorway) => (colorway.images ?? []).length > 3)) throw new Error("A colorway can have at most three images.");
}

async function insertRows(table, rows) {
  if (!rows.length) return [];
  return request(table, { method: "POST", prefer: "return=representation", body: rows });
}

export async function saveProduct(product) {
  validateProduct(product);
  const [category, brand] = await Promise.all([
    ensureTaxonomy("categories", product.category),
    ensureTaxonomy("brands", product.brand)
  ]);
  const slug = slugify(product.id || product.name);
  if (!slug) throw new Error("The item name must create a valid URL slug.");
  const productRow = {
    ...(isUuid(product.databaseId) ? { id: product.databaseId } : {}),
    slug,
    name: product.name.trim(),
    price: Number(product.price),
    description: product.description.trim(),
    category_id: category.id,
    brand_id: brand.id,
    sort_order: Math.max(0, Number(product.sortOrder) || 0),
    placement: product.placement,
    sale_tag: product.placement === "sale" ? product.saleTag?.trim() || null : null,
    limited_tag: product.placement === "limited" ? product.limitedTag?.trim() || null : null,
    orders_until: product.placement === "limited" ? product.ordersUntil || null : null,
    status: product.status,
    colorway_enabled: Boolean(product.colorwayEnabled)
  };
  const savedRows = await request("products?on_conflict=slug", {
    method: "POST",
    prefer: "resolution=merge-duplicates,return=representation",
    body: [productRow]
  });
  const saved = savedRows[0];

  await Promise.all([
    request(`product_sizes?product_id=eq.${queryValue(saved.id)}`, { method: "DELETE" }),
    request(`product_images?product_id=eq.${queryValue(saved.id)}`, { method: "DELETE" }),
    request(`colorways?product_id=eq.${queryValue(saved.id)}`, { method: "DELETE" })
  ]);

  await Promise.all([
    insertRows("product_sizes", product.sizes.map((name, index) => ({ product_id: saved.id, name: String(name).trim(), sort_order: index }))),
    insertRows("product_images", (product.images ?? []).map((image, index) => ({
      product_id: saved.id,
      object_key: image.objectKey,
      public_url: image.url || `/api/images/${image.objectKey}`,
      role: image.role || "gallery",
      sort_order: index,
      alt_text: image.name || product.name
    })))
  ]);

  if (product.colorwayEnabled && product.colorways?.length) {
    const savedColorways = await insertRows("colorways", product.colorways.map((colorway, index) => ({
      product_id: saved.id,
      name: colorway.name.trim(),
      color_hex: colorway.color,
      sort_order: index
    })));
    const colorwayImages = savedColorways.flatMap((colorway) => {
      const source = product.colorways[colorway.sort_order];
      return (source?.images ?? []).map((image, index) => ({
        colorway_id: colorway.id,
        object_key: image.objectKey,
        public_url: image.url || `/api/images/${image.objectKey}`,
        sort_order: index,
        alt_text: image.name || `${product.name} - ${source.name}`
      }));
    });
    await insertRows("colorway_images", colorwayImages);
  }

  const catalog = await loadCatalog();
  return catalog.products.find((item) => item.databaseId === saved.id);
}

export async function deleteProduct(identifier) {
  const filter = isUuid(identifier) ? `id=eq.${queryValue(identifier)}` : `slug=eq.${queryValue(identifier)}`;
  const rows = await selectRows("products", `&${filter}`);
  const product = rows[0];
  if (!product) throw new Error("Catalog item was not found.");
  const productImages = await selectRows("product_images", `&product_id=eq.${queryValue(product.id)}`);
  const colorways = await selectRows("colorways", `&product_id=eq.${queryValue(product.id)}`);
  const colorwayImages = colorways.length
    ? await selectRows("colorway_images", `&colorway_id=in.(${colorways.map((row) => row.id).join(",")})`)
    : [];
  await request(`products?id=eq.${queryValue(product.id)}`, { method: "DELETE" });
  return [...productImages, ...colorwayImages].map((row) => row.object_key);
}
