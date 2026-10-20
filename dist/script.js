document.documentElement.classList.add('motion-ready');

const menuButton = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const filterPanel = document.querySelector('[data-filter-panel]');
const filterTitle = document.querySelector('[data-filter-title]');
const filterTriggers = document.querySelectorAll('[data-filter-trigger]');

const closeFilter = () => {
  filterPanel.classList.remove('is-open');
  filterPanel.setAttribute('aria-hidden', 'true');
  filterTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', 'false'));
};

const openFilter = (type) => {
  const isAlreadyOpen = filterPanel.classList.contains('is-open') && filterPanel.dataset.activeFilter === type;
  if (isAlreadyOpen) return closeFilter();
  filterPanel.dataset.activeFilter = type;
  filterTitle.textContent = type === 'categories' ? 'Shop by category' : 'Shop by brand';
  document.querySelectorAll('[data-filter-list]').forEach((list) => { list.hidden = list.dataset.filterList !== type; });
  filterTriggers.forEach((trigger) => trigger.setAttribute('aria-expanded', String(trigger.dataset.filterTrigger === type)));
  filterPanel.classList.add('is-open');
  filterPanel.setAttribute('aria-hidden', 'false');
};

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileNav.classList.toggle('is-open', !open);
  if (open) closeFilter();
});

filterTriggers.forEach((trigger) => trigger.addEventListener('click', () => openFilter(trigger.dataset.filterTrigger)));
document.querySelector('[data-filter-close]')?.addEventListener('click', closeFilter);
document.querySelectorAll('[data-filter-list] a').forEach((link) => link.addEventListener('click', () => {
  closeFilter();
  mobileNav.classList.remove('is-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));
mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  mobileNav.classList.remove('is-open');
  menuButton.setAttribute('aria-expanded', 'false');
  closeFilter();
}));

document.addEventListener('click', (event) => {
  if (!event.target.closest('[data-header]')) closeFilter();
});
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeFilter(); });

const initializeScrollAnimations = (root = document) => {
  const elements = [...root.querySelectorAll('.reveal')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  elements.forEach((element, index) => {
    element.style.setProperty('--delay', `${(index % 4) * 80}ms`);
  });

  if (reduceMotion || !('IntersectionObserver' in window)) {
    elements.forEach((element) => element.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -38px' });

  elements.forEach((element) => observer.observe(element));
};

const productCatalog = {
  'market-day-tote': {
    category: 'KMOS EDIT', name: 'Market Day Tote', price: '₱850.00',
    description: 'A roomy everyday carry made for market mornings, quick errands, and everything in between.',
    sizes: ['One Size'], views: ['tote', 'cap', 'pouch'],
    colors: [['Orange', 'art-orange', '#df8333'], ['Forest', 'art-green', '#347362'], ['Natural', 'art-cream', '#e9d6b9']]
  },
  'daily-glow-pair': {
    category: 'BEAUTY', name: 'Daily Glow Pair', price: '₱690.00',
    description: 'A simple two-step skin-care pairing designed for an easy, fresh-looking daily routine.',
    sizes: ['30 ml', '50 ml'], views: ['glow', 'home', 'bottle'],
    colors: [['Forest', 'art-green', '#347362'], ['Teal', 'art-teal', '#67aaa3'], ['Peach', 'art-peach', '#e7a776']]
  },
  'pantry-starter-set': {
    category: 'K-PANTRY', name: 'Pantry Starter Set', price: '₱520.00',
    description: 'Everyday pantry favorites grouped into one practical starter set for the home.',
    sizes: ['Regular', 'Family'], views: ['pantry', 'cup', 'tote'],
    colors: [['Natural', 'art-cream', '#e9d6b9'], ['Orange', 'art-orange', '#df8333'], ['Forest', 'art-green', '#347362']]
  },
  'weekend-cap': {
    category: 'STYLE', name: 'Weekend Cap', price: '₱450.00',
    description: 'An easy everyday cap with a clean shape and relaxed fit for sunny market runs.',
    sizes: ['S/M', 'L/XL'], views: ['cap', 'bottle', 'tote'],
    colors: [['Teal', 'art-teal', '#67aaa3'], ['Forest', 'art-green', '#347362'], ['Orange', 'art-orange', '#df8333']]
  },
  'little-home-reset': {
    category: 'HOME', name: 'Little Home Reset', price: '₱720.00',
    description: 'A calm little pairing for refreshing a shelf, desk, or favorite corner at home.',
    sizes: ['Small', 'Large'], views: ['home', 'pantry', 'candle'],
    colors: [['Peach', 'art-peach', '#e7a776'], ['Natural', 'art-cream', '#e9d6b9'], ['Forest', 'art-green', '#347362']]
  },
  'soft-carry-pouch': {
    category: 'ACCESSORIES', name: 'Soft Carry Pouch', price: '₱480.00',
    description: 'A compact soft pouch for daily basics, small finds, and on-the-go essentials.',
    sizes: ['Mini', 'Regular'], views: ['pouch', 'cap', 'tote'],
    colors: [['Teal', 'art-teal', '#67aaa3'], ['Orange', 'art-orange', '#df8333'], ['Natural', 'art-cream', '#e9d6b9']]
  },
  'morning-cup-set': {
    category: 'K-PANTRY', name: 'Morning Cup Set', price: '₱390.00',
    description: 'A cheerful cup set for slow mornings, quick coffee breaks, and shared snacks.',
    sizes: ['Set of 2', 'Set of 4'], views: ['cup', 'pantry', 'home'],
    colors: [['Natural', 'art-cream', '#e9d6b9'], ['Peach', 'art-peach', '#e7a776'], ['Teal', 'art-teal', '#67aaa3']]
  },
  'everyday-tee': {
    category: 'STYLE', name: 'Everyday Tee', price: '₱650.00',
    description: 'A comfortable staple tee with an unfussy shape made for repeat wear.',
    sizes: ['S', 'M', 'L', 'XL'], views: ['tee', 'tote', 'cap'],
    colors: [['Orange', 'art-orange', '#df8333'], ['Forest', 'art-green', '#347362'], ['Natural', 'art-cream', '#e9d6b9']]
  },
  'easy-market-bag': {
    category: 'KMOS EDIT · SALE', name: 'Easy Market Bag', price: '₱699.00',
    description: 'A lightweight market bag with space for spontaneous finds and everyday carry.',
    sizes: ['One Size'], views: ['tote', 'cap', 'pouch'],
    colors: [['Orange', 'art-orange', '#df8333'], ['Teal', 'art-teal', '#67aaa3']]
  },
  'home-pair': {
    category: 'HOME · SALE', name: 'Home Pair', price: '₱599.00',
    description: 'Two small home accents selected to bring warmth and balance to compact spaces.',
    sizes: ['Small', 'Large'], views: ['home', 'bottle', 'candle'],
    colors: [['Forest', 'art-green', '#347362'], ['Peach', 'art-peach', '#e7a776']]
  },
  'pantry-pack': {
    category: 'K-PANTRY · SALE', name: 'Pantry Pack', price: '₱449.00',
    description: 'A value pack of pantry basics ready for easy weekday meals and shared moments.',
    sizes: ['Regular', 'Family'], views: ['pantry', 'cup', 'tote'],
    colors: [['Natural', 'art-cream', '#e9d6b9'], ['Orange', 'art-orange', '#df8333']]
  },
  'glow-duo': {
    category: 'BEAUTY · SALE', name: 'Glow Duo', price: '₱549.00',
    description: 'A paired beauty edit for a quick, uncomplicated boost to the daily routine.',
    sizes: ['30 ml', '50 ml'], views: ['glow', 'pouch', 'bottle'],
    colors: [['Teal', 'art-teal', '#67aaa3'], ['Peach', 'art-peach', '#e7a776']]
  }
};

const visualTemplates = {
  tote: '<span class="object tote">KM</span>',
  pouch: '<span class="object tote">K</span>',
  cap: '<span class="object cap">K</span>',
  glow: '<span class="object bottle">K</span><span class="object tube"></span>',
  bottle: '<span class="object bottle">K</span>',
  pantry: '<span class="object box">K!</span><span class="object cup"></span>',
  cup: '<span class="object cup large-cup"></span>',
  home: '<span class="object candle"></span><span class="object vase"></span>',
  candle: '<span class="object candle"></span>',
  tee: '<span class="object tee">K</span>'
};

const CART_STORAGE_KEY = 'kmos-cart-v1';
const money = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' });

const productAmount = (product) => Number(product.price.replace(/[^0-9.]/g, ''));

const readCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored)) return [];
    return stored.filter((item) => {
      const product = productCatalog[item.productId];
      return product
        && product.sizes.includes(item.size)
        && product.colors.some(([name]) => name === item.color)
        && Number.isInteger(item.quantity)
        && item.quantity > 0;
    }).map((item) => ({ ...item, quantity: Math.min(item.quantity, 99) }));
  } catch {
    return [];
  }
};

const writeCart = (cart) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  updateCartCount();
};

const updateCartCount = () => {
  const count = readCart().reduce((total, item) => total + item.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach((badge) => {
    badge.textContent = count;
    badge.setAttribute('aria-label', `${count} item${count === 1 ? '' : 's'} in cart`);
  });
};

const addToCart = (productId, size, color, itemQuantity) => {
  const cart = readCart();
  const match = cart.find((item) => item.productId === productId && item.size === size && item.color === color);
  if (match) match.quantity = Math.min(99, match.quantity + itemQuantity);
  else cart.push({ productId, size, color, quantity: itemQuantity });
  writeCart(cart);
};

const cartDetails = () => readCart().map((item) => {
  const product = productCatalog[item.productId];
  const color = product.colors.find(([name]) => name === item.color) ?? product.colors[0];
  return { ...item, product, color, unitAmount: productAmount(product) };
});

const cartTotal = (items) => items.reduce((total, item) => total + (item.unitAmount * item.quantity), 0);

const productSlug = decodeURIComponent(window.location.pathname).replace(/^\/+|\/+$/g, '');
const routeProduct = productCatalog[productSlug];

const renderProductPage = (product) => {
  document.body.classList.add('product-route');
  document.title = `${product.name} — K-Market Online Shopper`;

  const main = document.querySelector('#main');
  main.innerHTML = `
    <section class="product-page shell" aria-labelledby="product-page-name">
      <a class="back-to-shop reveal" href="/#limited"><span aria-hidden="true">←</span> Back to shop</a>
      <div class="product-layout">
        <section class="preview-gallery reveal" aria-label="Item images and colorways">
          <div class="preview-picture ${product.colors[0][1]}" data-preview-picture data-active-view="${product.views[0]}">
            <div class="preview-orbit" aria-hidden="true"></div>
            <div class="preview-visual" data-preview-visual aria-hidden="true">${visualTemplates[product.views[0]]}</div>
          </div>
          <div class="preview-thumbs" data-preview-thumbs aria-label="Choose item image">
            ${product.views.map((view, index) => `
              <button class="preview-thumb" type="button" data-view="${view}" aria-label="View image ${index + 1}" aria-pressed="${index === 0}">
                <span class="preview-thumb-stage ${product.colors[0][1]}" aria-hidden="true">${visualTemplates[view]}</span>
              </button>
            `).join('')}
          </div>
          <div class="colorway-block">
            <p>Colorway <strong data-color-name>${product.colors[0][0]}</strong></p>
            <div class="color-options" data-color-options>
              ${product.colors.map(([name, , hex], index) => `
                <button class="color-option" type="button" aria-label="${name}" aria-pressed="${index === 0}" style="--swatch:${hex}"></button>
              `).join('')}
            </div>
          </div>
        </section>

        <section class="preview-info reveal">
          <p class="preview-category">${product.category}</p>
          <h1 id="product-page-name">${product.name}</h1>
          <p class="preview-price">${product.price}</p>
          <p class="preview-description">${product.description}</p>
          <fieldset class="size-fieldset">
            <legend>Available sizes</legend>
            <div class="size-options" data-size-options>
              ${product.sizes.map((size, index) => `<button class="size-option" type="button" aria-pressed="${index === 0}">${size}</button>`).join('')}
            </div>
          </fieldset>
          <div class="quantity-row">
            <span>Quantity</span>
            <div class="quantity-stepper" aria-label="Choose quantity">
              <button type="button" aria-label="Decrease quantity" data-quantity-minus>−</button>
              <output aria-live="polite" data-quantity>1</output>
              <button type="button" aria-label="Increase quantity" data-quantity-plus>+</button>
            </div>
          </div>
          <button class="add-preview-button" type="button" data-add-preview>Add to bag</button>
          <p class="add-status" data-add-status aria-live="polite"></p>
        </section>
      </div>
    </section>
  `;

  const previewPicture = main.querySelector('[data-preview-picture]');
  const previewVisual = main.querySelector('[data-preview-visual]');
  const previewThumbs = main.querySelector('[data-preview-thumbs]');
  const colorOptions = main.querySelector('[data-color-options]');
  const sizeOptions = main.querySelector('[data-size-options]');
  const quantityOutput = main.querySelector('[data-quantity]');
  const addStatus = main.querySelector('[data-add-status]');
  let activeColorIndex = 0;
  let quantity = 1;

  const renderPicture = (view) => {
    previewPicture.dataset.activeView = view;
    previewVisual.innerHTML = visualTemplates[view];
    previewVisual.style.animation = 'none';
    previewVisual.offsetHeight;
    previewVisual.style.animation = '';
    previewThumbs.querySelectorAll('button').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
  };

  previewThumbs.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => renderPicture(button.dataset.view)));
  colorOptions.querySelectorAll('button').forEach((button, index) => button.addEventListener('click', () => {
    activeColorIndex = index;
    const [name, className] = product.colors[index];
    previewPicture.className = `preview-picture ${className}`;
    main.querySelector('[data-color-name]').textContent = name;
    colorOptions.querySelectorAll('button').forEach((option, optionIndex) => option.setAttribute('aria-pressed', String(optionIndex === index)));
  }));
  sizeOptions.querySelectorAll('button').forEach((button) => button.addEventListener('click', () => {
    sizeOptions.querySelectorAll('button').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
  }));
  main.querySelector('[data-quantity-minus]').addEventListener('click', () => {
    quantity = Math.max(1, quantity - 1);
    quantityOutput.textContent = quantity;
    addStatus.textContent = '';
  });
  main.querySelector('[data-quantity-plus]').addEventListener('click', () => {
    quantity = Math.min(10, quantity + 1);
    quantityOutput.textContent = quantity;
    addStatus.textContent = '';
  });
  main.querySelector('[data-add-preview]').addEventListener('click', () => {
    const selectedSize = sizeOptions.querySelector('[aria-pressed="true"]').textContent;
    const selectedColor = product.colors[activeColorIndex][0];
    addToCart(productSlug, selectedSize, selectedColor, quantity);
    addStatus.innerHTML = `${quantity} × ${product.name} added. <a href="/cart">View cart →</a>`;
  });
};

const renderCartPage = () => {
  document.body.classList.add('store-route');
  document.title = 'Your Cart — K-Market Online Shopper';
  const main = document.querySelector('#main');

  main.innerHTML = `
    <section class="cart-page shell" aria-labelledby="cart-page-name">
      <div class="route-heading reveal">
        <div><p class="eyebrow">SAVED ON THIS DEVICE</p><h1 id="cart-page-name">Your cart</h1></div>
        <p>No login needed. Your selected items stay in this browser until you remove them or clear its data.</p>
      </div>
      <div class="cart-layout">
        <div class="cart-list reveal" data-cart-list></div>
        <aside class="cart-summary reveal" data-cart-summary aria-label="Cart summary"></aside>
      </div>
    </section>
  `;

  const list = main.querySelector('[data-cart-list]');
  const summary = main.querySelector('[data-cart-summary]');

  const refreshCart = () => {
    const items = cartDetails();
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);
    const total = cartTotal(items);

    if (!items.length) {
      list.innerHTML = `
        <div class="empty-cart">
          <h2>Your cart is empty</h2>
          <p>Browse the latest KMOS finds and add an item to begin your order.</p>
          <a class="text-link" href="/#limited">Continue shopping →</a>
        </div>
      `;
    } else {
      list.innerHTML = items.map((item, index) => `
        <article class="cart-item">
          <div class="cart-art ${item.color[1]}" aria-hidden="true">${visualTemplates[item.product.views[0]]}</div>
          <div>
            <p class="cart-item-category">${item.product.category}</p>
            <h2>${item.product.name}</h2>
            <p class="cart-variant">${item.size} · ${item.color[0]}</p>
            <p class="cart-price">${item.product.price} each</p>
          </div>
          <div class="cart-item-actions">
            <div class="quantity-stepper" aria-label="Quantity for ${item.product.name}">
              <button type="button" aria-label="Decrease ${item.product.name} quantity" data-cart-decrease="${index}">−</button>
              <output aria-live="polite">${item.quantity}</output>
              <button type="button" aria-label="Increase ${item.product.name} quantity" data-cart-increase="${index}">+</button>
            </div>
            <button class="remove-item" type="button" data-cart-remove="${index}">Remove</button>
          </div>
        </article>
      `).join('');
    }

    summary.innerHTML = `
      <h2>Order summary</h2>
      <div class="summary-line"><span>Items</span><strong>${itemCount}</strong></div>
      <div class="summary-line"><span>Shipping</span><strong>Confirm in chat</strong></div>
      <div class="summary-line summary-total"><span>Subtotal</span><strong>${money.format(total)}</strong></div>
      <p class="cache-note">Your cart is kept only in this browser. KMOS will confirm stock, delivery, and payment after receiving your receipt.</p>
      <a class="receipt-link" href="/receipt" ${items.length ? '' : 'aria-disabled="true" tabindex="-1"'}>Buy · Create receipt</a>
    `;

    list.querySelectorAll('[data-cart-decrease]').forEach((button) => button.addEventListener('click', () => {
      const cart = readCart();
      const index = Number(button.dataset.cartDecrease);
      cart[index].quantity = Math.max(1, cart[index].quantity - 1);
      writeCart(cart);
      refreshCart();
    }));
    list.querySelectorAll('[data-cart-increase]').forEach((button) => button.addEventListener('click', () => {
      const cart = readCart();
      const index = Number(button.dataset.cartIncrease);
      cart[index].quantity = Math.min(99, cart[index].quantity + 1);
      writeCart(cart);
      refreshCart();
    }));
    list.querySelectorAll('[data-cart-remove]').forEach((button) => button.addEventListener('click', () => {
      const cart = readCart();
      cart.splice(Number(button.dataset.cartRemove), 1);
      writeCart(cart);
      refreshCart();
    }));
  };

  refreshCart();
};

const renderReceiptPage = () => {
  document.body.classList.add('store-route');
  document.title = 'Digital Receipt — K-Market Online Shopper';
  const main = document.querySelector('#main');
  const items = cartDetails();

  if (!items.length) {
    main.innerHTML = `
      <section class="receipt-page shell">
        <a class="back-to-shop reveal" href="/cart"><span aria-hidden="true">←</span> Back to cart</a>
        <div class="empty-cart reveal"><h1>No receipt yet</h1><p>Add an item to your cart before creating a digital receipt.</p><a class="text-link" href="/#limited">Shop items →</a></div>
      </section>
    `;
    return;
  }

  const now = new Date();
  const compactDate = [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('');
  const receiptNumber = `KMOS-${compactDate}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const total = cartTotal(items);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const receiptDate = now.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });

  main.innerHTML = `
    <section class="receipt-page shell" aria-labelledby="receipt-page-name">
      <a class="back-to-shop reveal" href="/cart"><span aria-hidden="true">←</span> Back to cart</a>
      <article class="receipt-paper reveal">
        <header class="receipt-brand">
          <div><img src="/assets/kmos-logo.png" alt="" /><span><strong>K-MARKET</strong><small>ONLINE SHOPPER</small></span></div>
          <p class="receipt-number">${receiptNumber}<br />${receiptDate}</p>
        </header>
        <h1 id="receipt-page-name">Digital receipt</h1>
        <p class="receipt-intro">Review your ${itemCount} item${itemCount === 1 ? '' : 's'}, then copy and send this receipt to KMOS through Messenger.</p>
        <div class="receipt-items">
          ${items.map((item) => `
            <div class="receipt-item">
              <strong>${item.quantity} × ${item.product.name}</strong>
              <span>${money.format(item.unitAmount * item.quantity)}</span>
              <small>${item.size} · ${item.color[0]} · ${item.product.price} each</small>
            </div>
          `).join('')}
        </div>
        <div class="receipt-total"><span>Subtotal</span><strong>${money.format(total)}</strong></div>
        <p class="receipt-instruction">This is an order request, not proof of payment. KMOS will confirm product availability, shipping, payment details, and the final total in chat.</p>
        <div class="receipt-actions">
          <a class="messenger-button" href="https://m.me/KMarketOnlineShopper" target="_blank" rel="noopener noreferrer" data-send-receipt>Copy receipt & open Messenger ↗</a>
          <button class="receipt-copy-button" type="button" data-copy-receipt>Copy only</button>
        </div>
        <p class="receipt-status" data-receipt-status aria-live="polite"></p>
        <div class="receipt-socials">
          <span>Contact KMOS</span>
          <a href="https://www.facebook.com/KMarketOnlineShopper" target="_blank" rel="noopener noreferrer">Facebook ↗</a>
          <a href="https://www.instagram.com/kmarketonlineshopper" target="_blank" rel="noopener noreferrer">Instagram ↗</a>
        </div>
      </article>
    </section>
  `;

  const receiptText = [
    'K-MARKET ONLINE SHOPPER',
    `Digital Receipt: ${receiptNumber}`,
    `Date: ${receiptDate}`,
    '',
    ...items.flatMap((item, index) => [
      `${index + 1}. ${item.quantity} x ${item.product.name} — ${money.format(item.unitAmount * item.quantity)}`,
      `   Size: ${item.size} | Color: ${item.color[0]}`
    ]),
    '',
    `Subtotal: ${money.format(total)}`,
    '',
    'Please confirm availability, shipping, payment details, and the final total. Thank you!'
  ].join('\n');

  const copyReceipt = async () => {
    try {
      await navigator.clipboard.writeText(receiptText);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = receiptText;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.append(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
    main.querySelector('[data-receipt-status]').textContent = 'Receipt copied. Paste it into your KMOS conversation.';
  };

  main.querySelector('[data-copy-receipt]').addEventListener('click', copyReceipt);
  main.querySelector('[data-send-receipt]').addEventListener('click', copyReceipt);
};

updateCartCount();

if (productSlug === 'cart') {
  renderCartPage();
  initializeScrollAnimations(document.querySelector('#main'));
} else if (productSlug === 'receipt') {
  renderReceiptPage();
  initializeScrollAnimations(document.querySelector('#main'));
} else if (routeProduct) {
  renderProductPage(routeProduct);
  initializeScrollAnimations(document.querySelector('#main'));
} else {
  document.querySelectorAll('[data-product]').forEach((card) => {
    const name = productCatalog[card.dataset.product]?.name ?? 'item';
    card.setAttribute('role', 'link');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `View ${name}`);
    const visitProduct = () => window.location.assign(`/${card.dataset.product}`);
    card.addEventListener('click', visitProduct);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        visitProduct();
      }
    });
  });
  initializeScrollAnimations();
}
