const body = document.body;
const menuButton = document.querySelector('[data-menu-button]');
const mobileNav = document.querySelector('[data-mobile-nav]');
const searchDialog = document.querySelector('[data-search-dialog]');
const cartDrawer = document.querySelector('[data-cart-drawer]');
const scrim = document.querySelector('[data-scrim]');

menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') === 'true';
  menuButton.setAttribute('aria-expanded', String(!open));
  mobileNav.classList.toggle('is-open', !open);
});

mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  menuButton.setAttribute('aria-expanded', 'false');
  mobileNav.classList.remove('is-open');
}));

document.querySelector('[data-search-button]')?.addEventListener('click', () => searchDialog.showModal());
document.querySelector('[data-search-close]')?.addEventListener('click', () => searchDialog.close());
searchDialog?.addEventListener('click', (event) => {
  if (event.target === searchDialog) searchDialog.close();
});

document.querySelector('[data-search-submit]')?.addEventListener('click', () => {
  const query = document.querySelector('#site-search').value.trim();
  document.querySelector('[data-search-result]').textContent = query
    ? `“${query}” is ready to connect to your catalog in the next phase.`
    : 'Type a product or category to preview search.';
});

const closeCart = () => {
  cartDrawer.classList.remove('is-open');
  cartDrawer.setAttribute('aria-hidden', 'true');
  scrim.classList.remove('is-visible');
  body.classList.remove('is-locked');
};

document.querySelector('[data-cart-button]')?.addEventListener('click', () => {
  cartDrawer.classList.add('is-open');
  cartDrawer.setAttribute('aria-hidden', 'false');
  scrim.classList.add('is-visible');
  body.classList.add('is-locked');
});
document.querySelector('[data-cart-close]')?.addEventListener('click', closeCart);
document.querySelector('[data-cart-shop]')?.addEventListener('click', closeCart);
scrim?.addEventListener('click', closeCart);

document.querySelectorAll('[data-category]').forEach((tab) => {
  tab.addEventListener('click', () => {
    const category = tab.dataset.category;
    document.querySelectorAll('[data-category]').forEach((item) => {
      const active = item === tab;
      item.classList.toggle('is-active', active);
      item.setAttribute('aria-selected', String(active));
    });
    document.querySelectorAll('[data-kind]').forEach((card) => {
      card.classList.toggle('is-hidden', category !== 'all' && card.dataset.kind !== category);
    });
  });
});

const rail = document.querySelector('[data-product-rail]');
document.querySelectorAll('[data-slide]').forEach((button) => {
  button.addEventListener('click', () => {
    const direction = button.dataset.slide === 'next' ? 1 : -1;
    rail.scrollBy({ left: rail.clientWidth * 0.72 * direction, behavior: 'smooth' });
  });
});

document.querySelector('[data-newsletter-form]')?.addEventListener('submit', (event) => {
  event.preventDefault();
  document.querySelector('[data-form-note]').textContent = 'Preview complete — connect your email provider to make this live.';
});
