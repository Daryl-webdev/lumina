// ============ Product Data ============
const IMG_BASE = 'https://storage.googleapis.com/lumina-jewelry-demo-qiugel/images/';
const img = (n) => IMG_BASE + 'Gemini_Generated_Image_qiugelqiugelqiug' + (n === 0 ? '' : ' (' + n + ')') + '.png';

const products = [
  { id: 1,  name: 'Gold Solitaire Diamond Ring',   category: 'Rings', price: 4500, highlight: true,
    desc: 'A brilliant round solitaire diamond set in an elegant 18k yellow gold band. A timeless symbol of love.',
    image: img(0) },
  { id: 2,  name: 'Platinum Diamond Halo Ring',    category: 'Rings', price: 5800, highlight: false,
    desc: 'A stunning round-cut diamond framed by a delicate halo of sparkling micro-pavé diamonds on a polished platinum band.',
    image: img(1) },
  { id: 3,  name: 'Gold Three-Stone Ring',         category: 'Rings', price: 6400, highlight: true,
    desc: 'An exquisite round-cut diamond flanked by two matching side diamonds on an 18k yellow gold band, representing past, present, and future.',
    image: img(2) },
  { id: 4,  name: 'Platinum Pavé Diamond Band',    category: 'Rings', price: 3200, highlight: true,
    desc: 'A half-eternity wedding band encrusted with three rows of brilliant pavé-set diamonds in polished platinum.',
    image: img(3) },
  { id: 5,  name: 'Gold Eternity Diamond Ring',    category: 'Rings', price: 4200, highlight: false,
    desc: 'A solid 18k yellow gold eternity band set with a continuous circle of brilliant-cut diamonds, symbolizing eternal devotion.',
    image: img(4) },
  { id: 6,  name: 'Marquise Cut Solitaire Ring',   category: 'Rings', price: 5500, highlight: false,
    desc: 'A striking marquise-cut diamond set in a classic four-prong platinum band to elongate the finger and capture light.',
    image: img(5) },
  { id: 7,  name: 'Princess Cut Solitaire Ring',   category: 'Rings', price: 4900, highlight: false,
    desc: 'A classic princess-cut square diamond mounted on a sleek 18k yellow gold band for a modern, architectural look.',
    image: img(6) },
  { id: 8,  name: 'Cushion Cut Halo Ring',         category: 'Rings', price: 6100, highlight: false,
    desc: 'A soft cushion-cut diamond bordered by a sparkling halo of diamonds, set on a thin platinum band.',
    image: img(7) },
  { id: 9,  name: 'Vintage Filigree Bezel Ring',   category: 'Rings', price: 3800, highlight: false,
    desc: 'An intricate, antique-inspired gold ring featuring filigree details and an octagonal bezel-set diamond.',
    image: img(8) },
  { id: 10, name: 'Bezel Solitaire Platinum Ring', category: 'Rings', price: 4700, highlight: false,
    desc: 'A contemporary round solitaire diamond encased in a protective, modern bezel setting on a polished platinum band.',
    image: img(9) },
];

const fmt = (n) => '$' + n.toLocaleString('en-US');

// ============ Render Catalog ============
function renderCatalog() {
  const grid = document.getElementById('catalogGrid');
  grid.innerHTML = products.map(p => `
    <article class="product-card${p.highlight ? ' highlight' : ''}" data-id="${p.id}">
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
    <article class="highlight-card" data-id="${p.id}">
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

// ============ Cart State ============
const cart = [];

function addToCart(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  const existing = cart.find(c => c.id === id);
  if (existing) existing.qty++;
  else cart.push({ ...p, qty: 1 });
  renderCart();
  showToast(p.name + ' added to bag');
}

function removeFromCart(id) {
  const idx = cart.findIndex(c => c.id === id);
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
  if (addBtn) { addToCart(parseInt(addBtn.dataset.add, 10)); return; }
  const rmBtn = e.target.closest('[data-remove]');
  if (rmBtn) { e.preventDefault(); removeFromCart(parseInt(rmBtn.dataset.remove, 10)); }
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
