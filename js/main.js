// ============ Product Data ============
const IMG_BASE = 'https://storage.googleapis.com/lumina-jewelry-demo-qiugel/images/';
const img = (n) => IMG_BASE + 'Gemini_Generated_Image_qiugelqiugelqiug' + (n === 0 ? '' : ' (' + n + ')') + '.png';

const products = [
  { id: 'LUMIN-RING-001',  name: 'Gold Solitaire Diamond Ring',   category: 'Rings', price: 4500, highlight: true,
    desc: 'A brilliant round solitaire diamond set in an elegant 18k yellow gold band. A timeless symbol of love.',
    image: img(0) },
  { id: 'AURA-EAR-002',  name: 'Platinum Diamond Halo Ring',    category: 'Rings', price: 5800, highlight: false,
    desc: 'A stunning round-cut diamond framed by a delicate halo of sparkling micro-pavé diamonds on a polished platinum band.',
    image: img(1) },
  { id: 'ETERN-BRAC-003',  name: 'Gold Three-Stone Ring',         category: 'Rings', price: 6400, highlight: true,
    desc: 'An exquisite round-cut diamond flanked by two matching side diamonds on an 18k yellow gold band, representing past, present, and future.',
    image: img(2) },
  { id: 'CELEST-NECK-004',  name: 'Platinum Pavé Diamond Band',    category: 'Rings', price: 3200, highlight: true,
    desc: 'A half-eternity wedding band encrusted with three rows of brilliant pavé-set diamonds in polished platinum.',
    image: img(3) },
  { id: 'OPUL-RING-005',  name: 'Gold Eternity Diamond Ring',    category: 'Rings', price: 4200, highlight: false,
    desc: 'A solid 18k yellow gold eternity band set with a continuous circle of brilliant-cut diamonds, symbolizing eternal devotion.',
    image: img(4) },
  { id: 'CASC-EAR-006',  name: 'Marquise Cut Solitaire Ring',   category: 'Rings', price: 5500, highlight: false,
    desc: 'A striking marquise-cut diamond set in a classic four-prong platinum band to elongate the finger and capture light.',
    image: img(5) },
  { id: 'MINIM-BRAC-007',  name: 'Princess Cut Solitaire Ring',   category: 'Rings', price: 4900, highlight: false,
    desc: 'A classic princess-cut square diamond mounted on a sleek 18k yellow gold band for a modern, architectural look.',
    image: img(6) },
  { id: 'ELYS-NECK-008',  name: 'Cushion Cut Halo Ring',         category: 'Rings', price: 6100, highlight: false,
    desc: 'A soft cushion-cut diamond bordered by a sparkling halo of diamonds, set on a thin platinum band.',
    image: img(7) },
  { id: 'CLASS-EAR-009',  name: 'Vintage Filigree Bezel Ring',   category: 'Rings', price: 3800, highlight: false,
    desc: 'An intricate, antique-inspired gold ring featuring filigree details and an octagonal bezel-set diamond.',
    image: img(8) },
  { id: 'AMOR-RING-010', name: 'Bezel Solitaire Platinum Ring', category: 'Rings', price: 4700, highlight: false,
    desc: 'A contemporary round solitaire diamond encased in a protective, modern bezel setting on a polished platinum band.',
    image: img(9) },
];

const fmt = (n) => '$' + n.toLocaleString('en-US');

// ============ Render Catalog ============
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  grid.innerHTML = products.map(p => `
    <article class="product-card${p.highlight ? ' highlight' : ''}" data-id="${p.id}" data-product-link="${p.id}" tabindex="0" role="link" aria-label="View ${p.name}">
      <div class="product-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-foot">
          <span class="product-price">${fmt(p.price)}</span>
          <button class="add-btn" data-add="${p.id}" aria-label="Add to bag">+</button>
        </div>
      </div>
    </article>
  `).join('');
}

// ============ Render Highlights ============
function renderHighlights() {
  const grid = document.getElementById('highlightGrid');
  grid.innerHTML = products.filter(p => p.highlight).map(p => `
    <article class="highlight-card" data-id="${p.id}" data-product-link="${p.id}" tabindex="0" role="link" aria-label="View ${p.name}">
      <div class="product-img">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
      </div>
      <div class="product-info">
        <p class="product-cat">${p.category}</p>
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-foot">
          <span class="product-price">${fmt(p.price)}</span>
          <button class="add-btn-text" data-add="${p.id}">ADD TO CART</button>
        </div>
      </div>
    </article>
  `).join('');
}

// ============ Product Detail Routing ============
function getProductRoute(id) {
  return '#product/' + id;
}

function navigateToProduct(id, productName) {
  const product = products.find(x => String(x.id) === String(id));
  if (!product) return false;

  const route = getProductRoute(product.id);
  if (window.location.hash !== route) window.location.hash = route;
  handleRouting();

  setTimeout(() => highlightProductInUI(product.id, productName || product.name), 250);
  return true;
}

function renderProductDetail(product) {
  const section = document.getElementById('productDetailSection');
  if (!section) return;

  section.innerHTML = `
    <div class="container product-detail-container">
      <a href="#catalog-section" class="product-back-link" aria-label="Back to catalog">BACK TO CATALOG</a>
      <div class="product-detail-grid">
        <div class="product-detail-image">
          <img src="${product.image}" alt="${product.name}" />
        </div>
        <div class="product-detail-copy">
          <p class="eyebrow">${product.category}</p>
          <h1 class="product-detail-title">${product.name}</h1>
          <p class="product-detail-desc">${product.desc}</p>
          <div class="product-detail-price">${fmt(product.price)}</div>
          <div class="product-detail-actions">
            <button class="btn btn-dark" data-add="${product.id}">ADD TO CART</button>
            <a class="btn btn-light" href="#catalog-section">CONTINUE SHOPPING</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handleRouting() {
  const hash = window.location.hash;
  const productDetailSection = document.getElementById('productDetailSection');
  const heroBanner = document.querySelector('.hero');
  const catalogSection = document.getElementById('catalog-section');
  const highlightSection = document.getElementById('highlight-section');

  if (!productDetailSection) return;

  if (hash.startsWith('#product/') || hash.startsWith('#/product/')) {
    const productId = decodeURIComponent(hash.replace(/^#\/?product\//, ''));
    const product = products.find(p => String(p.id) === String(productId));

    if (!product) {
      window.location.hash = '#';
      return;
    }

    if (heroBanner) heroBanner.style.display = 'none';
    if (catalogSection) catalogSection.style.display = 'none';
    if (highlightSection) highlightSection.style.display = 'none';

    productDetailSection.style.display = 'block';
    renderProductDetail(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }

  if (heroBanner) heroBanner.style.display = 'block';
  if (catalogSection) catalogSection.style.display = 'block';
  if (highlightSection) highlightSection.style.display = 'block';

  productDetailSection.style.display = 'none';
  productDetailSection.innerHTML = '';

  if (hash && hash !== '#' && hash.startsWith('#')) {
    const targetElement = document.querySelector(hash);
    if (targetElement) {
      setTimeout(() => targetElement.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }
}

function highlightProductInUI(productId, productName) {
  const detailContainer = document.querySelector('.product-detail-grid');
  if (!detailContainer) return;

  detailContainer.classList.add('agent-highlighted');
  showToast('Agent suggested: ' + (productName || 'Product'));

  clearTimeout(highlightProductInUI._t);
  highlightProductInUI._t = setTimeout(() => {
    detailContainer.classList.remove('agent-highlighted');
  }, 5000);
}

function collectTextPayloads(value, output = [], seen = new WeakSet()) {
  if (value == null) return output;

  if (typeof value === 'string') {
    output.push(value);
    return output;
  }

  if (typeof value !== 'object') return output;
  if (seen.has(value)) return output;
  seen.add(value);

  if (Array.isArray(value)) {
    value.forEach(item => collectTextPayloads(item, output, seen));
    return output;
  }

  Object.values(value).forEach(item => collectTextPayloads(item, output, seen));
  return output;
}

function parseNavigationTargets(text) {
  const targets = [];
  const tokenPattern = /LUMINA_NAVIGATE_PRODUCT\|productId=([^|]+)\|route=(#[^|\s]+)\|name=([^\n\r]+)/g;
  const routePattern = /Storefront Route:\s*(#\/?product\/([A-Za-z0-9_-]+))/gi;

  for (const match of text.matchAll(tokenPattern)) {
    targets.push({
      productId: match[1].trim(),
      route: match[2].trim(),
      productName: match[3].trim()
    });
  }

  for (const match of text.matchAll(routePattern)) {
    targets.push({
      productId: match[2],
      route: match[1],
      productName: ''
    });
  }

  return targets;
}

function parseCartTargets(text) {
  const targets = [];
  const cartPattern = /LUMINA_CART_ADD\|productId=([^|]+)\|checkout=(true|false)\|name=([^\n\r]+)/g;

  for (const match of text.matchAll(cartPattern)) {
    targets.push({
      productId: match[1].trim(),
      checkout: match[2] === 'true',
      productName: match[3].trim()
    });
  }

  return targets;
}

function handleAgentCartCommand(payload) {
  const cartTargets = collectTextPayloads(payload)
    .flatMap(parseCartTargets)
    .filter((target, index, targets) => targets.findIndex(item => item.productId === target.productId) === index);

  if (cartTargets.length !== 1) return false;

  addToCart(cartTargets[0].productId);
  if (cartTargets[0].checkout) openCart();
  return true;
}

function handleAgentMessage(payload) {
  if (handleAgentCartCommand(payload)) return true;

  const navigationTargets = collectTextPayloads(payload)
    .flatMap(parseNavigationTargets)
    .filter((target, index, targets) => targets.findIndex(item => item.productId === target.productId) === index);

  if (navigationTargets.length !== 1) return false;
  return navigateToProduct(navigationTargets[0].productId, navigationTargets[0].productName);
}

function findMentionedProducts(text) {
  const normalized = text.toLowerCase();
  return products.filter(product => normalized.includes(product.name.toLowerCase()));
}

function renderAgentSuggestions(suggestions) {
  if (!suggestions.length) return;

  let panel = document.getElementById('agentSuggestions');
  if (!panel) {
    panel = document.createElement('aside');
    panel.id = 'agentSuggestions';
    panel.className = 'agent-suggestions';
    document.body.appendChild(panel);
  }

  panel.innerHTML = `
    <div class="agent-suggestions-head">
      <p>Agent recommendations</p>
      <button type="button" class="agent-suggestions-close" aria-label="Close recommendations">&times;</button>
    </div>
    <div class="agent-suggestions-list">
      ${suggestions.map(product => `
        <div class="agent-suggestion-item">
          <div>
            <span>${product.name}</span>
            <small>${fmt(product.price)}</small>
          </div>
          <button type="button" data-agent-view="${product.id}">View Product</button>
        </div>
      `).join('')}
    </div>
  `;
}

function shouldIgnoreObservedNode(node) {
  const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
  if (!element || !element.closest) return true;

  return Boolean(element.closest([
    '#catalog-section',
    '#highlight-section',
    '#productDetailSection',
    '#cartDrawer',
    '#agentSuggestions',
    '.site-header',
    '.site-footer',
    '.toast'
  ].join(',')));
}

const observedAgentTexts = new Set();
function handleVisibleAgentText(text) {
  const compactText = text.replace(/\s+/g, ' ').trim();
  if (compactText.length < 12 || observedAgentTexts.has(compactText)) return;
  observedAgentTexts.add(compactText);

  if (handleAgentMessage(compactText)) return;

  const mentionedProducts = findMentionedProducts(compactText);
  if (mentionedProducts.length === 1) {
    const checkoutRequested = /proceeding to checkout:/i.test(compactText);
    const addedToCart = /added to cart:/i.test(compactText);

    if (checkoutRequested || addedToCart) {
      addToCart(mentionedProducts[0].id);
      if (checkoutRequested) openCart();
      return;
    }

    navigateToProduct(mentionedProducts[0].id, mentionedProducts[0].name);
    return;
  }

  if (mentionedProducts.length > 1) {
    renderAgentSuggestions(mentionedProducts);
  }
}

function setupAgentDomObserver() {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (shouldIgnoreObservedNode(node)) return;

        const text = node.textContent || '';
        if (text) handleVisibleAgentText(text);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function setupSalesforceListeners() {
  window.addEventListener('message', event => {
    handleAgentMessage(event.data);
  });

  window.addEventListener('lumina-agent-message', event => {
    handleAgentMessage(event.detail);
  });

  setupAgentDomObserver();
}

// ============ Cart State ============
const cart = [];

function addToCart(id) {
  const p = products.find(x => String(x.id) === String(id));
  if (!p) return;
  const existing = cart.find(c => String(c.id) === String(id));
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });
  renderCart();
  showToast(p.name + ' added to bag');
}

function removeFromCart(id) {
  const idx = cart.findIndex(c => String(c.id) === String(id));
  if (idx > -1) cart.splice(idx, 1);
  renderCart();
}

function renderCart() {
  const body = document.getElementById('cartBody');
  const count = document.getElementById('cartCount');
  const subtotal = document.getElementById('cartSubtotal');
  const total = document.getElementById('cartTotal');

  const qtyTotal = cart.reduce((s, c) => s + c.qty, 0);
  count.textContent = qtyTotal;
  count.classList.toggle('show', qtyTotal > 0);

  if (cart.length === 0) {
    body.innerHTML = '<p class="cart-empty">Your shopping bag is empty.</p>';
  } else {
    body.innerHTML = cart.map(c => `
      <div class="cart-item">
        <img src="${c.image}" alt="${c.name}" />
        <div class="cart-item-info">
          <p class="cart-item-name">${c.name}</p>
          <p class="cart-item-price">${fmt(c.price)} &middot; Qty ${c.qty}</p>
          <a class="cart-item-remove" href="#" data-remove="${c.id}">REMOVE</a>
        </div>
      </div>
    `).join('');
  }
  const sum = cart.reduce((s, c) => s + c.price * c.qty, 0);
  subtotal.textContent = fmt(sum);
  total.textContent = fmt(sum);
}

// ============ Cart Drawer ============
const drawer = document.getElementById('cartDrawer');
const overlay = document.getElementById('cartOverlay');
function openCart() { drawer.classList.add('open'); overlay.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
function closeCart() { drawer.classList.remove('open'); overlay.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }

document.getElementById('cartToggle').addEventListener('click', openCart);
document.getElementById('cartClose').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

// Delegated clicks for add / remove
document.addEventListener('click', (e) => {
  const addBtn = e.target.closest('[data-add]');
  if (addBtn) { addToCart(addBtn.dataset.add); return; }
  const rmBtn = e.target.closest('[data-remove]');
  if (rmBtn) { e.preventDefault(); removeFromCart(rmBtn.dataset.remove); }
  const productLink = e.target.closest('[data-product-link]');
  if (productLink) { navigateToProduct(productLink.dataset.productLink); }
  const suggestionView = e.target.closest('[data-agent-view]');
  if (suggestionView) { navigateToProduct(suggestionView.dataset.agentView); }
  const suggestionsClose = e.target.closest('.agent-suggestions-close');
  if (suggestionsClose) { document.getElementById('agentSuggestions')?.remove(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;

  const productLink = e.target.closest('[data-product-link]');
  if (!productLink) return;

  e.preventDefault();
  navigateToProduct(productLink.dataset.productLink);
});

// ============ Carousel Controls ============
const grid = () => document.getElementById('catalogGrid');
document.getElementById('carouselPrev').addEventListener('click', () => grid().scrollBy({ left: -360, behavior: 'smooth' }));
document.getElementById('carouselNext').addEventListener('click', () => grid().scrollBy({ left: 360, behavior: 'smooth' }));

// ============ Toast ============
let toastEl;
function showToast(msg) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toastEl.classList.remove('show'), 2200);
}

// ============ Init ============
renderCatalog();
renderHighlights();
renderCart();
setupSalesforceListeners();
handleRouting();
window.addEventListener('hashchange', handleRouting);

window.LuminaAgentNavigation = {
  handleAgentMessage,
  handleAgentCartCommand,
  handleVisibleAgentText,
  navigateToProduct
};
