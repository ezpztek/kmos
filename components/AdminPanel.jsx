"use client";

import { useEffect, useMemo, useState } from "react";
import { logoutAdmin } from "@/app/actions/admin";

const CATALOG_KEY = "kmos-admin-catalog-v2";
const LEGACY_CATALOG_KEY = "kmos-admin-catalog-v1";
const DEFAULT_CATEGORIES = ["KMOS EDIT", "K-PANTRY", "BEAUTY", "STYLE", "HOME", "ACCESSORIES", "DAILY ESSENTIALS"];
const DEFAULT_BRANDS = ["KMOS"];
const emptyProduct = {
  id: "", name: "", price: 0, description: "", category: "", brand: "", sortOrder: 1,
  placement: "popular", saleTag: "", limitedTag: "", ordersUntil: "", images: [], sizes: [],
  colorwayEnabled: false, colorways: [], status: "active"
};

const peso = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function cloneProduct(product) {
  return JSON.parse(JSON.stringify(product));
}

function PlacementBadge({ value }) {
  return <span className={`admin-placement ${value}`}>{value === "limited" ? "Limited stock" : value === "sale" ? "Sale" : "Popular now"}</span>;
}

function ImageEditor({ images, onChange, limit = 5, compact = false }) {
  const update = (index, key, value) => {
    let next = images.map((image, imageIndex) => imageIndex === index ? { ...image, [key]: value } : image);
    if (key === "role" && (value === "main" || value === "secondary")) {
      next = next.map((image, imageIndex) => imageIndex !== index && image.role === value ? { ...image, role: "gallery" } : image);
    }
    onChange(next);
  };
  const add = () => images.length < limit && onChange([...images, { url: "", role: images.length === 0 ? "main" : images.length === 1 ? "secondary" : "gallery" }]);
  const remove = (index) => onChange(images.filter((_, imageIndex) => imageIndex !== index));

  return (
    <div className={`admin-image-editor${compact ? " compact" : ""}`}>
      {images.map((image, index) => <div className="admin-image-row" key={index}>
        <span className="admin-image-preview">{image.url ? <img src={image.url} alt="" /> : index + 1}</span>
        <input type="url" value={image.url} placeholder="https://cdn.example.com/item.jpg" aria-label={`Image ${index + 1} URL`} onChange={(event) => update(index, "url", event.target.value)} />
        {!compact && <select value={image.role} aria-label={`Image ${index + 1} role`} onChange={(event) => update(index, "role", event.target.value)}><option value="main">Main</option><option value="secondary">Secondary</option><option value="gallery">Gallery</option></select>}
        <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => remove(index)}>×</button>
      </div>)}
      {images.length < limit && <button className="admin-add-row" type="button" onClick={add}>+ Add image URL <span>{images.length}/{limit}</span></button>}
    </div>
  );
}

function TaxonomyDialog({ type, onCancel, onSave }) {
  const [name, setName] = useState("");
  const submit = (event) => { event.preventDefault(); onSave(name.trim()); };
  return <div className="admin-editor-backdrop taxonomy" role="presentation"><form className="admin-taxonomy-dialog" onSubmit={submit}><p>CATALOG SETUP</p><h2>Add {type}</h2><label>{type} name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} required /></label><div><button type="button" onClick={onCancel}>Cancel</button><button className="primary" type="submit">Add {type}</button></div></form></div>;
}

function ProductEditor({ product, categories, brands, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => cloneProduct(product));
  const [sizeText, setSizeText] = useState(product.sizes.join(", "));
  const field = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateColorway = (index, key, value) => field("colorways", draft.colorways.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const removeColorway = (index) => field("colorways", draft.colorways.filter((_, itemIndex) => itemIndex !== index));

  const submit = (event) => {
    event.preventDefault();
    const sizes = sizeText.split(",").map((size) => size.trim()).filter(Boolean);
    onSave({ ...draft, id: draft.id || slugify(draft.name), price: Number(draft.price), sortOrder: Number(draft.sortOrder), sizes });
  };

  return (
    <div className="admin-editor-backdrop" role="presentation">
      <form className="admin-editor" onSubmit={submit} aria-labelledby="editor-title">
        <header className="admin-editor-header"><div><p>CATALOG ITEM</p><h2 id="editor-title">{product.id ? "Edit item" : "New item"}</h2></div><button type="button" aria-label="Close editor" onClick={onCancel}>×</button></header>
        <div className="admin-editor-body">
          <section className="admin-form-section"><div className="admin-section-title"><span>01</span><div><h3>Product details</h3><p>The information customers see on the product page.</p></div></div>
            <div className="admin-form-grid"><label className="wide">Item name<input value={draft.name} onChange={(event) => field("name", event.target.value)} required /></label><label>Price (PHP)<input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => field("price", event.target.value)} required /></label><label>Status<select value={draft.status} onChange={(event) => field("status", event.target.value)}><option value="active">Active</option><option value="draft">Draft</option><option value="hidden">Hidden</option></select></label><label className="wide">Description<textarea rows="4" value={draft.description} onChange={(event) => field("description", event.target.value)} required /></label><label>Category<select value={draft.category} onChange={(event) => field("category", event.target.value)} required><option value="" disabled>Select category</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label>Brand<select value={draft.brand} onChange={(event) => field("brand", event.target.value)} required><option value="" disabled>Select brand</option>{brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}</select></label></div>
          </section>

          <section className="admin-form-section"><div className="admin-section-title"><span>02</span><div><h3>Storefront position</h3><p>Choose the section and the order customers see first.</p></div></div>
            <div className="admin-form-grid"><label>Store section<select value={draft.placement} onChange={(event) => field("placement", event.target.value)}><option value="limited">Limited stock</option><option value="popular">Popular now</option><option value="sale">Sale</option></select></label><label>Sort order<input type="number" min="1" value={draft.sortOrder} onChange={(event) => field("sortOrder", event.target.value)} required /></label>
              {draft.placement === "sale" && <label className="wide">Sale tag<input value={draft.saleTag} placeholder="SALE · 20% OFF" onChange={(event) => field("saleTag", event.target.value)} /></label>}
              {draft.placement === "limited" && <><label>Limited-stock tag<input value={draft.limitedTag} placeholder="LOW STOCK" onChange={(event) => field("limitedTag", event.target.value)} /></label><label>Orders until<input type="date" value={draft.ordersUntil} onChange={(event) => field("ordersUntil", event.target.value)} /></label></>}
            </div>
          </section>

          <section className="admin-form-section"><div className="admin-section-title"><span>03</span><div><h3>Item images</h3><p>Add up to five R2 public URLs and choose the main and hover image.</p></div></div><ImageEditor images={draft.images} onChange={(images) => field("images", images)} /></section>

          <section className="admin-form-section"><div className="admin-section-title"><span>04</span><div><h3>Sizes</h3><p>Separate each available size with a comma.</p></div></div><label className="admin-single-field">Available sizes<input value={sizeText} placeholder="S, M, L, XL" onChange={(event) => setSizeText(event.target.value)} /></label></section>

          <section className="admin-form-section"><div className="admin-section-title"><span>05</span><div><h3>Colorways</h3><p>Optional color variants, each with up to three image URLs.</p></div></div>
            <label className="admin-toggle"><input type="checkbox" checked={draft.colorwayEnabled} onChange={(event) => field("colorwayEnabled", event.target.checked)} /><span /><strong>Activate colorways</strong></label>
            {draft.colorwayEnabled && <div className="admin-colorways">{draft.colorways.map((colorway, index) => <article className="admin-colorway" key={index}><div className="admin-colorway-head"><label>Colorway name<input value={colorway.name} placeholder="Forest" onChange={(event) => updateColorway(index, "name", event.target.value)} required /></label><label>Color<input type="color" value={colorway.color} onChange={(event) => updateColorway(index, "color", event.target.value)} /></label><button type="button" onClick={() => removeColorway(index)}>Remove</button></div><ImageEditor compact limit={3} images={colorway.images} onChange={(images) => updateColorway(index, "images", images)} /></article>)}<button className="admin-add-colorway" type="button" onClick={() => field("colorways", [...draft.colorways, { name: "", color: "#347362", images: [] }])}>+ Add colorway</button></div>}
          </section>
        </div>
        <footer className="admin-editor-footer"><button type="button" onClick={onCancel}>Cancel</button><button className="primary" type="submit">Save item</button></footer>
      </form>
    </div>
  );
}

export default function AdminPanel({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState(DEFAULT_BRANDS);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("all");
  const [notice, setNotice] = useState("");
  const [taxonomyDialog, setTaxonomyDialog] = useState("");

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_CATALOG_KEY);
      const stored = JSON.parse(localStorage.getItem(CATALOG_KEY));
      if (stored && Array.isArray(stored.products)) setProducts(stored.products);
      if (stored && Array.isArray(stored.categories)) setCategories(stored.categories);
      if (stored && Array.isArray(stored.brands)) setBrands(stored.brands);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => { if (ready) localStorage.setItem(CATALOG_KEY, JSON.stringify({ products, categories, brands })); }, [brands, categories, products, ready]);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.name} ${product.category} ${product.brand}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (placement === "all" || product.placement === placement);
  }).sort((left, right) => left.sortOrder - right.sortOrder), [placement, products, search]);

  const save = (product) => {
    setProducts((current) => current.some((item) => item.id === product.id) ? current.map((item) => item.id === product.id ? product : item) : [...current, product]);
    setEditing(null);
    setNotice(`${product.name} saved to this browser draft.`);
  };

  const saveTaxonomy = (name) => {
    if (!name) return;
    const normalized = name.toUpperCase();
    if (taxonomyDialog === "category") setCategories((current) => [...new Set([...current, normalized])].sort());
    if (taxonomyDialog === "brand") setBrands((current) => [...new Set([...current, name])].sort((left, right) => left.localeCompare(right)));
    setNotice(`${name} added as a ${taxonomyDialog}.`);
    setTaxonomyDialog("");
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar"><a className="admin-logo" href="/"><img src="/assets/kmos-logo.png" alt="" /><span><strong>KMOS</strong><small>ADMIN</small></span></a><nav><a className="active" href="#catalog"><span>◫</span>Catalog</a><a href="#storage"><span>⌁</span>Storage</a></nav><div className="admin-sidebar-foot"><a href="/" target="_blank">View store ↗</a><form action={logoutAdmin}><button type="submit">Sign out</button></form></div></aside>
      <section className="admin-workspace" id="catalog"><header className="admin-topbar"><div><p>STORE MANAGEMENT</p><h1>Catalog</h1></div><div className="admin-sync"><i />Local draft</div></header>
        <div className="admin-overview"><div><span>Total items</span><strong>{products.length}</strong><small>in your catalog</small></div><div><span>Active</span><strong>{products.filter((item) => item.status === "active").length}</strong><small>visible items</small></div><div><span>Limited stock</span><strong>{products.filter((item) => item.placement === "limited").length}</strong><small>priority products</small></div><div><span>On sale</span><strong>{products.filter((item) => item.placement === "sale").length}</strong><small>marked down</small></div></div>
        <section className="admin-catalog-card"><div className="admin-catalog-toolbar"><div><h2>All items</h2><p>Manage product details, display order, variants, and images.</p></div><div className="admin-catalog-actions"><button type="button" onClick={() => setTaxonomyDialog("category")}>+ Category</button><button type="button" onClick={() => setTaxonomyDialog("brand")}>+ Brand</button><button className="admin-new-button" type="button" onClick={() => setEditing(cloneProduct(emptyProduct))}>+ Add item</button></div></div>
          <div className="admin-filters"><label><span>⌕</span><input type="search" value={search} placeholder="Search items, categories, or brands" onChange={(event) => setSearch(event.target.value)} /></label><select value={placement} onChange={(event) => setPlacement(event.target.value)}><option value="all">All storefront sections</option><option value="limited">Limited stock</option><option value="popular">Popular now</option><option value="sale">Sale</option></select></div>
          {notice && <p className="admin-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>×</button></p>}
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Item</th><th>Price</th><th>Category / brand</th><th>Placement</th><th>Sort</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((product) => <tr key={product.id}><td><div className="admin-product-cell"><span style={{ "--tile": product.colorways[0]?.color ?? "#ead6b9" }}>{product.images[0]?.url ? <img src={product.images[0].url} alt="" /> : product.name.slice(0, 2).toUpperCase()}</span><div><strong>{product.name}</strong><small>{product.description}</small></div></div></td><td>{peso.format(product.price)}</td><td><strong>{product.category}</strong><small>{product.brand}</small></td><td><PlacementBadge value={product.placement} />{product.placement === "sale" && product.saleTag && <small>{product.saleTag}</small>}{product.placement === "limited" && product.ordersUntil && <small>Until {product.ordersUntil}</small>}</td><td><b>#{product.sortOrder}</b></td><td><span className={`admin-status ${product.status}`}>{product.status}</span></td><td><button className="admin-edit-button" type="button" onClick={() => setEditing(cloneProduct(product))}>Edit</button></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-empty">No catalog items match these filters.</div>}</div>
        </section>
        <section className="admin-storage-card" id="storage"><div><p>DATA CONNECTIONS</p><h2>Ready for Supabase + R2</h2><span>The interface is using a local browser draft. Connect the server adapters next to save products in Supabase and upload images directly to Cloudflare R2.</span></div><div className="admin-connection-list"><span><i />Supabase database <b>Not connected</b></span><span><i />Cloudflare R2 <b>Not connected</b></span></div></section>
      </section>
      {editing && <ProductEditor product={editing} categories={categories} brands={brands} onCancel={() => setEditing(null)} onSave={save} />}
      {taxonomyDialog && <TaxonomyDialog type={taxonomyDialog} onCancel={() => setTaxonomyDialog("")} onSave={saveTaxonomy} />}
    </main>
  );
}
