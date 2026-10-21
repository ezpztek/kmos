"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { money, productGroups, products } from "@/lib/products";

const CART_KEY = "kmos-cart-v1";
const seedProducts = Object.fromEntries(Object.entries(products).map(([id, product]) => [id, product]));
const seedGroups = Object.fromEntries(Object.entries(productGroups).map(([name, ids]) => [name, [...ids]]));
const shortDate = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" });

function resetCatalog() {
  for (const id of Object.keys(products)) delete products[id];
  Object.assign(products, seedProducts);
  for (const name of Object.keys(productGroups)) productGroups[name] = [...seedGroups[name]];
}

function applyCatalog(catalog) {
  try {
    if (!catalog?.products || !Array.isArray(catalog.products)) { resetCatalog(); return; }
    const mapped = {};
    const groups = { limited: [], popular: [], sale: [] };
    catalog.products.filter((item) => item.status === "active" || item.status === "draft").sort((left, right) => Number(left.status === "draft") - Number(right.status === "draft") || left.sortOrder - right.sortOrder).forEach((item) => {
      const fallback = seedProducts[item.id] ?? {};
      const colorways = item.colorwayEnabled && item.colorways?.length ? item.colorways : [];
      const colors = colorways.length
        ? colorways.map((colorway) => [colorway.name || "Default", "art-cream", colorway.color || "#e9d6b9"])
        : fallback.colors ?? [["Default", "art-cream", "#e9d6b9"]];
      mapped[item.id] = {
        ...fallback,
        category: `${item.category}${item.placement === "sale" ? " · SALE" : ""}`,
        brand: item.brand,
        name: item.name,
        price: Number(item.price),
        description: item.description,
        saleTag: item.saleTag || "",
        ordersUntil: item.ordersUntil || "",
        status: item.status,
        notAvailable: item.status === "draft",
        sizes: item.sizes?.length ? item.sizes : ["One Size"],
        views: fallback.views ?? ["tote", "pouch"],
        colors,
        images: (item.images ?? []).filter((image) => image.url),
        colorways
      };
      if (groups[item.placement]) groups[item.placement].push(item.id);
    });
    for (const id of Object.keys(products)) delete products[id];
    Object.assign(products, mapped);
    for (const name of Object.keys(productGroups)) productGroups[name] = groups[name];
  } catch { resetCatalog(); }
}

function limitedStockTag(product, index) {
  if (!product.ordersUntil) return index % 2 ? "FEW LEFT" : "LOW STOCK";
  return `ACCEPTING ORDERS UNTIL ${shortDate.format(new Date(`${product.ordersUntil}T00:00:00+08:00`)).toUpperCase()}`;
}

function Visual({ view }) {
  if (view === "tote") return <span className="object tote">KM</span>;
  if (view === "pouch") return <span className="object tote">K</span>;
  if (view === "cap") return <span className="object cap">K</span>;
  if (view === "glow") return <><span className="object bottle">K</span><span className="object tube" /></>;
  if (view === "bottle") return <span className="object bottle">K</span>;
  if (view === "pantry") return <><span className="object box">K!</span><span className="object cup" /></>;
  if (view === "cup") return <span className="object cup large-cup" />;
  if (view === "home") return <><span className="object candle" /><span className="object vase" /></>;
  if (view === "candle") return <span className="object candle" />;
  if (view === "tee") return <span className="object tee">K</span>;
  return null;
}

function Header({ cartCount, categories, brands, activeFilter, onFilterChange }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const headerRef = useRef(null);

  useEffect(() => {
    const closeOutside = (event) => {
      if (!headerRef.current?.contains(event.target)) setFilter("");
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  const toggleFilter = (name) => setFilter((current) => current === name ? "" : name);
  const closeNavigation = () => { setMenuOpen(false); setFilter(""); };
  const chooseFilter = (type, value) => {
    onFilterChange({ type, value });
    closeNavigation();
  };
  const filterOptions = filter === "brands" ? brands : categories;

  return (
    <>
      <div className="promo-bar" aria-label="Store highlights">
        <div className="promo-track" aria-hidden="true">
          {[0, 1, 2].map((row) => <Fragment key={row}><span>LIMITED STOCKS</span><i /><span>POPULAR NOW</span><i /><span>SALE ITEMS</span><i /></Fragment>)}
        </div>
      </div>
      <header className="site-header" ref={headerRef}>
        <div className="header-inner shell">
          <button className="menu-button" type="button" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}><span /><span /></button>
          <a className="brand" href="/#top" aria-label="K-Market Online Shopper home">
            <img src="/assets/kmos-logo.png" alt="K-Market Online Shopper" />
            <span><strong>K-MARKET</strong><small>ONLINE SHOPPER</small></span>
          </a>
          <nav className="desktop-nav" aria-label="Primary navigation">
            <a href="/#limited">Limited stocks</a><a href="/#popular">Popular now</a><a className="sale-link" href="/#sale">Sale</a>
            <button type="button" aria-expanded={filter === "categories"} onClick={() => toggleFilter("categories")}>Categories <span>⌄</span></button>
            <button type="button" aria-expanded={filter === "brands"} onClick={() => toggleFilter("brands")}>Brands <span>⌄</span></button>
          </nav>
          <a className="header-cart" href="/cart" aria-label={`Open cart with ${cartCount} items`}><span>Cart</span><b>{cartCount}</b></a>
        </div>
        <nav className={`mobile-nav${menuOpen ? " is-open" : ""}`} aria-label="Mobile navigation">
          <a href="/#limited" onClick={closeNavigation}>Limited stocks</a><a href="/#popular" onClick={closeNavigation}>Popular now</a><a href="/#sale" onClick={closeNavigation}>Sale</a>
          <button type="button" aria-expanded={filter === "categories"} onClick={() => toggleFilter("categories")}>Categories <span>⌄</span></button>
          <button type="button" aria-expanded={filter === "brands"} onClick={() => toggleFilter("brands")}>Brands <span>⌄</span></button>
        </nav>
        <div className={`header-filter-panel${filter ? " is-open" : ""}`} aria-hidden={!filter} data-active-filter={filter}>
          <div className="filter-panel-inner shell">
            <div className="filter-panel-head"><p>{filter === "brands" ? "Shop by brand" : "Shop by category"}</p><div>{activeFilter && <button className="filter-clear-button" type="button" onClick={() => { onFilterChange(null); setFilter(""); }}>Clear filter</button>}<button type="button" aria-label="Close filter menu" onClick={() => setFilter("")}>×</button></div></div>
            <div className={`filter-list${filter === "brands" ? " brand-list" : ""}`}>
              {filterOptions.map((name, index) => <button className="filter-option" type="button" aria-pressed={activeFilter?.type === filter && activeFilter.value === name} onClick={() => chooseFilter(filter, name)} key={name}><span>{String(index + 1).padStart(2, "0")}</span><strong>{name}</strong><b>→</b></button>)}
              {!filterOptions.length && <p className="filter-empty">No {filter === "brands" ? "brands" : "categories"} have been added yet.</p>}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner shell">
        <div className="footer-brand"><img src="/assets/kmos-logo.png" alt="" /><span>K-MARKET ONLINE SHOPPER</span></div>
        <div className="footer-contact"><span>Contact</span><a href="https://www.facebook.com/KMarketOnlineShopper" target="_blank" rel="noreferrer">Facebook ↗</a><a href="https://www.instagram.com/kmarketonlineshopper" target="_blank" rel="noreferrer">Instagram ↗</a></div>
        <p className="footer-copy">© 2026 KMOS</p>
        <p className="footer-powered">Powered by <a href="https://ezpztek.com" target="_blank" rel="noreferrer">EZPZTEK ↗</a></p>
      </div>
    </footer>
  );
}

function orderedImages(product) {
  const rank = { main: 0, secondary: 1, gallery: 2 };
  return [...(product.images ?? [])].sort((left, right) => (rank[left.role] ?? 2) - (rank[right.role] ?? 2));
}

function imageUrl(image) {
  return image.objectKey ? `/api/images/${image.objectKey.split("/").map(encodeURIComponent).join("/")}` : image.url;
}

function ProductArt({ product, stockTag = "", variant = "product" }) {
  const images = orderedImages(product);
  const primary = images[0];
  const secondary = images[1] ?? primary;
  return (
    <div className={`${variant === "sale" ? "sale-art" : "product-art"} ${product.colors[0][1]}`}>
      {stockTag && <span className={variant === "sale" ? "sale-label" : "stock-tag"}>{stockTag}</span>}
      {product.notAvailable && <span className="unavailable-banner">NOT AVAILABLE</span>}
      <div className="visual-state visual-primary">{primary ? <img className="catalog-product-photo" src={imageUrl(primary)} alt="" /> : <Visual view={product.views[0]} />}</div>
      <div className="visual-state visual-alt">{secondary ? <img className="catalog-product-photo" src={imageUrl(secondary)} alt="" /> : <Visual view={product.views[1]} />}</div>
    </div>
  );
}

function baseCategory(product) {
  return product.category.replace(/\s*·\s*SALE$/i, "");
}

function saleStockTag(product) {
  const savedTag = String(product.saleTag ?? "").trim();
  if (!savedTag) return "SALE";
  const percentage = savedTag.match(/\d+(?:\.\d+)?/);
  if (percentage) return `SALE · ${percentage[0]}% OFF`;
  return `SALE · ${savedTag.toUpperCase()}`;
}

function HomePage({ activeFilter, onClearFilter }) {
  const matches = (product) => !activeFilter || (activeFilter.type === "categories" ? baseCategory(product) === activeFilter.value : product.brand === activeFilter.value);
  const filteredGroups = {
    limited: productGroups.limited.filter((id) => matches(products[id])),
    popular: productGroups.popular.filter((id) => matches(products[id])),
    sale: productGroups.sale.filter((id) => matches(products[id]))
  };
  const resultCount = filteredGroups.limited.length + filteredGroups.popular.length + filteredGroups.sale.length;
  const emptyMessage = <p className="filter-results-empty">No matching items in this section.</p>;

  return (
    <main id="main">
      {activeFilter && <div className="active-filter-bar"><div className="shell"><p>Showing <strong>{activeFilter.type === "categories" ? "category" : "brand"}: {activeFilter.value}</strong><span>{resultCount} {resultCount === 1 ? "item" : "items"}</span></p><button type="button" onClick={onClearFilter}>Clear filter ×</button></div></div>}
      <section className="stock-section section-space" id="limited"><div className="shell">
        <div className="section-head reveal"><div><p className="eyebrow">WHILE SUPPLIES LAST</p><h1>Limited stocks</h1></div><p className="section-note">Small quantities, ready to be discovered.</p></div>
        <div className="product-grid">{filteredGroups.limited.map((id, index) => { const product = products[id]; return <a className="product-card reveal" href={`/${id}`} aria-label={`View ${product.name}`} key={id}><ProductArt product={product} stockTag={limitedStockTag(product, index)} /><p className="product-type">{product.category}</p><h2>{product.name}</h2></a>; })}{activeFilter && !filteredGroups.limited.length && emptyMessage}</div>
      </div></section>
      <section className="popular-section section-space" id="popular"><div className="shell">
        <div className="section-head reveal"><div><p className="eyebrow">THE CURRENT EDIT</p><h1>Popular now</h1></div><p className="section-note">Hover over an item to see another view.</p></div>
        <div className="product-grid">{filteredGroups.popular.map((id) => { const product = products[id]; return <a className="product-card reveal" href={`/${id}`} aria-label={`View ${product.name}`} key={id}><ProductArt product={product} /><p className="product-type">{product.category}</p><h2>{product.name}</h2></a>; })}{activeFilter && !filteredGroups.popular.length && emptyMessage}</div>
      </div></section>
      <section className="sale-section section-space" id="sale"><div className="shell">
        <div className="section-head reveal"><div><p className="eyebrow">SELECTED FINDS</p><h1>Sale items</h1></div><p className="section-note">A simple edit of marked-down favorites.</p></div>
        <div className="sale-grid">{filteredGroups.sale.map((id) => { const product = products[id]; return <a className="sale-item reveal" href={`/${id}`} aria-label={`View ${product.name}`} key={id}><ProductArt product={product} stockTag={saleStockTag(product)} variant="sale" /><div><p>{baseCategory(product)}</p><h2>{product.name}</h2></div></a>; })}{activeFilter && !filteredGroups.sale.length && emptyMessage}</div>
      </div></section>
    </main>
  );
}

function ProductPage({ id, product, addToCart }) {
  const [viewIndex, setViewIndex] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);
  const [size, setSize] = useState(product.sizes[0]);
  const [quantity, setQuantity] = useState(1);
  const [status, setStatus] = useState("");
  const color = product.colors[colorIndex];
  const selectedColorway = product.colorways?.[colorIndex];
  const colorwayMedia = (selectedColorway?.images ?? []).filter((image) => image.url || image.objectKey);
  const itemMedia = orderedImages(product);
  const media = colorwayMedia.length ? colorwayMedia : itemMedia;
  const gallery = media.length ? media.map((image) => ({ url: imageUrl(image) })) : product.views.map((view) => ({ view }));
  const activeMedia = gallery[Math.min(viewIndex, gallery.length - 1)];

  const chooseColorway = (index) => {
    setColorIndex(index);
    setViewIndex(0);
  };

  const add = () => {
    if (product.notAvailable) return;
    addToCart(id, size, color[0], quantity);
    setStatus(`${quantity} × ${product.name} added.`);
  };

  return (
    <main id="main">
      <section className="product-page shell" aria-labelledby="product-page-name">
        <a className="back-to-shop reveal" href="/#limited"><span aria-hidden="true">←</span> Back to shop</a>
        <div className="product-layout">
          <section className="preview-gallery reveal" aria-label="Item images and colorways">
            <div className={`preview-picture ${color[1]}`}><div className="preview-orbit" aria-hidden="true" /><div className="preview-visual">{activeMedia?.url ? <img className="preview-product-photo" src={activeMedia.url} alt={product.name} /> : <Visual view={activeMedia?.view} />}</div></div>
            <div className="preview-thumbs" aria-label="Choose item image">{gallery.map((item, index) => <button className="preview-thumb" type="button" aria-label={`View image ${index + 1}`} aria-pressed={viewIndex === index} onClick={() => setViewIndex(index)} key={item.url ?? item.view}><span className={`preview-thumb-stage ${color[1]}`} aria-hidden="true">{item.url ? <img className="preview-thumb-photo" src={item.url} alt="" /> : <Visual view={item.view} />}</span></button>)}</div>
            <div className="colorway-block"><p>Colorway <strong>{color[0]}</strong></p><div className="color-options">{product.colors.map(([name, , hex], index) => <button className="color-option" type="button" aria-label={name} aria-pressed={colorIndex === index} style={{ "--swatch": hex }} onClick={() => chooseColorway(index)} key={name} />)}</div></div>
          </section>
          <section className="preview-info reveal">
            <p className="preview-category">{product.category}</p><h1 id="product-page-name">{product.name}</h1><p className="preview-price">{money.format(product.price)}</p><p className="preview-description">{product.description}</p>
            <fieldset className="size-fieldset"><legend>Available sizes</legend><div className="size-options">{product.sizes.map((itemSize) => <button className="size-option" type="button" aria-pressed={size === itemSize} onClick={() => setSize(itemSize)} key={itemSize}>{itemSize}</button>)}</div></fieldset>
            <div className="quantity-row"><span>Quantity</span><div className="quantity-stepper" aria-label="Choose quantity"><button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><output aria-live="polite">{quantity}</output><button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(99, value + 1))}>+</button></div></div>
            <button className="add-preview-button" type="button" disabled={product.notAvailable} onClick={add}>{product.notAvailable ? "Not available" : "Add to bag"}</button>
            {product.notAvailable && <p className="unavailable-note">This item is currently not available to order.</p>}
            <p className="add-status" aria-live="polite">{status && <>{status} <a href="/cart">View cart →</a></>}</p>
          </section>
        </div>
      </section>
    </main>
  );
}

function LoadingPage() {
  return <main id="main"><section className="cart-page shell"><div className="empty-cart"><p>Loading your saved cart…</p></div></section></main>;
}

function CartPage({ cart, setCart, ready }) {
  if (!ready) return <LoadingPage />;
  const items = cart.map((item) => {
    const product = products[item.productId];
    const color = product.colors.find(([name]) => name === item.color) ?? product.colors[0];
    return { ...item, product, color };
  });
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const adjust = (index, amount) => setCart((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Math.max(1, Math.min(99, item.quantity + amount)) } : item));
  const remove = (index) => setCart((current) => current.filter((_, itemIndex) => itemIndex !== index));

  return (
    <main id="main"><section className="cart-page shell" aria-labelledby="cart-page-name">
      <div className="route-heading reveal"><div><p className="eyebrow">SAVED ON THIS DEVICE</p><h1 id="cart-page-name">Your cart</h1></div><p>No login needed. Your selected items stay in this browser until you remove them or clear its data.</p></div>
      <div className="cart-layout"><div className="cart-list reveal">
        {!items.length ? <div className="empty-cart"><h2>Your cart is empty</h2><p>Browse the latest KMOS finds and add an item to begin your order.</p><a className="text-link" href="/#limited">Continue shopping →</a></div> : items.map((item, index) => { const image = orderedImages(item.product)[0]; return <article className="cart-item" key={`${item.productId}-${item.size}-${item.color}`}><div className={`cart-art ${item.color[1]}`} aria-hidden="true">{image ? <img className="cart-product-photo" src={imageUrl(image)} alt="" /> : <Visual view={item.product.views[0]} />}</div><div><p className="cart-item-category">{item.product.category}</p><h2>{item.product.name}</h2><p className="cart-variant">{item.size} · {item.color[0]}</p><p className="cart-price">{money.format(item.product.price)} each</p></div><div className="cart-item-actions"><div className="quantity-stepper" aria-label={`Quantity for ${item.product.name}`}><button type="button" aria-label={`Decrease ${item.product.name} quantity`} onClick={() => adjust(index, -1)}>−</button><output aria-live="polite">{item.quantity}</output><button type="button" aria-label={`Increase ${item.product.name} quantity`} onClick={() => adjust(index, 1)}>+</button></div><button className="remove-item" type="button" onClick={() => remove(index)}>Remove</button></div></article>; })}
      </div><aside className="cart-summary reveal" aria-label="Cart summary"><h2>Order summary</h2><div className="summary-line"><span>Items</span><strong>{itemCount}</strong></div><div className="summary-line"><span>Shipping</span><strong>Confirm in chat</strong></div><div className="summary-line summary-total"><span>Subtotal</span><strong>{money.format(total)}</strong></div><p className="cache-note">Your cart is kept only in this browser. KMOS will confirm stock, delivery, and payment after receiving your receipt.</p><a className="receipt-link" href="/receipt" aria-disabled={!items.length} tabIndex={items.length ? 0 : -1}>Buy · Create receipt</a></aside></div>
    </section></main>
  );
}

function ReceiptPage({ cart, ready }) {
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState("");
  const items = useMemo(() => cart.map((item) => ({ ...item, product: products[item.productId] })), [cart]);
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!ready || !items.length || meta) return;
    const now = new Date();
    const compactDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, "0"), String(now.getDate()).padStart(2, "0")].join("");
    setMeta({ number: `KMOS-${compactDate}-${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}`, date: now.toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" }) });
  }, [items.length, meta, ready]);

  if (!ready) return <LoadingPage />;
  if (!items.length) return <main id="main"><section className="receipt-page shell"><a className="back-to-shop reveal" href="/cart"><span aria-hidden="true">←</span> Back to cart</a><div className="empty-cart reveal"><h1>No receipt yet</h1><p>Add an item to your cart before creating a digital receipt.</p><a className="text-link" href="/#limited">Shop items →</a></div></section></main>;

  const receiptText = meta ? ["K-MARKET ONLINE SHOPPER", `Digital Receipt: ${meta.number}`, `Date: ${meta.date}`, "", ...items.flatMap((item, index) => [`${index + 1}. ${item.quantity} x ${item.product.name} — ${money.format(item.product.price * item.quantity)}`, `   Size: ${item.size} | Color: ${item.color}`]), "", `Subtotal: ${money.format(total)}`, "", "Please confirm availability, shipping, payment details, and the final total. Thank you!"].join("\n") : "";
  const copyReceipt = async () => {
    if (!receiptText) return;
    try { await navigator.clipboard.writeText(receiptText); }
    catch {
      const textarea = document.createElement("textarea"); textarea.value = receiptText; textarea.style.position = "fixed"; textarea.style.opacity = "0"; document.body.append(textarea); textarea.select(); document.execCommand("copy"); textarea.remove();
    }
    setStatus("Receipt copied. Paste it into your KMOS conversation.");
  };

  return (
    <main id="main"><section className="receipt-page shell" aria-labelledby="receipt-page-name"><a className="back-to-shop reveal" href="/cart"><span aria-hidden="true">←</span> Back to cart</a><article className="receipt-paper reveal">
      <header className="receipt-brand"><div><img src="/assets/kmos-logo.png" alt="" /><span><strong>K-MARKET</strong><small>ONLINE SHOPPER</small></span></div><p className="receipt-number">{meta?.number}<br />{meta?.date}</p></header>
      <h1 id="receipt-page-name">Digital receipt</h1><p className="receipt-intro">Review your {itemCount} item{itemCount === 1 ? "" : "s"}, then copy and send this receipt to KMOS through Messenger.</p>
      <div className="receipt-items">{items.map((item) => <div className="receipt-item" key={`${item.productId}-${item.size}-${item.color}`}><strong>{item.quantity} × {item.product.name}</strong><span>{money.format(item.product.price * item.quantity)}</span><small>{item.size} · {item.color} · {money.format(item.product.price)} each</small></div>)}</div>
      <div className="receipt-total"><span>Subtotal</span><strong>{money.format(total)}</strong></div><p className="receipt-instruction">This is an order request, not proof of payment. KMOS will confirm product availability, shipping, payment details, and the final total in chat.</p>
      <div className="receipt-actions"><a className="messenger-button" href="https://m.me/KMarketOnlineShopper" target="_blank" rel="noreferrer" onClick={copyReceipt}>Copy receipt & open Messenger ↗</a><button className="receipt-copy-button" type="button" onClick={copyReceipt}>Copy only</button></div><p className="receipt-status" aria-live="polite">{status}</p>
      <div className="receipt-socials"><span>Contact KMOS</span><a href="https://www.facebook.com/KMarketOnlineShopper" target="_blank" rel="noreferrer">Facebook ↗</a><a href="https://www.instagram.com/kmarketonlineshopper" target="_blank" rel="noreferrer">Instagram ↗</a></div>
    </article></section></main>
  );
}

function NotFoundPage() {
  return <main id="main"><section className="receipt-page shell"><div className="empty-cart"><h1>Page not found</h1><p>The page you requested is not part of the KMOS collection.</p><a className="text-link" href="/">Return home →</a></div></section></main>;
}

export default function Storefront({ route }) {
  const [cart, setCart] = useState([]);
  const [cartReady, setCartReady] = useState(false);
  const [catalogReady, setCatalogReady] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [catalogFilters, setCatalogFilters] = useState({ categories: [], brands: [] });
  const [activeFilter, setActiveFilter] = useState(null);
  const product = products[route];

  const updateFilter = (nextFilter) => {
    const url = new URL(window.location.href);
    if (nextFilter) {
      url.searchParams.set("filter", nextFilter.type);
      url.searchParams.set("value", nextFilter.value);
    } else {
      url.searchParams.delete("filter");
      url.searchParams.delete("value");
    }
    if (route) {
      url.pathname = "/";
      url.hash = "";
      window.location.assign(url.toString());
      return;
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    setActiveFilter(nextFilter);
  };

  useEffect(() => {
    let cancelled = false;
    const syncCatalog = async () => {
      try {
        const response = await fetch("/api/catalog", { cache: "no-store" });
        const catalog = await response.json();
        if (!response.ok) throw new Error(catalog.error || "Could not load the catalog.");
        if (!cancelled) {
          applyCatalog(catalog);
          setCatalogFilters({ categories: catalog.categories ?? [], brands: catalog.brands ?? [] });
        }
      } catch {
        if (!cancelled) resetCatalog();
      } finally {
        if (!cancelled) { setCatalogVersion((version) => version + 1); setCatalogReady(true); }
      }
    };
    syncCatalog();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const readFilter = () => {
      const search = new URLSearchParams(window.location.search);
      const type = search.get("filter");
      const value = search.get("value");
      setActiveFilter((type === "categories" || type === "brands") && value ? { type, value } : null);
    };
    readFilter();
    window.addEventListener("popstate", readFilter);
    return () => window.removeEventListener("popstate", readFilter);
  }, []);

  useEffect(() => {
    if (!catalogReady) return;
    try {
      const stored = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
      const valid = Array.isArray(stored) ? stored.filter((item) => products[item.productId] && !products[item.productId].notAvailable && products[item.productId].sizes.includes(item.size) && products[item.productId].colors.some(([name]) => name === item.color) && Number.isInteger(item.quantity) && item.quantity > 0) : [];
      setCart(valid.map((item) => ({ ...item, quantity: Math.min(99, item.quantity) })));
    } catch { setCart([]); }
    setCartReady(true);
  }, [catalogReady]);

  useEffect(() => { if (cartReady) localStorage.setItem(CART_KEY, JSON.stringify(cart)); }, [cart, cartReady]);

  useEffect(() => {
    document.body.classList.toggle("product-route", Boolean(product));
    document.body.classList.toggle("store-route", route === "cart" || route === "receipt");
    const elements = [...document.querySelectorAll(".reveal")];
    elements.forEach((element, index) => element.style.setProperty("--delay", `${(index % 4) * 80}ms`));
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) { elements.forEach((element) => element.classList.add("is-visible")); return; }
    const observer = new IntersectionObserver((entries) => entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); observer.unobserve(entry.target); } }), { threshold: 0.14, rootMargin: "0px 0px -38px" });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [route, cartReady, product, activeFilter]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const addToCart = (productId, size, color, quantity) => setCart((current) => {
    if (products[productId]?.notAvailable) return current;
    const matchIndex = current.findIndex((item) => item.productId === productId && item.size === size && item.color === color);
    if (matchIndex < 0) return [...current, { productId, size, color, quantity }];
    return current.map((item, index) => index === matchIndex ? { ...item, quantity: Math.min(99, item.quantity + quantity) } : item);
  });

  let content;
  if (!catalogReady) content = <LoadingPage />;
  else if (!route) content = <HomePage activeFilter={activeFilter} onClearFilter={() => updateFilter(null)} />;
  else if (route === "cart") content = <CartPage cart={cart} setCart={setCart} ready={cartReady} />;
  else if (route === "receipt") content = <ReceiptPage cart={cart} ready={cartReady} />;
  else if (product) content = <ProductPage key={`${route}-${catalogVersion}`} id={route} product={product} addToCart={addToCart} />;
  else content = <NotFoundPage />;

  return <><a className="skip-link" href="#main">Skip to content</a><div id="top"><Header cartCount={cartCount} categories={catalogFilters.categories} brands={catalogFilters.brands} activeFilter={activeFilter} onFilterChange={updateFilter} />{content}<Footer /></div></>;
}
