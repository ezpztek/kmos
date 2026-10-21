"use client";

import { useEffect, useMemo, useState } from "react";
import { logoutAdmin } from "@/app/actions/admin";

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

function imagePreviewUrl(image) {
  return image.objectKey ? `/api/images/${image.objectKey.split("/").map(encodeURIComponent).join("/")}` : image.url;
}

function PlacementBadge({ value }) {
  return <span className={`admin-placement ${value}`}>{value === "limited" ? "Limited stock" : value === "sale" ? "Sale" : "Popular now"}</span>;
}

function statusLabel(value) {
  return value === "draft" ? "Not Available" : value === "hidden" ? "Hidden" : "Active";
}

function ImageEditor({ images, onChange, ownerId, scope = "products", limit = 5, compact = false }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const update = (index, key, value) => {
    let next = images.map((image, imageIndex) => imageIndex === index ? { ...image, [key]: value } : image);
    if (key === "role" && (value === "main" || value === "secondary")) {
      next = next.map((image, imageIndex) => imageIndex !== index && image.role === value ? { ...image, role: "gallery" } : image);
    }
    onChange(next);
  };
  const remove = (index) => onChange(images.filter((_, imageIndex) => imageIndex !== index));

  const uploadFiles = async (event) => {
    const files = [...event.target.files].slice(0, limit - images.length);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("scope", scope);
        formData.append("ownerId", ownerId);
        const uploadResponse = await fetch("/api/admin/uploads", {
          method: "POST",
          body: formData
        });
        const upload = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(upload.error || `Could not upload ${file.name}.`);
        const position = images.length + uploaded.length;
        uploaded.push({ name: file.name, url: upload.publicUrl, objectKey: upload.objectKey, role: compact ? "gallery" : position === 0 ? "main" : position === 1 ? "secondary" : "gallery" });
      }
      onChange([...images, ...uploaded]);
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`admin-image-editor${compact ? " compact" : ""}`}>
      {images.map((image, index) => <div className="admin-image-row" key={image.objectKey ?? index}>
        <span className="admin-image-preview">{image.url ? <img src={imagePreviewUrl(image)} alt="" /> : index + 1}</span>
        <span className="admin-image-name" title={image.name ?? image.objectKey}>{image.name ?? image.objectKey ?? `Image ${index + 1}`}</span>
        {!compact && <select value={image.role} aria-label={`Image ${index + 1} role`} onChange={(event) => update(index, "role", event.target.value)}><option value="main">Main</option><option value="secondary">Secondary</option><option value="gallery">Gallery</option></select>}
        <button type="button" aria-label={`Remove image ${index + 1}`} onClick={() => remove(index)}>×</button>
      </div>)}
      {images.length < limit && <label className={`admin-upload-button${uploading ? " disabled" : ""}`}><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple={limit - images.length > 1} disabled={uploading} onChange={uploadFiles} /><span>{uploading ? "Uploading to R2…" : "+ Upload from device"}</span><b>{images.length}/{limit}</b></label>}
      {error && <p className="admin-upload-error" role="alert">{error}</p>}
    </div>
  );
}

function TaxonomyDialog({ type, onCancel, onSave }) {
  const [name, setName] = useState("");
  const submit = (event) => { event.preventDefault(); onSave(name.trim()); };
  return <div className="admin-editor-backdrop taxonomy" role="presentation"><form className="admin-taxonomy-dialog" onSubmit={submit}><p>CATALOG SETUP</p><h2>Add {type}</h2><label>{type} name<input autoFocus value={name} onChange={(event) => setName(event.target.value)} required /></label><div><button type="button" onClick={onCancel}>Cancel</button><button className="primary" type="submit">Add {type}</button></div></form></div>;
}

function DeleteDialog({ product, busy, onCancel, onConfirm }) {
  return <div className="admin-editor-backdrop taxonomy" role="presentation"><section className="admin-taxonomy-dialog admin-delete-dialog" role="dialog" aria-modal="true" aria-labelledby="delete-item-title"><p>DELETE ITEM</p><h2 id="delete-item-title">Remove {product.name}?</h2><span>This removes the catalog item and related records from Supabase, then requests deletion of its uploaded R2 images. This action cannot be undone.</span><div><button type="button" disabled={busy} onClick={onCancel}>Cancel</button><button className="danger" type="button" disabled={busy} onClick={onConfirm}>{busy ? "Deleting…" : "Delete item"}</button></div></section></div>;
}

function ProductEditor({ product, categories, brands, onCancel, onSave }) {
  const [draft, setDraft] = useState(() => cloneProduct(product));
  const [ownerId] = useState(() => product.id || crypto.randomUUID());
  const [sizeDraft, setSizeDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const field = (key, value) => setDraft((current) => ({ ...current, [key]: value }));
  const updateColorway = (index, key, value) => field("colorways", draft.colorways.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const removeColorway = (index) => field("colorways", draft.colorways.filter((_, itemIndex) => itemIndex !== index));
  const addSize = () => {
    const size = sizeDraft.trim();
    if (!size || draft.sizes.some((item) => item.toLowerCase() === size.toLowerCase())) return;
    field("sizes", [...draft.sizes, size]);
    setSizeDraft("");
  };
  const removeSize = (index) => field("sizes", draft.sizes.filter((_, itemIndex) => itemIndex !== index));

  const submit = async (event) => {
    event.preventDefault();
    if (!draft.sizes.length) { setFormError("Add at least one available size."); return; }
    setFormError("");
    setSaving(true);
    try {
      await onSave({ ...draft, id: draft.id || slugify(draft.name), price: Number(draft.price), sortOrder: Number(draft.sortOrder) });
    } catch (saveError) {
      setFormError(saveError.message || "Could not save this item.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-editor-backdrop" role="presentation">
      <form className="admin-editor" onSubmit={submit} aria-labelledby="editor-title">
        <header className="admin-editor-header"><div><p>CATALOG ITEM</p><h2 id="editor-title">{product.id ? "Edit item" : "New item"}</h2></div><button type="button" aria-label="Close editor" onClick={onCancel}>×</button></header>
        <div className="admin-editor-body">
          <section className="admin-form-section"><div className="admin-section-title"><span>01</span><div><h3>Product details</h3><p>The information customers see on the product page.</p></div></div>
            <div className="admin-form-grid"><label className="wide">Item name<input value={draft.name} onChange={(event) => field("name", event.target.value)} required /></label><label>Price (PHP)<input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => field("price", event.target.value)} required /></label><label>Status<select value={draft.status} onChange={(event) => field("status", event.target.value)}><option value="active">Active</option><option value="draft">Not Available</option><option value="hidden">Hidden</option></select></label><label className="wide">Description<textarea rows="4" value={draft.description} onChange={(event) => field("description", event.target.value)} required /></label><label>Category<select value={draft.category} onChange={(event) => field("category", event.target.value)} required><option value="" disabled>Select category</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label><label>Brand<select value={draft.brand} onChange={(event) => field("brand", event.target.value)} required><option value="" disabled>Select brand</option>{brands.map((brand) => <option value={brand} key={brand}>{brand}</option>)}</select></label></div>
          </section>

          <section className="admin-form-section"><div className="admin-section-title"><span>02</span><div><h3>Storefront position</h3><p>Choose the section and the order customers see first.</p></div></div>
            <div className="admin-form-grid"><label>Store section<select value={draft.placement} onChange={(event) => field("placement", event.target.value)}><option value="limited">Limited stock</option><option value="popular">Popular now</option><option value="sale">Sale</option></select></label><label>Sort order<input type="number" min="1" value={draft.sortOrder} onChange={(event) => field("sortOrder", event.target.value)} required /></label>
              {draft.placement === "sale" && <label className="wide">Sale tag<input value={draft.saleTag} placeholder="SALE · 20% OFF" onChange={(event) => field("saleTag", event.target.value)} /></label>}
              {draft.placement === "limited" && <><label>Limited-stock tag<input value={draft.limitedTag} placeholder="LOW STOCK" onChange={(event) => field("limitedTag", event.target.value)} /></label><label>Orders until<input type="date" value={draft.ordersUntil} onChange={(event) => field("ordersUntil", event.target.value)} /></label></>}
            </div>
          </section>

          <section className="admin-form-section"><div className="admin-section-title"><span>03</span><div><h3>Item images</h3><p>Upload up to five images from this device, then choose the main and hover image.</p></div></div><ImageEditor ownerId={ownerId} images={draft.images} onChange={(images) => field("images", images)} /></section>

          <section className="admin-form-section"><div className="admin-section-title"><span>04</span><div><h3>Sizes</h3><p>Add each customer-selectable size separately.</p></div></div><div className="admin-size-builder"><div className="admin-size-entry"><label>New size<input value={sizeDraft} placeholder="Example: M or 30 ml" onChange={(event) => setSizeDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addSize(); } }} /></label><button type="button" onClick={addSize}>Add size</button></div><div className="admin-size-list">{draft.sizes.map((size, index) => <span key={`${size}-${index}`}>{size}<button type="button" aria-label={`Remove size ${size}`} onClick={() => removeSize(index)}>×</button></span>)}{!draft.sizes.length && <p>No sizes added yet.</p>}</div></div></section>

          <section className="admin-form-section"><div className="admin-section-title"><span>05</span><div><h3>Colorways</h3><p>Optional color variants, each with up to three image URLs.</p></div></div>
            <label className="admin-toggle"><input type="checkbox" checked={draft.colorwayEnabled} onChange={(event) => field("colorwayEnabled", event.target.checked)} /><span /><strong>Activate colorways</strong></label>
            {draft.colorwayEnabled && <div className="admin-colorways">{draft.colorways.map((colorway, index) => <article className="admin-colorway" key={index}><div className="admin-colorway-head"><label>Colorway name<input value={colorway.name} placeholder="Forest" onChange={(event) => updateColorway(index, "name", event.target.value)} required /></label><label>Color<input type="color" value={colorway.color} onChange={(event) => updateColorway(index, "color", event.target.value)} /></label><button type="button" onClick={() => removeColorway(index)}>Remove</button></div><ImageEditor compact scope="colorways" ownerId={`${ownerId}-${index}`} limit={3} images={colorway.images} onChange={(images) => updateColorway(index, "images", images)} /></article>)}<button className="admin-add-colorway" type="button" onClick={() => field("colorways", [...draft.colorways, { name: "", color: "#347362", images: [] }])}>+ Add colorway</button></div>}
          </section>
        </div>
        <footer className="admin-editor-footer">{formError && <p className="admin-editor-error" role="alert">{formError}</p>}<button type="button" disabled={saving} onClick={onCancel}>Cancel</button><button className="primary" type="submit" disabled={saving}>{saving ? "Saving to Supabase…" : "Save item"}</button></footer>
      </form>
    </div>
  );
}

export default function AdminPanel({ initialProducts }) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [databaseConnected, setDatabaseConnected] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [placement, setPlacement] = useState("all");
  const [notice, setNotice] = useState("");
  const [taxonomyDialog, setTaxonomyDialog] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/admin/catalog", { cache: "no-store" });
        const catalog = await response.json();
        if (!response.ok) throw new Error(catalog.error || "Could not load the Supabase catalog.");
        if (cancelled) return;
        setProducts(catalog.products ?? []);
        setCategories(catalog.categories ?? []);
        setBrands(catalog.brands ?? []);
        setDatabaseConnected(true);
      } catch (loadError) {
        if (!cancelled) setNotice(loadError.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.name} ${product.category} ${product.brand}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (placement === "all" || product.placement === placement);
  }).sort((left, right) => Number(left.status === "draft") - Number(right.status === "draft") || left.sortOrder - right.sortOrder), [placement, products, search]);

  const save = async (product) => {
    const response = await fetch("/api/admin/catalog", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(product)
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not save the item to Supabase.");
    const saved = result.product;
    setProducts((current) => current.some((item) => item.databaseId === saved.databaseId) ? current.map((item) => item.databaseId === saved.databaseId ? saved : item) : [...current, saved]);
    setCategories((current) => [...new Set([...current, saved.category])].sort());
    setBrands((current) => [...new Set([...current, saved.brand])].sort((left, right) => left.localeCompare(right)));
    setEditing(null);
    setDatabaseConnected(true);
    setNotice(`${saved.name} saved to Supabase.`);
  };

  const saveTaxonomy = async (name) => {
    if (!name) return;
    try {
      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ type: taxonomyDialog, name })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || `Could not save the ${taxonomyDialog}.`);
      if (taxonomyDialog === "category") setCategories((current) => [...new Set([...current, result.name])].sort());
      if (taxonomyDialog === "brand") setBrands((current) => [...new Set([...current, result.name])].sort((left, right) => left.localeCompare(right)));
      setNotice(`${result.name} added to Supabase as a ${taxonomyDialog}.`);
      setDatabaseConnected(true);
      setTaxonomyDialog("");
    } catch (taxonomyError) {
      setNotice(taxonomyError.message);
    }
  };

  const deleteProduct = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/admin/catalog", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: pendingDelete.databaseId || pendingDelete.id }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not delete the item from Supabase.");
      setProducts((current) => current.filter((product) => product.databaseId !== pendingDelete.databaseId));
      setNotice(`${pendingDelete.name} deleted from Supabase.${result.cleanupWarning ? ` ${result.cleanupWarning}` : ""}`);
      setPendingDelete(null);
    } catch (deleteError) {
      setNotice(deleteError.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar"><a className="admin-logo" href="/"><img src="/assets/kmos-logo.png" alt="" /><span><strong>KMOS</strong><small>ADMIN</small></span></a><nav><a className="active" href="#catalog"><span>◫</span>Catalog</a></nav><div className="admin-sidebar-foot"><a href="/" target="_blank">View store ↗</a><form action={logoutAdmin}><button type="submit">Sign out</button></form></div></aside>
      <section className="admin-workspace" id="catalog"><header className="admin-topbar"><div><p>STORE MANAGEMENT</p><h1>Catalog</h1></div><div className="admin-sync"><i />{loading ? "Connecting…" : databaseConnected ? "Supabase connected" : "Database unavailable"}</div></header>
        <div className="admin-overview"><div><span>Total items</span><strong>{products.length}</strong><small>in your catalog</small></div><div><span>Active</span><strong>{products.filter((item) => item.status === "active").length}</strong><small>available items</small></div><div><span>Limited stock</span><strong>{products.filter((item) => item.placement === "limited").length}</strong><small>priority products</small></div><div><span>On sale</span><strong>{products.filter((item) => item.placement === "sale").length}</strong><small>marked down</small></div></div>
        <section className="admin-catalog-card"><div className="admin-catalog-toolbar"><div><h2>All items</h2><p>Manage product details, display order, variants, and images.</p></div><div className="admin-catalog-actions"><button type="button" onClick={() => setTaxonomyDialog("category")}>+ Category</button><button type="button" onClick={() => setTaxonomyDialog("brand")}>+ Brand</button><button className="admin-new-button" type="button" onClick={() => setEditing(cloneProduct(emptyProduct))}>+ Add item</button></div></div>
          <div className="admin-filters"><label><span>⌕</span><input type="search" value={search} placeholder="Search items, categories, or brands" onChange={(event) => setSearch(event.target.value)} /></label><select value={placement} onChange={(event) => setPlacement(event.target.value)}><option value="all">All storefront sections</option><option value="limited">Limited stock</option><option value="popular">Popular now</option><option value="sale">Sale</option></select></div>
          {notice && <p className="admin-notice" role="status">{notice}<button type="button" onClick={() => setNotice("")}>×</button></p>}
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Item</th><th>Price</th><th>Category / brand</th><th>Placement</th><th>Sort</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{filtered.map((product) => <tr key={product.databaseId ?? product.id}><td><div className="admin-product-cell"><span style={{ "--tile": product.colorways[0]?.color ?? "#ead6b9" }}>{product.images[0]?.url ? <img src={imagePreviewUrl(product.images[0])} alt="" /> : product.name.slice(0, 2).toUpperCase()}</span><div><strong>{product.name}</strong><small>{product.description}</small></div></div></td><td>{peso.format(product.price)}</td><td><strong>{product.category}</strong><small>{product.brand}</small></td><td><PlacementBadge value={product.placement} />{product.placement === "sale" && product.saleTag && <small>{product.saleTag}</small>}{product.placement === "limited" && product.ordersUntil && <small>Until {product.ordersUntil}</small>}</td><td><b>#{product.sortOrder}</b></td><td><span className={`admin-status ${product.status}`}>{statusLabel(product.status)}</span></td><td><div className="admin-row-actions"><button className="admin-edit-button" type="button" onClick={() => setEditing(cloneProduct(product))}>Edit</button><button className="admin-delete-button" type="button" onClick={() => setPendingDelete(product)}>Delete</button></div></td></tr>)}</tbody></table>{!filtered.length && <div className="admin-empty">{loading ? "Loading catalog from Supabase…" : "No catalog items match these filters."}</div>}</div>
        </section>
      </section>
      {editing && <ProductEditor product={editing} categories={categories} brands={brands} onCancel={() => setEditing(null)} onSave={save} />}
      {taxonomyDialog && <TaxonomyDialog type={taxonomyDialog} onCancel={() => setTaxonomyDialog("")} onSave={saveTaxonomy} />}
      {pendingDelete && <DeleteDialog product={pendingDelete} busy={deleting} onCancel={() => setPendingDelete(null)} onConfirm={deleteProduct} />}
    </main>
  );
}
