/**
 * UNRAVEL BEAUTY SECRETS — STOREFRONT APP & STATE ENGINE
 * "Botanical Atelier" Prototype Engine
 */

const PRODUCTS_DATA = [
  {
    id: 'kumkumadi-facial-oil',
    title: 'Kumkumadi Facial Oil',
    slug: 'kumkumadi-facial-oil',
    department: 'skin-care',
    category: 'facial-oils',
    categoryName: 'Face Serums / Oils',
    concerns: ['brightening', 'anti-ageing', 'skin-pigmentation'],
    price: 675,
    regularPrice: 900,
    size: '15 ml',
    variants: [{ size: '15 ml', price: 675, regularPrice: 900 }],
    inStock: true,
    badge: 'Bestseller',
    description: 'An authentic Ayurvedic facial oil infused with 22 potent botanicals including Kashmiri Saffron, Red Sandalwood, and Indian Madder to illuminate dull skin and improve texture.',
    ingredients: 'Kashmiri Saffron (Crocus sativus), Manjistha (Rubia cordifolia), Red Sandalwood (Pterocarpus santalinus), Padmaka, Licorice, Cold-pressed Sesame Oil.',
    howToUse: 'After cleansing and toning with Rose Water, dispense 2–3 drops onto clean fingertips. Gently press and massage into face and neck in upward circular strokes until absorbed. Best used as an evening ritual.',
    colorTheme: 'blush'
  },
  {
    id: '24-hour-intense-am-pm-moisturiser',
    title: '24-Hour Intense AM/PM Moisturiser',
    slug: '24-hour-intense-am-pm-moisturiser',
    department: 'skin-care',
    category: 'moisturisers',
    categoryName: 'Moisturisers',
    concerns: ['dehydration', 'anti-ageing'],
    price: 900,
    regularPrice: 900,
    size: '50 g',
    variants: [{ size: '50 g', price: 900, regularPrice: 900 }],
    inStock: true,
    badge: 'Essential',
    description: 'A deeply hydrating, barrier-restoring daily moisturiser enriched with plant squalane, hyaluronic acid, and Ayurvedic herbs that seals in moisture from morning till night.',
    ingredients: 'Aqua, Shea Butter, Plant Squalane, Hyaluronic Acid, Gotu Kola Extract, Green Tea Extract, Almond Oil.',
    howToUse: 'Take a dime-sized amount and smooth evenly over cleansed face and neck every morning and evening.',
    colorTheme: 'sage'
  },
  {
    id: 'vitamin-c-hyaluronic-acid-night-cream',
    title: 'Vitamin C + Hyaluronic Acid Night Cream',
    slug: 'vitamin-c-hyaluronic-acid-night-cream',
    department: 'skin-care',
    category: 'moisturisers',
    categoryName: 'Moisturisers',
    concerns: ['brightening', 'anti-ageing'],
    price: 750,
    regularPrice: 750,
    size: '50 g',
    variants: [{ size: '50 g', price: 750, regularPrice: 750 }],
    inStock: true,
    badge: 'PM Care',
    description: 'A rich overnight restorative cream pairing stabilized Vitamin C with Botanical Hyaluronic Acid to brighten dark spots and promote overnight cell renewal.',
    ingredients: 'Aqua, 3-O-Ethyl Ascorbic Acid, Sodium Hyaluronate, Niacinamide, Licorice Root Extract, Rosehip Oil.',
    howToUse: 'Apply a generous layer as the final step of your PM skincare routine. Massage gently into skin.',
    colorTheme: 'blush'
  },
  {
    id: 'volume-hair-oil',
    title: 'Volume Hair Oil',
    slug: 'volume-hair-oil',
    department: 'hair-care',
    category: 'hair-oils',
    categoryName: 'Hair Oils',
    concerns: ['hair-loss-and-thinning', 'dry-and-frizzy'],
    price: 360,
    regularPrice: 450,
    size: '110 ml',
    variants: [
      { size: '110 ml', price: 360, regularPrice: 450 },
      { size: '220 ml', price: 595, regularPrice: 850 }
    ],
    inStock: true,
    badge: 'Iconic',
    description: 'An ancient blend of 7 pure cold-pressed oils including Moroccan Argan, Jojoba, and Sweet Almond that fortifies hair roots, restores shine, and prevents thinning.',
    ingredients: 'Moroccan Argan Oil, Cold-pressed Sweet Almond Oil, Golden Jojoba Oil, Bhringraj, Rosemary Leaf Extract, Amla Oil.',
    howToUse: 'Warm a generous amount between palms. Section hair and massage deep into scalp and roots. Leave on for at least 2 hours or overnight before washing.',
    colorTheme: 'sage'
  },
  {
    id: 'premium-bridal-soap',
    title: 'Premium Bridal Soap',
    slug: 'premium-bridal-soap',
    department: 'skin-care',
    category: 'handcrafted-soaps',
    categoryName: 'Handcrafted Soaps',
    concerns: ['brightening', 'anti-tan'],
    price: 175,
    regularPrice: 175,
    size: '100 g',
    variants: [{ size: '100 g', price: 175, regularPrice: 175 }],
    inStock: true,
    badge: 'Handmade',
    description: 'Artisanal cold-process soap handcrafted with pure saffron strands, goat milk, and raw honey. Gently cleanses while imparting a natural bridal glow.',
    ingredients: 'Saponified Cold-Pressed Coconut Oil, Raw Goat Milk, Kashmiri Saffron, Turmeric, Raw Forest Honey, Almond Oil.',
    howToUse: 'Lather between wet palms or with a loofah. Massage across body and face, then rinse thoroughly with tepid water.',
    colorTheme: 'blush'
  },
  {
    id: 'sandalwood-and-saffron-rose-water',
    title: 'Sandalwood and Saffron Rose Water',
    slug: 'sandalwood-and-saffron-rose-water',
    department: 'skin-care',
    category: 'toners',
    categoryName: 'Toners',
    concerns: ['brightening', 'dehydration'],
    price: 140,
    regularPrice: 140,
    size: '100 ml',
    variants: [{ size: '100 ml', price: 140, regularPrice: 140 }],
    inStock: true,
    badge: 'Popular',
    description: 'Pure steam-distilled Kannauj rose petals infused with Indian red sandalwood and saffron threads to balance skin pH and impart deep hydration.',
    ingredients: 'Steam-distilled Rosa Damascena Flower Water, Santalum Album (Sandalwood) Extract, Crocus Sativus (Saffron) Extract.',
    howToUse: 'Mist generously over cleansed face and neck morning and night, or throughout the day for a refreshing boost.',
    colorTheme: 'sage'
  },
  {
    id: 'pure-rose-water',
    title: 'Pure Rose Water',
    slug: 'pure-rose-water',
    department: 'skin-care',
    category: 'toners',
    categoryName: 'Toners',
    concerns: ['dehydration', 'anti-acne'],
    price: 120,
    regularPrice: 120,
    size: '100 ml',
    variants: [{ size: '100 ml', price: 120, regularPrice: 120 }],
    inStock: true,
    badge: '',
    description: '100% pure distilled rose water crafted from handpicked indigenous roses without added alcohol or synthetic fragrances.',
    ingredients: '100% Pure Steam Distilled Rosa Centifolia Floral Water.',
    howToUse: 'Spray directly on face or apply with a cotton pad after cleansing.',
    colorTheme: 'blush'
  },
  {
    id: 'luxurious-anti-tan-pack',
    title: 'Luxurious Anti-Tan Face Pack',
    slug: 'luxurious-anti-tan-pack',
    department: 'skin-care',
    category: 'face-packs-scrub',
    categoryName: 'Face Pack & Scrub',
    concerns: ['anti-tan', 'brightening', 'skin-pigmentation'],
    price: 449,
    regularPrice: 449,
    size: '50 g',
    variants: [
      { size: '50 g', price: 449, regularPrice: 449 },
      { size: '100 g', price: 799, regularPrice: 799 }
    ],
    inStock: true,
    badge: 'Ayurvedic',
    description: 'A traditional clay and herb formulation with Multani Mitti, Papaya fruit powder, and Sandalwood to gently draw out sun damage and clarify tone.',
    ingredients: 'Fuller’s Earth (Multani Mitti), Papaya Extract, White Sandalwood Powder, Kasturi Manjal, Orange Peel Powder.',
    howToUse: 'Mix 1–2 teaspoons with Rose Water or milk to form a smooth paste. Apply evenly to face and neck, leave for 15 minutes, then rinse.',
    colorTheme: 'sage'
  },
  {
    id: 'premium-body-polish',
    title: 'Premium Body Polish',
    slug: 'premium-body-polish',
    department: 'body-care',
    category: 'body-scrubs',
    categoryName: 'Body Scrubs',
    concerns: ['tan-removal', 'nourishment'],
    price: 550,
    regularPrice: 550,
    size: '100 g',
    variants: [{ size: '100 g', price: 550, regularPrice: 550 }],
    inStock: true,
    badge: 'Body Ritual',
    description: 'Exfoliating botanical body polish blending fine cane sugar crystals with cold-pressed coconut oil and crushed botanical flowers to buff away roughness.',
    ingredients: 'Organic Cane Sugar Crystals, Cold-pressed Virgin Coconut Oil, Sweet Almond Oil, Jasmine Essential Oil, Vitamin E.',
    howToUse: 'Scoop a palmful onto damp skin in the shower. Gently buff in circular motions before rinsing thoroughly.',
    colorTheme: 'blush'
  },
  {
    id: 'lavender-essential-oil',
    title: 'Lavender Essential Oil',
    slug: 'lavender-essential-oil',
    department: 'wellness',
    category: 'essential-oils',
    categoryName: 'Essential Oils',
    concerns: ['de-stress', 'insomnia'],
    price: 180,
    regularPrice: 180,
    size: '10 ml',
    variants: [{ size: '10 ml', price: 180, regularPrice: 180 }],
    inStock: true,
    badge: 'Pure Oil',
    description: '100% pure steam-distilled Lavender (Lavandula angustifolia) essential oil known for its calming, stress-relieving botanical aroma.',
    ingredients: '100% Pure Steam Distilled Lavandula Angustifolia Essential Oil.',
    howToUse: 'Add 4–5 drops to an aroma diffuser or mix 2 drops with a carrier oil for an evening relaxation massage.',
    colorTheme: 'sage'
  },
  {
    id: 'rosemary-essential-oil',
    title: 'Rosemary Essential Oil',
    slug: 'rosemary-essential-oil',
    department: 'wellness',
    category: 'essential-oils',
    categoryName: 'Essential Oils',
    concerns: ['concentration', 'fatigue'],
    price: 270,
    regularPrice: 270,
    size: '10 ml',
    variants: [{ size: '10 ml', price: 270, regularPrice: 270 }],
    inStock: true,
    badge: 'Pure Oil',
    description: 'Invigorating pure rosemary essential oil with sharp herbal clarity to elevate mental focus and support scalp stimulation.',
    ingredients: '100% Pure Steam Distilled Rosmarinus Officinalis Essential Oil.',
    howToUse: 'Diffuse in work or study spaces, or dilute with Volume Hair Oil to boost scalp massage benefits.',
    colorTheme: 'sage'
  },
  {
    id: 'sandalwood-essential-oil',
    title: 'Sandalwood Essential Oil',
    slug: 'sandalwood-essential-oil',
    department: 'wellness',
    category: 'essential-oils',
    categoryName: 'Essential Oils',
    concerns: ['de-stress', 'happy-skin'],
    price: 400,
    regularPrice: 400,
    size: '10 ml',
    variants: [{ size: '10 ml', price: 400, regularPrice: 400 }],
    inStock: false,
    badge: 'Out of stock',
    description: 'Deep, grounding East Indian Sandalwood essential oil. Highly prized for meditation, aromatic elevation, and skin soothing.',
    ingredients: '100% Pure Santalum Album Wood Essential Oil.',
    howToUse: 'Diffuse for calming ambient aromatherapy.',
    colorTheme: 'blush'
  },
  {
    id: 'nutritional-snacks',
    title: 'Nutritional Snacks',
    slug: 'nutritional-snacks',
    department: 'wellness',
    category: 'healthy-snacks',
    categoryName: 'Healthy Snacks',
    concerns: ['fatigue', 'happy-skin'],
    price: 350,
    regularPrice: 350,
    size: '200 g',
    variants: [{ size: '200 g', price: 350, regularPrice: 350 }],
    inStock: true,
    badge: 'Nourish',
    description: 'A wholesome, lightly roasted blend of Ayurvedic seeds, roasted almonds, foxnuts (makhana), and dried berries for mindful everyday snacking.',
    ingredients: 'Roasted Makhana, Almonds, Pumpkin Seeds, Watermelon Seeds, Cranberries, Himalayan Pink Salt, Cold-pressed Ghee.',
    howToUse: 'Enjoy as a mindful midday snack.',
    colorTheme: 'blush'
  }
];

// App State
const AppState = {
  currentRoute: 'home',
  cart: [
    { productId: 'kumkumadi-facial-oil', size: '15 ml', qty: 1, price: 675 },
    { productId: '24-hour-intense-am-pm-moisturiser', size: '50 g', qty: 1, price: 900 }
  ],
  wishlist: ['kumkumadi-facial-oil', 'volume-hair-oil'],
  appliedCoupon: null,
  activeDepartment: 'skin-care',
  activeCategoryFilter: 'all',
  activeConcernFilter: 'all',
  pdpVariant: null,
  pdpProduct: null,
  routineMode: 'pm',
  isMiniBagOpen: false,
  isSupportOpen: false,
  isSearchOpen: false,
  isMobileNavOpen: false,
  isMegaMenuOpen: false,
  searchQuery: '',
  selectedShippingMode: 'prepaid', // 'prepaid' or 'cod'
  addresses: {
    fullName: 'Pooja Sharma',
    email: 'pooja.sharma@example.in',
    phone: '+91 98301 23456',
    street: '14 Lake View Road',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700029',
    billingSame: true
  }
};

// State Helpers
function getProduct(id) {
  return PRODUCTS_DATA.find(p => p.id === id || p.slug === id);
}

function getSubtotal() {
  return AppState.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
}

function getDiscount() {
  if (!AppState.appliedCoupon) return 0;
  if (AppState.appliedCoupon === 'WELCOME10') {
    return Math.round(getSubtotal() * 0.10);
  }
  return 0;
}

function getShippingFee() {
  const subtotal = getSubtotal();
  if (subtotal >= 1999 || subtotal === 0) return 0;
  return AppState.selectedShippingMode === 'cod' ? 100 : 50;
}

function getTotal() {
  return Math.max(0, getSubtotal() - getDiscount() + getShippingFee());
}

function showToast(message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>🌿</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Actions
function addToCart(productId, size = null, qty = 1) {
  const product = getProduct(productId);
  if (!product || !product.inStock) {
    showToast('This product is currently out of stock.');
    return;
  }
  const chosenSize = size || product.size;
  const variant = product.variants.find(v => v.size === chosenSize) || product.variants[0];
  
  const existing = AppState.cart.find(item => item.productId === productId && item.size === chosenSize);
  if (existing) {
    existing.qty += qty;
  } else {
    AppState.cart.push({
      productId,
      size: chosenSize,
      qty,
      price: variant.price
    });
  }
  updateBadges();
  renderMiniBag();
  openDrawer('mini-bag');
  showToast(`Added ${product.title} to your bag`);
}

function removeFromCart(productId, size) {
  const index = AppState.cart.findIndex(i => i.productId === productId && i.size === size);
  if (index > -1) {
    const item = AppState.cart[index];
    const product = getProduct(item.productId);
    AppState.cart.splice(index, 1);
    updateBadges();
    renderMiniBag();
    if (AppState.currentRoute === 'cart' || AppState.currentRoute === 'checkout') {
      renderCurrentRoute();
    }
    showToast(`Removed ${product ? product.title : 'item'} from bag`);
  }
}

function updateCartQty(productId, size, delta) {
  const item = AppState.cart.find(i => i.productId === productId && i.size === size);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(productId, size);
      return;
    }
    updateBadges();
    renderMiniBag();
    if (AppState.currentRoute === 'cart' || AppState.currentRoute === 'checkout') {
      renderCurrentRoute();
    }
  }
}

function toggleWishlist(productId) {
  const index = AppState.wishlist.indexOf(productId);
  const product = getProduct(productId);
  if (index > -1) {
    AppState.wishlist.splice(index, 1);
    showToast(`Removed from favourites`);
  } else {
    AppState.wishlist.push(productId);
    showToast(`Saved ${product.title} to favourites`);
  }
  updateBadges();
  renderCurrentRoute();
}

function updateBadges() {
  const cartCount = AppState.cart.reduce((sum, i) => sum + i.qty, 0);
  const wishlistCount = AppState.wishlist.length;
  
  document.querySelectorAll('.cart-badge-count').forEach(el => {
    el.textContent = cartCount;
    el.classList.remove('badge-pop');
    void el.offsetWidth; // trigger reflow
    el.classList.add('badge-pop');
  });
  document.querySelectorAll('.wishlist-badge-count').forEach(el => {
    el.textContent = wishlistCount;
    el.classList.remove('badge-pop');
    void el.offsetWidth;
    el.classList.add('badge-pop');
  });
}

// Drawer Controls
function openDrawer(drawerName) {
  closeAllDrawers();
  const backdrop = document.getElementById('drawer-backdrop');
  if (backdrop) backdrop.classList.add('active');
  
  if (drawerName === 'mini-bag') {
    const d = document.getElementById('mini-bag-drawer');
    if (d) d.classList.add('active');
    AppState.isMiniBagOpen = true;
    renderMiniBag();
  } else if (drawerName === 'support') {
    const d = document.getElementById('support-drawer');
    if (d) d.classList.add('active');
    AppState.isSupportOpen = true;
  } else if (drawerName === 'search') {
    const d = document.getElementById('search-modal');
    if (d) d.classList.add('active');
    AppState.isSearchOpen = true;
    setTimeout(() => {
      const inp = document.getElementById('search-modal-input');
      if (inp) inp.focus();
    }, 100);
  } else if (drawerName === 'mobile-nav') {
    const d = document.getElementById('mobile-nav-drawer');
    if (d) d.classList.add('active');
    AppState.isMobileNavOpen = true;
  }
}

function closeAllDrawers() {
  const backdrop = document.getElementById('drawer-backdrop');
  if (backdrop) backdrop.classList.remove('active');
  
  document.querySelectorAll('.side-drawer, .search-modal').forEach(el => el.classList.remove('active'));
  AppState.isMiniBagOpen = false;
  AppState.isSupportOpen = false;
  AppState.isSearchOpen = false;
  AppState.isMobileNavOpen = false;
}

// Navigation & Routing
function navigateTo(route, param = null) {
  window.scrollTo({ top: 0, behavior: 'smooth' });
  closeAllDrawers();
  
  if (route.startsWith('product:')) {
    const slug = route.split(':')[1];
    AppState.currentRoute = 'product-detail';
    AppState.pdpProduct = getProduct(slug) || PRODUCTS_DATA[0];
    AppState.pdpVariant = AppState.pdpProduct.variants[0];
  } else {
    AppState.currentRoute = route;
    if (param) {
      if (route === 'department') AppState.activeDepartment = param;
    }
  }
  
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.dataset.route === route || (route === 'department' && link.dataset.dept === param)) {
      link.classList.add('active');
    }
  });

  renderCurrentRoute();
}

// View Rendering
function renderMiniBag() {
  const body = document.getElementById('mini-bag-body');
  const footer = document.getElementById('mini-bag-footer');
  if (!body || !footer) return;
  
  if (AppState.cart.length === 0) {
    body.innerHTML = `
      <div style="text-align: center; padding: 48px 16px;">
        <div style="font-size: 2.4rem; margin-bottom: 12px; color: var(--color-aubergine);">✦</div>
        <h3 class="serif-editorial" style="font-size: 1.4rem; margin-bottom: 8px;">Your bag is empty</h3>
        <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-bottom: 24px;">Your next ritual starts here. Explore our handcrafted creations.</p>
        <button class="btn-primary" onclick="navigateTo('shop')">Explore the Collection</button>
      </div>
    `;
    footer.style.display = 'none';
    return;
  }
  
  footer.style.display = 'block';
  const subtotal = getSubtotal();
  const neededForFree = Math.max(0, 1999 - subtotal);
  const progressPct = Math.min(100, (subtotal / 1999) * 100);

  let itemsHtml = AppState.cart.map(item => {
    const product = getProduct(item.productId);
    if (!product) return '';
    return `
      <div class="mini-bag-item">
        <div class="mini-bag-thumb">
          <img src="${product.imageUrl || ''}" alt="${product.title}" style="max-height: 80%;" onerror="this.parentElement.innerHTML='<span style=\\'font-size:1.5rem;\\'>🌿</span>'">
        </div>
        <div>
          <h4 class="mini-bag-title">${product.title}</h4>
          <div class="mini-bag-meta">${item.size} — ₹${item.price}</div>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateCartQty('${item.productId}', '${item.size}', -1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateCartQty('${item.productId}', '${item.size}', 1)">+</button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between;">
          <span style="font-weight: 600; color: var(--color-aubergine);">₹${item.price * item.qty}</span>
          <button style="font-size: 0.75rem; color: var(--color-text-light); text-decoration: underline;" onclick="removeFromCart('${item.productId}', '${item.size}')">Remove</button>
        </div>
      </div>
    `;
  }).join('');

  body.innerHTML = itemsHtml;

  footer.innerHTML = `
    <div class="free-shipping-bar">
      ${neededForFree === 0 ? '🌿 <strong>Free domestic shipping unlocked!</strong>' : `Add <strong>₹${neededForFree}</strong> more for free domestic shipping`}
      <div class="shipping-progress">
        <div class="shipping-progress-fill" style="width: ${progressPct}%;"></div>
      </div>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
      <span style="font-family: var(--font-serif-display); font-size: 0.9rem; text-transform: uppercase;">Subtotal</span>
      <span style="font-weight: 700; color: var(--color-aubergine); font-size: 1.1rem;">₹${subtotal}</span>
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button class="btn-primary" style="width: 100%;" onclick="navigateTo('checkout')">Continue to Checkout</button>
      <button class="btn-secondary" style="width: 100%;" onclick="navigateTo('cart')">View Full Bag</button>
    </div>
  `;
}

// Main App Initializer
document.addEventListener('DOMContentLoaded', () => {
  updateBadges();
  renderCurrentRoute();

  // Close drawers when clicking backdrop
  const backdrop = document.getElementById('drawer-backdrop');
  if (backdrop) backdrop.addEventListener('click', closeAllDrawers);

  // Esc key closes drawers
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllDrawers();
  });
});

// ROUTE RENDERERS

function renderCurrentRoute() {
  const main = document.getElementById('main-content');
  if (!main) return;
  main.className = 'route-enter';
  
  const route = AppState.currentRoute;
  if (route === 'home') {
    renderHome(main);
  } else if (route === 'department' || route === 'shop') {
    renderCatalog(main);
  } else if (route === 'product-detail') {
    renderProductDetail(main);
  } else if (route === 'daily-rituals') {
    renderDailyRituals(main);
  } else if (route === 'about') {
    renderAbout(main);
  } else if (route === 'masterclass') {
    renderMasterclass(main);
  } else if (route === 'workshop-booking') {
    renderWorkshopBooking(main);
  } else if (route === 'cart') {
    renderCart(main);
  } else if (route === 'checkout') {
    renderCheckout(main);
  } else if (route === 'order-confirmation') {
    renderOrderConfirmation(main);
  } else if (route === 'account') {
    renderAccount(main);
  } else if (route === 'wishlist') {
    renderWishlist(main);
  } else if (route === 'search') {
    renderSearchPage(main);
  } else if (route === 'privacy-policy' || route === 'terms' || route === 'delivery-returns') {
    renderPolicyPage(main, route);
  } else if (route === '404') {
    render404(main);
  } else {
    renderHome(main);
  }
}

function renderProductCard(product) {
  const isFav = AppState.wishlist.includes(product.id);
  const isOutOfStock = !product.inStock;
  const isVariable = product.variants && product.variants.length > 1;
  const hasDiscount = product.regularPrice && product.regularPrice > product.price;

  return `
    <div class="product-card">
      <div class="product-image-wrap">
        ${product.badge ? `<span class="badge ${isOutOfStock ? 'badge-out-of-stock' : 'badge-blush'} product-card-badge">${product.badge}</span>` : ''}
        <button class="product-card-wishlist-btn ${isFav ? 'active' : ''}" onclick="toggleWishlist('${product.id}')" title="Save to Wishlist">
          ${isFav ? '♥' : '♡'}
        </button>
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; cursor: pointer;" onclick="navigateTo('product:${product.slug}')">
          <span style="font-size: 3.5rem;">🌿</span>
        </div>
      </div>
      <div class="product-info">
        <span class="product-category-tag">${product.categoryName}</span>
        <h3 class="product-title" style="cursor: pointer;" onclick="navigateTo('product:${product.slug}')">${product.title}</h3>
        <div class="product-price-row">
          <span class="product-price">${isVariable ? 'From ' : ''}₹${product.price}</span>
          ${hasDiscount ? `<span class="product-price-regular">₹${product.regularPrice}</span>` : ''}
          ${hasDiscount ? `<span class="product-discount-tag">${Math.round((1 - product.price/product.regularPrice)*100)}% off</span>` : ''}
        </div>
        ${isOutOfStock ? 
          `<button class="btn-secondary product-card-btn" disabled style="opacity: 0.6; cursor: not-allowed;">Out of Stock</button>` :
          isVariable ?
          `<button class="btn-secondary product-card-btn" onclick="navigateTo('product:${product.slug}')">Choose Size</button>` :
          `<button class="btn-primary product-card-btn" onclick="addToCart('${product.id}')">Add to Bag</button>`
        }
      </div>
    </div>
  `;
}

function renderHome(container) {
  const bestsellers = PRODUCTS_DATA.slice(0, 4);

  container.innerHTML = `
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="container hero-grid">
        <div>
          <span class="eyebrow">Rooted in Ayurveda. Made for Today.</span>
          <h1 class="serif-editorial hero-headline">Beauty,<br>in your own<br>nature.</h1>
          <p class="hero-description">Thoughtfully crafted skin, hair, and body rituals formulated with pure botanicals, cold-pressed oils, and ancient Ayurvedic wisdom.</p>
          <div class="hero-actions">
            <button class="btn-primary" onclick="navigateTo('department', 'skin-care')">Find Your Ritual</button>
            <button class="btn-secondary" onclick="navigateTo('shop')">Explore Bestsellers</button>
          </div>
        </div>
        <div class="hero-visual">
          <div style="text-align: center; padding: 48px;">
            <span style="font-size: 5rem; display: block; margin-bottom: 16px;">🏺</span>
            <span style="font-family: var(--font-serif-editorial); font-size: 1.6rem; color: var(--color-aubergine);">Botanical Atelier</span>
            <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 8px;">Kolkata, India • Handcrafted Care</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Trust Row -->
    <div class="container">
      <div class="trust-row">
        <span>Ayurvedic Roots</span>
        <span>•</span>
        <span>Handcrafted Care</span>
        <span>•</span>
        <span>Cruelty-Free</span>
        <span>•</span>
        <span>Clean Formulations</span>
      </div>
    </div>

    <!-- Category Discovery Tiles -->
    <section class="container" style="padding-top: var(--space-3xl);">
      <div class="section-header">
        <span class="eyebrow">Collections</span>
        <h2 class="section-title">Your everyday, elevated.</h2>
      </div>
      <div class="category-tiles-grid">
        <div class="category-tile" onclick="navigateTo('department', 'skin-care')" style="cursor: pointer;">
          <div class="category-tile-icon"><span style="font-size: 2.8rem;">🌸</span></div>
          <h3 class="category-tile-name">Skin Care</h3>
          <span style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">Serums, Toners & Moisturisers</span>
        </div>
        <div class="category-tile" onclick="navigateTo('department', 'hair-care')" style="cursor: pointer;">
          <div class="category-tile-icon"><span style="font-size: 2.8rem;">🌿</span></div>
          <h3 class="category-tile-name">Hair Care</h3>
          <span style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">Nourishing Oils & Masks</span>
        </div>
        <div class="category-tile" onclick="navigateTo('department', 'body-care')" style="cursor: pointer;">
          <div class="category-tile-icon"><span style="font-size: 2.8rem;">🛁</span></div>
          <h3 class="category-tile-name">Body Care</h3>
          <span style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">Polishes, Butters & Soaps</span>
        </div>
        <div class="category-tile" onclick="navigateTo('department', 'wellness')" style="cursor: pointer;">
          <div class="category-tile-icon"><span style="font-size: 2.8rem;">✨</span></div>
          <h3 class="category-tile-name">Wellness</h3>
          <span style="font-size: 0.8rem; color: var(--color-text-muted); margin-top: 6px;">Essential Oils & Healthy Snacks</span>
        </div>
      </div>
    </section>

    <!-- Bestsellers Grid -->
    <section class="container" style="padding: var(--space-3xl) var(--space-xl);">
      <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-2xl);">
        <div>
          <span class="eyebrow">Curated Icons</span>
          <h2 class="section-title" style="text-align: left;">The ones you will come back to.</h2>
        </div>
        <button class="btn-secondary" onclick="navigateTo('shop')">View All Products →</button>
      </div>
      <div class="product-grid">
        ${bestsellers.map(renderProductCard).join('')}
      </div>
    </section>

    <!-- Daily Ritual Editorial Highlight -->
    <section style="background-color: var(--color-sage-light); padding: var(--space-4xl) 0; margin: var(--space-3xl) 0;">
      <div class="container hero-grid">
        <div>
          <span class="eyebrow">The Daily Sequence</span>
          <h2 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine); margin-bottom: var(--space-md); line-height: 1.15;">A ritual, morning to moonlight.</h2>
          <p style="color: var(--color-text-muted); font-size: 1.05rem; line-height: 1.6; margin-bottom: var(--space-xl);">
            Ayurveda honors the natural rhythms of day and night. Balance your morning barrier protection and indulge in rich evening cell restoration with our curated rituals.
          </p>
          <button class="btn-primary" onclick="navigateTo('daily-rituals')">Explore the Ritual Builder →</button>
        </div>
        <div style="background: #FFFFFF; padding: var(--space-2xl); border: 1px solid var(--color-border);">
          <div style="display: flex; gap: 16px; margin-bottom: 24px; align-items: center;">
            <span style="font-size: 2rem;">☀️</span>
            <div>
              <strong style="display: block; font-size: 1rem;">AM: Energise & Shield</strong>
              <span style="font-size: 0.85rem; color: var(--color-text-muted);">Pure Rose Water + 24-Hour Moisturiser</span>
            </div>
          </div>
          <div style="display: flex; gap: 16px; align-items: center;">
            <span style="font-size: 2rem;">🌙</span>
            <div>
              <strong style="display: block; font-size: 1rem;">PM: Restore & Replenish</strong>
              <span style="font-size: 0.85rem; color: var(--color-text-muted);">Kumkumadi Tailam + Vitamin C Night Cream</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Masterclass Teaser -->
    <section class="container" style="padding-bottom: var(--space-4xl);">
      <div style="background: var(--color-blush-light); border: 1px solid var(--color-border); padding: var(--space-3xl); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
        <div style="max-width: 600px;">
          <span class="eyebrow">Learn with Unravel</span>
          <h2 class="serif-editorial" style="font-size: 2.2rem; color: var(--color-aubergine); margin-bottom: 12px;">The Art of Soap Making</h2>
          <p style="color: var(--color-text-muted); font-size: 0.95rem; line-height: 1.6;">
            Learn to craft five natural cold-process soap formulations with founders Namrata & Disha. New workshop dates and registration opening soon.
          </p>
        </div>
        <button class="btn-primary" onclick="navigateTo('masterclass')">View Masterclass Details</button>
      </div>
    </section>
  `;
}

function renderCatalog(container) {
  const dept = AppState.activeDepartment;
  const isShopAll = AppState.currentRoute === 'shop';
  
  let products = PRODUCTS_DATA;
  if (!isShopAll) {
    products = products.filter(p => p.department === dept);
  }

  if (AppState.activeCategoryFilter !== 'all') {
    products = products.filter(p => p.category === AppState.activeCategoryFilter);
  }

  if (AppState.activeConcernFilter !== 'all') {
    products = products.filter(p => p.concerns.includes(AppState.activeConcernFilter));
  }

  const deptNames = {
    'skin-care': 'Skin Care Collection',
    'hair-care': 'Hair Care Collection',
    'body-care': 'Body Care Collection',
    'wellness': 'Health & Wellness Department'
  };

  const deptTitle = isShopAll ? 'Shop All Rituals' : (deptNames[dept] || 'Catalog');

  container.innerHTML = `
    <div class="container">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>${deptTitle}</strong>
      </div>

      <div style="margin: var(--space-xl) 0 var(--space-2xl);">
        <span class="eyebrow">Botanical Atelier</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine); margin-bottom: 8px;">${deptTitle}</h1>
        <p style="color: var(--color-text-muted); font-size: 1.05rem;">Pure, ethically harvested Indian Ayurvedic ingredients crafted for elevated daily rituals.</p>
      </div>

      <!-- Department Tabs -->
      <div class="tab-headers">
        <div class="tab-header ${isShopAll ? 'active' : ''}" onclick="AppState.currentRoute='shop'; AppState.activeCategoryFilter='all'; AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">All (${PRODUCTS_DATA.length})</div>
        <div class="tab-header ${!isShopAll && dept === 'skin-care' ? 'active' : ''}" onclick="AppState.currentRoute='department'; AppState.activeDepartment='skin-care'; AppState.activeCategoryFilter='all'; AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">Skin Care</div>
        <div class="tab-header ${!isShopAll && dept === 'hair-care' ? 'active' : ''}" onclick="AppState.currentRoute='department'; AppState.activeDepartment='hair-care'; AppState.activeCategoryFilter='all'; AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">Hair Care</div>
        <div class="tab-header ${!isShopAll && dept === 'body-care' ? 'active' : ''}" onclick="AppState.currentRoute='department'; AppState.activeDepartment='body-care'; AppState.activeCategoryFilter='all'; AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">Body Care</div>
        <div class="tab-header ${!isShopAll && dept === 'wellness' ? 'active' : ''}" onclick="AppState.currentRoute='department'; AppState.activeDepartment='wellness'; AppState.activeCategoryFilter='all'; AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">Wellness</div>
      </div>

      <!-- Concern Filter Chips -->
      <div style="margin-bottom: 24px;">
        <span style="font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-light); margin-right: 12px;">Filter by Concern:</span>
        <div class="chips-row" style="display: inline-flex; margin-bottom: 0;">
          <button class="chip-btn ${AppState.activeConcernFilter === 'all' ? 'active' : ''}" onclick="AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">All Concerns</button>
          <button class="chip-btn ${AppState.activeConcernFilter === 'brightening' ? 'active' : ''}" onclick="AppState.activeConcernFilter='brightening'; renderCatalog(document.getElementById('main-content'));">Brightening</button>
          <button class="chip-btn ${AppState.activeConcernFilter === 'anti-tan' ? 'active' : ''}" onclick="AppState.activeConcernFilter='anti-tan'; renderCatalog(document.getElementById('main-content'));">Anti-Tan</button>
          <button class="chip-btn ${AppState.activeConcernFilter === 'anti-acne' ? 'active' : ''}" onclick="AppState.activeConcernFilter='anti-acne'; renderCatalog(document.getElementById('main-content'));">Acne Care</button>
          <button class="chip-btn ${AppState.activeConcernFilter === 'dehydration' ? 'active' : ''}" onclick="AppState.activeConcernFilter='dehydration'; renderCatalog(document.getElementById('main-content'));">Hydration</button>
          <button class="chip-btn ${AppState.activeConcernFilter === 'hair-loss-and-thinning' ? 'active' : ''}" onclick="AppState.activeConcernFilter='hair-loss-and-thinning'; renderCatalog(document.getElementById('main-content'));">Hair Loss</button>
          <button class="chip-btn ${AppState.activeConcernFilter === 'de-stress' ? 'active' : ''}" onclick="AppState.activeConcernFilter='de-stress'; renderCatalog(document.getElementById('main-content'));">De-stress</button>
        </div>
      </div>

      <!-- Catalog Main Grid -->
      <div class="catalog-layout">
        <aside class="catalog-sidebar">
          <div class="filter-group">
            <h4 class="filter-group-title">Categories</h4>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'all' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='all'; renderCatalog(document.getElementById('main-content'));"> All Categories</label>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'facial-oils' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='facial-oils'; renderCatalog(document.getElementById('main-content'));"> Facial Oils & Serums</label>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'moisturisers' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='moisturisers'; renderCatalog(document.getElementById('main-content'));"> Moisturisers</label>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'toners' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='toners'; renderCatalog(document.getElementById('main-content'));"> Toners & Waters</label>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'face-packs-scrub' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='face-packs-scrub'; renderCatalog(document.getElementById('main-content'));"> Face Packs</label>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'hair-oils' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='hair-oils'; renderCatalog(document.getElementById('main-content'));"> Hair Oils</label>
            <label class="filter-option"><input type="radio" name="cat" ${AppState.activeCategoryFilter === 'essential-oils' ? 'checked' : ''} onchange="AppState.activeCategoryFilter='essential-oils'; renderCatalog(document.getElementById('main-content'));"> Essential Oils</label>
          </div>
          <div class="filter-group">
            <h4 class="filter-group-title">Availability</h4>
            <label class="filter-option"><input type="checkbox" checked> In Stock Only</label>
          </div>
        </aside>

        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
            <span style="font-size: 0.88rem; color: var(--color-text-muted);">Showing <strong>${products.length}</strong> items</span>
            <select style="padding: 8px 12px; border: 1px solid var(--color-border); background: #FFF;">
              <option>Sort by: Featured</option>
              <option>Price: Low to High</option>
              <option>Price: High to Low</option>
            </select>
          </div>

          ${products.length === 0 ? `
            <div style="text-align: center; padding: 64px 0;">
              <span style="font-size: 2.5rem; display: block; margin-bottom: 12px;">✦</span>
              <h3 class="serif-editorial" style="font-size: 1.5rem; margin-bottom: 8px;">No rituals found matching these filters</h3>
              <p style="color: var(--color-text-muted); margin-bottom: 24px;">Try clearing concern or category filters to see more rituals.</p>
              <button class="btn-secondary" onclick="AppState.activeCategoryFilter='all'; AppState.activeConcernFilter='all'; renderCatalog(document.getElementById('main-content'));">Reset All Filters</button>
            </div>
          ` : `
            <div class="product-grid">
              ${products.map(renderProductCard).join('')}
            </div>
          `}
        </div>
      </div>
    </div>
  `;
}

function renderProductDetail(container) {
  const p = AppState.pdpProduct || PRODUCTS_DATA[0];
  const v = AppState.pdpVariant || p.variants[0];
  const isFav = AppState.wishlist.includes(p.id);
  const isOutOfStock = !p.inStock;

  container.innerHTML = `
    <div class="container">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <a href="#" onclick="navigateTo('department', '${p.department}'); return false;">${p.department.replace('-', ' ').toUpperCase()}</a>
        <span>/</span>
        <strong>${p.title}</strong>
      </div>

      <div class="pdp-grid">
        <!-- Gallery -->
        <div class="pdp-gallery">
          <div class="pdp-thumbnails">
            <div class="pdp-thumb active"><span style="font-size: 1.8rem;">🌿</span></div>
            <div class="pdp-thumb"><span style="font-size: 1.8rem;">🌸</span></div>
            <div class="pdp-thumb"><span style="font-size: 1.8rem;">✨</span></div>
          </div>
          <div class="pdp-main-image">
            <div style="text-align: center; padding: 32px;">
              <span style="font-size: 7rem; display: block; margin-bottom: 16px;">🏺</span>
              <span class="badge badge-saffron">Authentic Ayurvedic Formulation</span>
            </div>
          </div>
        </div>

        <!-- Details & Buy Box -->
        <div>
          <span class="eyebrow">The Ritual Selection</span>
          <h1 class="pdp-title">${p.title}</h1>
          <p class="pdp-desc">${p.description}</p>

          <div class="pdp-price-row">
            <span class="pdp-price">₹${v.price}</span>
            ${v.regularPrice > v.price ? `<span class="pdp-regular-price">₹${v.regularPrice}</span>` : ''}
            ${v.regularPrice > v.price ? `<span class="badge badge-blush">${Math.round((1 - v.price/v.regularPrice)*100)}% off</span>` : ''}
          </div>

          <!-- Size Variant Pills -->
          ${p.variants && p.variants.length > 1 ? `
            <div style="margin-bottom: 24px;">
              <span style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 8px;">Select Size:</span>
              <div style="display: flex; gap: 12px;">
                ${p.variants.map(varItem => `
                  <button class="chip-btn ${v.size === varItem.size ? 'active' : ''}" onclick="AppState.pdpVariant = getProduct('${p.id}').variants.find(x => x.size === '${varItem.size}'); renderProductDetail(document.getElementById('main-content'));">
                    ${varItem.size} — ₹${varItem.price}
                  </button>
                `).join('')}
              </div>
            </div>
          ` : `
            <div style="margin-bottom: 24px;">
              <span style="font-size: 0.8rem; color: var(--color-text-muted);">Size: <strong>${p.size}</strong></span>
            </div>
          `}

          <!-- Actions -->
          <div class="pdp-actions-row">
            ${isOutOfStock ? `
              <button class="btn-secondary" style="flex-grow: 1; opacity: 0.6;" disabled>Out of Stock</button>
              <button class="btn-primary" onclick="showToast('We will notify you when restocked.')">Notify Me</button>
            ` : `
              <button class="btn-primary" style="flex-grow: 1;" onclick="addToCart('${p.id}', '${v.size}', 1)">Add to Bag — ₹${v.price}</button>
              <button class="btn-secondary" style="padding: 14px 20px;" onclick="toggleWishlist('${p.id}')" title="Save to Wishlist">${isFav ? '♥' : '♡'}</button>
            `}
          </div>

          <!-- Pincode Delivery Check -->
          <div style="border-top: 1px solid var(--color-border); padding-top: 20px; margin-bottom: 24px;">
            <span style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; display: block; margin-bottom: 8px;">Delivery & Pincode check:</span>
            <div class="pdp-pincode-check">
              <input type="text" class="pdp-pincode-input" placeholder="Enter 6-digit PIN code" value="700029" maxlength="6">
              <button class="btn-secondary" style="padding: 10px 16px;" onclick="showToast('Standard Delhivery available in 3–5 days')">Check</button>
            </div>
            <span style="font-size: 0.8rem; color: var(--color-text-muted);">Dispatches in 1–2 days from Kolkata. Free domestic shipping above ₹1,999.</span>
          </div>

          <!-- Product Details Tabs -->
          <div style="margin-top: 32px;">
            <div class="tab-headers">
              <div class="tab-header active" id="tab-h-details" onclick="switchPdpTab('details')">The Details</div>
              <div class="tab-header" id="tab-h-ingredients" onclick="switchPdpTab('ingredients')">Ingredients</div>
              <div class="tab-header" id="tab-h-howtouse" onclick="switchPdpTab('howtouse')">How to Use</div>
              <div class="tab-header" id="tab-h-reviews" onclick="switchPdpTab('reviews')">Reviews (0)</div>
            </div>
            <div id="tab-c-details" class="tab-content">
              <p>${p.description}</p>
              <ul style="margin-top: 12px; padding-left: 20px;">
                <li>Suitable for all skin and dosha types</li>
                <li>100% natural, vegetarian & cruelty-free</li>
                <li>Free of parabens, mineral oils, and synthetic perfumes</li>
              </ul>
            </div>
            <div id="tab-c-ingredients" class="tab-content" style="display: none;">
              <p><strong>Key Actives:</strong></p>
              <p>${p.ingredients}</p>
            </div>
            <div id="tab-c-howtouse" class="tab-content" style="display: none;">
              <p>${p.howToUse}</p>
            </div>
            <div id="tab-c-reviews" class="tab-content" style="display: none;">
              <p style="color: var(--color-text-muted);">No verified reviews yet. Only verified purchasers may leave reviews on Unravel.</p>
              <button class="btn-secondary" style="margin-top: 12px; font-size: 0.8rem;" onclick="navigateTo('account')">Sign in to Review</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchPdpTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
  document.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
  
  const content = document.getElementById('tab-c-' + tabName);
  const header = document.getElementById('tab-h-' + tabName);
  if (content) content.style.display = 'block';
  if (header) header.classList.add('active');
}

function renderDailyRituals(container) {
  const isPM = AppState.routineMode === 'pm';

  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>Daily Skincare Routine</strong>
      </div>

      <div style="text-align: center; max-width: 720px; margin: var(--space-xl) auto var(--space-2xl);">
        <span class="eyebrow">Daily Skincare Routine</span>
        <h1 class="serif-editorial" style="font-size: 3.4rem; color: var(--color-aubergine); line-height: 1.1; margin-bottom: 16px;">From morning<br>to moonlight.</h1>
        <p style="color: var(--color-text-muted); font-size: 1.05rem;">Build a routine that feels like yours. Morning and evening are complementary phases of care.</p>
      </div>

      <!-- Routine Mode Switcher -->
      <div class="routine-toggle-container">
        <div class="routine-toggle">
          <button class="routine-toggle-btn ${!isPM ? 'active' : ''}" onclick="AppState.routineMode='am'; renderDailyRituals(document.getElementById('main-content'));">AM Routine (Morning)</button>
          <button class="routine-toggle-btn ${isPM ? 'active' : ''}" onclick="AppState.routineMode='pm'; renderDailyRituals(document.getElementById('main-content'));">PM Routine (Evening)</button>
        </div>
      </div>

      <!-- Steps Grid -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 32px;">
        <div class="curriculum-card" style="text-align: left; padding: 24px;">
          <span style="font-family: var(--font-serif-display); font-size: 1.2rem; color: var(--color-saffron); font-weight: 700;">01</span>
          <span class="eyebrow" style="margin-top: 8px;">Step One</span>
          <h3 class="serif-editorial" style="font-size: 1.4rem; margin-bottom: 8px;">Refresh & Balance</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 16px;">Mist pure steam-distilled rose water to tone and prepare skin for active nutrients.</p>
          <div style="background: var(--color-blush-light); padding: 16px; border: 1px solid var(--color-border); margin-bottom: 16px;">
            <strong>Sandalwood and Saffron Rose Water</strong>
            <span style="display: block; color: var(--color-aubergine); font-weight: 600; margin-top: 4px;">₹140</span>
          </div>
          <button class="btn-secondary" style="width: 100%;" onclick="addToCart('sandalwood-and-saffron-rose-water')">Add Step 01</button>
        </div>

        <div class="curriculum-card" style="text-align: left; padding: 24px;">
          <span style="font-family: var(--font-serif-display); font-size: 1.2rem; color: var(--color-saffron); font-weight: 700;">02</span>
          <span class="eyebrow" style="margin-top: 8px;">Step Two</span>
          <h3 class="serif-editorial" style="font-size: 1.4rem; margin-bottom: 8px;">${isPM ? 'Deep Care & Nourish' : 'Clarify & Shield'}</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 16px;">${isPM ? 'Massage 2–3 drops of authentic Kumkumadi Tailam into facial contours.' : 'Apply pure Rose Water followed by lightweight hydration.'}</p>
          <div style="background: var(--color-sage-light); padding: 16px; border: 1px solid var(--color-border); margin-bottom: 16px;">
            <strong>Kumkumadi Facial Oil</strong>
            <span style="display: block; color: var(--color-aubergine); font-weight: 600; margin-top: 4px;">₹675 (₹900 regular)</span>
          </div>
          <button class="btn-secondary" style="width: 100%;" onclick="addToCart('kumkumadi-facial-oil')">Add Step 02</button>
        </div>

        <div class="curriculum-card" style="text-align: left; padding: 24px;">
          <span style="font-family: var(--font-serif-display); font-size: 1.2rem; color: var(--color-saffron); font-weight: 700;">03</span>
          <span class="eyebrow" style="margin-top: 8px;">Step Three</span>
          <h3 class="serif-editorial" style="font-size: 1.4rem; margin-bottom: 8px;">${isPM ? 'Overnight Restorative' : 'Daily Hydration'}</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 16px;">${isPM ? 'Seal in moisture and botanical antioxidants with Vitamin C night cream.' : 'Lock in hydration with 24-Hour Intense Moisturiser.'}</p>
          <div style="background: var(--color-blush-light); padding: 16px; border: 1px solid var(--color-border); margin-bottom: 16px;">
            <strong>${isPM ? 'Vitamin C + Hyaluronic Acid Night Cream' : '24-Hour Intense AM/PM Moisturiser'}</strong>
            <span style="display: block; color: var(--color-aubergine); font-weight: 600; margin-top: 4px;">₹${isPM ? 750 : 900}</span>
          </div>
          <button class="btn-secondary" style="width: 100%;" onclick="addToCart('${isPM ? 'vitamin-c-hyaluronic-acid-night-cream' : '24-hour-intense-am-pm-moisturiser'}')">Add Step 03</button>
        </div>
      </div>

      <div style="text-align: center; margin-top: 48px;">
        <button class="btn-primary" onclick="addToCart('sandalwood-and-saffron-rose-water'); addToCart('kumkumadi-facial-oil'); addToCart('${isPM ? 'vitamin-c-hyaluronic-acid-night-cream' : '24-hour-intense-am-pm-moisturiser'}');">Add Complete ${isPM ? 'PM' : 'AM'} Routine to Bag</button>
      </div>
    </div>
  `;
}

function renderAbout(container) {
  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>Our Story</strong>
      </div>

      <div style="margin: var(--space-2xl) auto; max-width: 900px; text-align: center;">
        <span class="eyebrow">Our Story</span>
        <h1 class="serif-editorial" style="font-size: 3.5rem; color: var(--color-aubergine); line-height: 1.15; margin-bottom: 24px;">Nature gave us<br>a beautiful beginning.</h1>
        <p style="font-size: 1.15rem; line-height: 1.7; color: var(--color-text-muted);">
          What began as heartfelt, handmade care formulated for loved ones in Kolkata has blossomed into Unravel Beauty Secrets. Formulated with authentic Ayurvedic roots, our rituals honor purity, holistic balance, and timeless Indian traditions.
        </p>
      </div>

      <!-- Founders Note -->
      <div style="background: var(--color-blush-light); border: 1px solid var(--color-border); padding: var(--space-3xl); margin: var(--space-3xl) 0;">
        <span class="eyebrow">A Note from the Founders</span>
        <h2 class="serif-editorial" style="font-size: 2.2rem; color: var(--color-aubergine); margin-bottom: 16px;">Namrata & Disha</h2>
        <p style="font-size: 1.05rem; line-height: 1.7; color: var(--color-text-main); margin-bottom: 16px;">
          "We studied ancient Ayurvedic herbology and handcrafted our very first batches by hand, gifting body treatments and oils to close friends and family. The transformative feedback inspired us to create over 70 artisanal formulations. Every bottle and jar carries our promise: no synthetic shortcuts, just honest, therapeutic botanical care."
        </p>
        <span style="font-family: var(--font-serif-editorial); font-style: italic; color: var(--color-aubergine);">— Namrata & Disha, Founders of Unravel Beauty Secrets</span>
      </div>

      <!-- Values Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin: var(--space-3xl) 0;">
        <div style="padding: 24px; border: 1px solid var(--color-border); background: #FFF;">
          <span class="eyebrow">01</span>
          <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 8px;">Our Mission</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;">To bring unadulterated Ayurvedic botanicals into modern daily lifestyles with integrity and elegance.</p>
        </div>
        <div style="padding: 24px; border: 1px solid var(--color-border); background: #FFF;">
          <span class="eyebrow">02</span>
          <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 8px;">Our Vision</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;">Cultivating mindful, toxin-free personal care routines that honor the skin and preserve our planet.</p>
        </div>
        <div style="padding: 24px; border: 1px solid var(--color-border); background: #FFF;">
          <span class="eyebrow">03</span>
          <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 8px;">Our Essence</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;">Craftsmanship, transparency, and holistic wellness inspired by centuries of herbal wisdom.</p>
        </div>
        <div style="padding: 24px; border: 1px solid var(--color-border); background: #FFF;">
          <span class="eyebrow">04</span>
          <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 8px;">Our Inspiration</h3>
          <p style="font-size: 0.9rem; color: var(--color-text-muted); line-height: 1.5;">The rich heritage of Indian flora, from Kashmiri saffron fields to Kannauj rose valleys.</p>
        </div>
      </div>
    </div>
  `;
}

function renderMasterclass(container) {
  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>Masterclass</strong>
      </div>

      <div class="masterclass-hero">
        <span class="eyebrow">Unravel Masterclass</span>
        <h1 class="serif-editorial" style="font-size: 3.5rem; color: var(--color-aubergine); margin-bottom: 16px; line-height: 1.15;">The art of making<br>it yourself.</h1>
        <p style="color: var(--color-text-muted); font-size: 1.1rem; line-height: 1.6;">
          Explore the mindful craft of natural soap making. Learn traditional cold-process formulation, raw material sourcing, and herbal blending in our intimate workshop.
        </p>
      </div>

      <div style="background: var(--color-ivory-light); border: 1px solid var(--color-border); padding: 32px; margin-bottom: 48px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 24px;">
        <div>
          <span class="badge badge-saffron">Soap-Making Workshop</span>
          <h2 class="serif-editorial" style="font-size: 1.8rem; margin: 8px 0;">Natural Handcrafted Soap Workshop</h2>
          <p style="color: var(--color-text-muted); font-size: 0.9rem;">Previous listed fee: ₹999. New dates and curriculum are currently being finalized.</p>
        </div>
        <button class="btn-primary" onclick="navigateTo('workshop-booking')">View Workshop & Waitlist →</button>
      </div>

      <div class="section-header">
        <span class="eyebrow">Curriculum</span>
        <h2 class="section-title">Five formulations. A beautiful place to begin.</h2>
      </div>

      <div class="curriculum-grid">
        <div class="curriculum-card">
          <div class="curriculum-thumb"><span style="font-size: 2.2rem;">🖤</span></div>
          <h4 style="font-family: var(--font-serif-editorial); font-size: 1.1rem; margin-bottom: 4px;">Activated Charcoal</h4>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Deep pore detox</span>
        </div>
        <div class="curriculum-card">
          <div class="curriculum-thumb"><span style="font-size: 2.2rem;">🌱</span></div>
          <h4 style="font-family: var(--font-serif-editorial); font-size: 1.1rem; margin-bottom: 4px;">Pure Aloe Vera</h4>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Soothing hydration</span>
        </div>
        <div class="curriculum-card">
          <div class="curriculum-thumb"><span style="font-size: 2.2rem;">🍷</span></div>
          <h4 style="font-family: var(--font-serif-editorial); font-size: 1.1rem; margin-bottom: 4px;">Red Wine</h4>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Antioxidant barrier</span>
        </div>
        <div class="curriculum-card">
          <div class="curriculum-thumb"><span style="font-size: 2.2rem;">🏺</span></div>
          <h4 style="font-family: var(--font-serif-editorial); font-size: 1.1rem; margin-bottom: 4px;">3 Clay Detox</h4>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Clarifying mineral care</span>
        </div>
        <div class="curriculum-card">
          <div class="curriculum-thumb"><span style="font-size: 2.2rem;">🌹</span></div>
          <h4 style="font-family: var(--font-serif-editorial); font-size: 1.1rem; margin-bottom: 4px;">Rose & Lavender</h4>
          <span style="font-size: 0.8rem; color: var(--color-text-muted);">Aromatic nourishment</span>
        </div>
      </div>
    </div>
  `;
}

function renderWorkshopBooking(container) {
  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <a href="#" onclick="navigateTo('masterclass'); return false;">Masterclass</a>
        <span>/</span>
        <strong>Soap-Making Workshop Booking</strong>
      </div>

      <div class="pdp-grid">
        <div class="pdp-main-image" style="background: var(--color-blush-light);">
          <div style="text-align: center; padding: 48px;">
            <span style="font-size: 6rem; display: block; margin-bottom: 16px;">🧼</span>
            <span class="badge badge-saffron">Handcrafted Soap Workshop</span>
          </div>
        </div>

        <div>
          <span class="eyebrow">Workshop Detail</span>
          <h1 class="pdp-title">Natural Soap-Making Workshop</h1>
          <p class="pdp-desc">A guided masterclass teaching the science and craftsmanship of five cold-process Ayurvedic soaps with raw botanical ingredients.</p>

          <div style="background: var(--color-blush-light); border: 1px solid var(--color-border); padding: 24px; margin-bottom: 24px;">
            <strong style="color: var(--color-aubergine); display: block; margin-bottom: 6px;">Status: Session Registration Opening Soon</strong>
            <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: 16px;">
              The previous session was priced at ₹999. Upcoming batch dates and fee schedules will be announced to waitlist subscribers first.
            </p>
            <div style="display: flex; gap: 8px;">
              <input type="email" id="workshop-email" placeholder="Enter your email address" style="flex-grow: 1; padding: 10px 14px; border: 1px solid var(--color-border);">
              <button class="btn-primary" onclick="showToast('You are on the workshop waitlist!')">Get Notified</button>
            </div>
          </div>

          <div style="border-top: 1px solid var(--color-border); padding-top: 24px;">
            <h4 class="serif-editorial" style="font-size: 1.2rem; margin-bottom: 12px;">What is Included:</h4>
            <ul style="color: var(--color-text-muted); font-size: 0.9rem; line-height: 1.7; padding-left: 20px;">
              <li>Comprehensive formulation workbook with exact oil ratios</li>
              <li>Live interactive demonstration of lye calculation and safety</li>
              <li>Botanical sourcing guide for high-purity Ayurvedic herbs</li>
              <li>Direct Q&A with founders Namrata & Disha</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCart(container) {
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const total = getTotal();

  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>Shopping Bag</strong>
      </div>

      <div style="margin: var(--space-xl) 0 var(--space-2xl);">
        <span class="eyebrow">Review Your Bag</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine);">Your bag, beautifully chosen.</h1>
      </div>

      ${AppState.cart.length === 0 ? `
        <div style="text-align: center; padding: 64px 0;">
          <span style="font-size: 3rem; display: block; margin-bottom: 16px;">✦</span>
          <h3 class="serif-editorial" style="font-size: 1.6rem; margin-bottom: 8px;">Your bag is currently empty</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 24px;">Explore our handcrafted formulas and begin your ritual.</p>
          <button class="btn-primary" onclick="navigateTo('shop')">Discover Products</button>
        </div>
      ` : `
        <div style="display: grid; grid-template-columns: 1.5fr 1fr; gap: 48px;">
          <!-- Items List -->
          <div>
            ${AppState.cart.map(item => {
              const product = getProduct(item.productId);
              return `
                <div style="display: grid; grid-template-columns: 96px 1fr auto; gap: 20px; padding: 20px 0; border-bottom: 1px solid var(--color-border);">
                  <div style="width: 96px; height: 110px; background: var(--color-blush-light); display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 2.5rem;">🌿</span>
                  </div>
                  <div>
                    <h3 class="serif-editorial" style="font-size: 1.2rem; margin-bottom: 4px;">${product.title}</h3>
                    <span style="font-size: 0.85rem; color: var(--color-text-muted); display: block; margin-bottom: 12px;">Size: ${item.size} • ₹${item.price} each</span>
                    <div class="qty-control">
                      <button class="qty-btn" onclick="updateCartQty('${item.productId}', '${item.size}', -1)">−</button>
                      <span class="qty-num">${item.qty}</span>
                      <button class="qty-btn" onclick="updateCartQty('${item.productId}', '${item.size}', 1)">+</button>
                    </div>
                  </div>
                  <div style="text-align: right;">
                    <span style="font-weight: 700; color: var(--color-aubergine); font-size: 1.1rem; display: block; margin-bottom: 12px;">₹${item.price * item.qty}</span>
                    <button style="color: var(--color-text-light); font-size: 0.8rem; text-decoration: underline;" onclick="removeFromCart('${item.productId}', '${item.size}')">Remove</button>
                  </div>
                </div>
              `;
            }).join('')}

            <div style="margin-top: 24px;">
              <button class="btn-secondary" onclick="navigateTo('shop')">← Continue Shopping</button>
            </div>
          </div>

          <!-- Order Summary Card -->
          <div style="background: var(--color-blush-light); border: 1px solid var(--color-border); padding: 32px;">
            <h3 class="serif-editorial" style="font-size: 1.4rem; margin-bottom: 20px;">Order Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem;">
              <span>Subtotal</span>
              <span>₹${subtotal}</span>
            </div>
            ${discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.95rem; color: #27AE60;">
                <span>Coupon Discount (${AppState.appliedCoupon})</span>
                <span>−₹${discount}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 16px; font-size: 0.95rem;">
              <span>Estimated Shipping</span>
              <span>${shipping === 0 ? 'Free' : '₹' + shipping}</span>
            </div>

            <!-- Coupon Input -->
            <div style="display: flex; gap: 8px; margin-bottom: 24px;">
              <input type="text" id="coupon-code-input" placeholder="Promo code (try WELCOME10)" style="flex-grow: 1; padding: 10px 14px; border: 1px solid var(--color-border); background: #FFF;">
              <button class="btn-secondary" style="padding: 10px 16px;" onclick="applyCoupon()">Apply</button>
            </div>

            <div style="border-top: 1px solid var(--color-border); padding-top: 16px; display: flex; justify-content: space-between; margin-bottom: 24px;">
              <strong style="font-family: var(--font-serif-display); font-size: 1.1rem;">Total Payable</strong>
              <strong style="font-size: 1.3rem; color: var(--color-aubergine);">₹${total}</strong>
            </div>

            <button class="btn-primary" style="width: 100%;" onclick="navigateTo('checkout')">Proceed to Checkout</button>
          </div>
        </div>
      `}
    </div>
  `;
}

function applyCoupon() {
  const inp = document.getElementById('coupon-code-input');
  if (!inp) return;
  const code = inp.value.trim().toUpperCase();
  if (code === 'WELCOME10') {
    AppState.appliedCoupon = 'WELCOME10';
    showToast('Coupon WELCOME10 applied (10% off)!');
    renderCart(document.getElementById('main-content'));
  } else {
    showToast('Invalid coupon code.');
  }
}

function renderCheckout(container) {
  const subtotal = getSubtotal();
  const discount = getDiscount();
  const shipping = getShippingFee();
  const total = getTotal();

  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('cart'); return false;">Bag</a>
        <span>/</span>
        <strong>Secure Checkout</strong>
      </div>

      <div style="margin: var(--space-xl) 0 var(--space-2xl);">
        <span class="eyebrow">Step 2 of 2</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine);">A little closer to your ritual.</h1>
      </div>

      <div style="display: grid; grid-template-columns: 1.6fr 1fr; gap: 48px;">
        <!-- Form Area -->
        <div>
          <!-- Contact -->
          <div style="border: 1px solid var(--color-border); background: #FFF; padding: 24px; margin-bottom: 24px;">
            <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 16px;">1. Contact Information</h3>
            <div style="display: flex; gap: 16px; margin-bottom: 16px;">
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem;"><input type="radio" name="checkout_type" checked> Guest Checkout</label>
              <label style="display: flex; align-items: center; gap: 6px; font-size: 0.9rem;"><input type="radio" name="checkout_type" onclick="navigateTo('account')"> Have an account? Sign in</label>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <input type="email" placeholder="Email Address" value="${AppState.addresses.email}" style="padding: 12px; border: 1px solid var(--color-border);">
              <input type="tel" placeholder="Mobile Phone (+91)" value="${AppState.addresses.phone}" style="padding: 12px; border: 1px solid var(--color-border);">
            </div>
          </div>

          <!-- Shipping Address -->
          <div style="border: 1px solid var(--color-border); background: #FFF; padding: 24px; margin-bottom: 24px;">
            <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 16px;">2. Delivery Address</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <input type="text" placeholder="Full Name" value="${AppState.addresses.fullName}" style="padding: 12px; border: 1px solid var(--color-border);">
              <input type="text" placeholder="PIN Code" value="${AppState.addresses.pincode}" style="padding: 12px; border: 1px solid var(--color-border);">
            </div>
            <input type="text" placeholder="House / Flat / Street Address" value="${AppState.addresses.street}" style="width: 100%; padding: 12px; border: 1px solid var(--color-border); margin-bottom: 16px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <input type="text" placeholder="City" value="${AppState.addresses.city}" style="padding: 12px; border: 1px solid var(--color-border);">
              <input type="text" placeholder="State" value="${AppState.addresses.state}" style="padding: 12px; border: 1px solid var(--color-border);">
            </div>
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.9rem; color: var(--color-text-muted);">
              <input type="checkbox" checked> Billing address matches delivery address
            </label>
          </div>

          <!-- Payment Selection -->
          <div style="border: 1px solid var(--color-border); background: #FFF; padding: 24px; margin-bottom: 24px;">
            <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 16px;">3. Payment Mode</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <label style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid var(--color-border); cursor: pointer;">
                <span style="display: flex; align-items: center; gap: 10px;">
                  <input type="radio" name="payment_mode" value="prepaid" ${AppState.selectedShippingMode === 'prepaid' ? 'checked' : ''} onchange="AppState.selectedShippingMode='prepaid'; renderCheckout(document.getElementById('main-content'));">
                  <strong>Razorpay (UPI, Credit/Debit Card, Netbanking)</strong>
                </span>
                <span class="badge badge-sage">Recommended</span>
              </label>
              <label style="display: flex; align-items: center; justify-content: space-between; padding: 16px; border: 1px solid var(--color-border); cursor: pointer;">
                <span style="display: flex; align-items: center; gap: 10px;">
                  <input type="radio" name="payment_mode" value="cod" ${AppState.selectedShippingMode === 'cod' ? 'checked' : ''} onchange="AppState.selectedShippingMode='cod'; renderCheckout(document.getElementById('main-content'));">
                  <strong>Cash on Delivery (COD)</strong>
                </span>
                <span style="font-size: 0.85rem; color: var(--color-text-muted);">+₹50 fee</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Sidebar Summary -->
        <div style="background: var(--color-blush-light); border: 1px solid var(--color-border); padding: 32px; height: fit-content;">
          <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 16px;">Your Order (${AppState.cart.reduce((s,i)=>s+i.qty,0)} items)</h3>
          ${AppState.cart.map(item => {
            const p = getProduct(item.productId);
            return `
              <div style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 10px;">
                <span>${p.title} (${item.size}) × ${item.qty}</span>
                <span>₹${item.price * item.qty}</span>
              </div>
            `;
          }).join('')}
          <div style="border-top: 1px solid var(--color-border); margin: 16px 0; padding-top: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem;">
              <span>Subtotal</span><span>₹${subtotal}</span>
            </div>
            ${discount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 0.9rem; color: #27AE60;">
                <span>Discount</span><span>−₹${discount}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 0.9rem;">
              <span>Shipping (Delhivery)</span><span>${shipping === 0 ? 'Free' : '₹' + shipping}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1.2rem; color: var(--color-aubergine); border-top: 1px solid var(--color-border); padding-top: 12px; margin-bottom: 24px;">
              <span>Total Payable</span><span>₹${total}</span>
            </div>
            <button class="btn-primary" style="width: 100%;" onclick="navigateTo('order-confirmation')">Place Order — ₹${total}</button>
            <p style="font-size: 0.75rem; color: var(--color-text-light); text-align: center; margin-top: 12px;">
              By placing your order you agree to our Terms of Service & Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderOrderConfirmation(container) {
  container.innerHTML = `
    <div class="container" style="padding: var(--space-4xl) 0; max-width: 800px;">
      <div style="text-align: center; margin-bottom: 40px;">
        <span style="font-size: 3.5rem;">🌸</span>
        <span class="eyebrow" style="margin-top: 12px;">Order Confirmed</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine); margin-bottom: 12px;">Thank you, your ritual is being prepared.</h1>
        <p style="color: var(--color-text-muted); font-size: 1.05rem;">Order identifier: <strong>#UB-84920</strong> • A receipt has been emailed to ${AppState.addresses.email}</p>
      </div>

      <div style="background: #FFFFFF; border: 1px solid var(--color-border); padding: 32px; margin-bottom: 32px;">
        <h3 class="serif-editorial" style="font-size: 1.3rem; margin-bottom: 16px;">Delivery Timeline</h3>
        <div style="display: flex; justify-content: space-between; text-align: center; margin-bottom: 24px;">
          <div style="flex: 1;"><strong>Ordered</strong><br><span style="font-size: 0.8rem; color: var(--color-text-muted);">Today</span></div>
          <div style="flex: 1;"><strong>Dispatch</strong><br><span style="font-size: 0.8rem; color: var(--color-text-muted);">1–2 business days</span></div>
          <div style="flex: 1;"><strong>Delhivery Transit</strong><br><span style="font-size: 0.8rem; color: var(--color-text-muted);">3–8 business days</span></div>
        </div>
        <div style="border-top: 1px solid var(--color-border); padding-top: 16px; font-size: 0.9rem; color: var(--color-text-muted);">
          <strong>Shipping to:</strong> ${AppState.addresses.fullName}, ${AppState.addresses.street}, ${AppState.addresses.city}, ${AppState.addresses.state} - ${AppState.addresses.pincode}
        </div>
      </div>

      <div style="text-align: center;">
        <button class="btn-primary" onclick="navigateTo('home')">Return to Homepage</button>
      </div>
    </div>
  `;
}

function renderAccount(container) {
  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>My Account</strong>
      </div>

      <div style="margin: var(--space-xl) 0 var(--space-2xl);">
        <span class="eyebrow">Customer Dashboard</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine);">Your rituals, in one place.</h1>
      </div>

      <div style="display: grid; grid-template-columns: 260px 1fr; gap: 48px;">
        <!-- Sidebar -->
        <aside>
          <div style="border: 1px solid var(--color-border); background: #FFF; padding: 20px;">
            <h4 class="serif-editorial" style="font-size: 1.2rem; margin-bottom: 12px;">Pooja Sharma</h4>
            <span style="font-size: 0.85rem; color: var(--color-text-muted); display: block; margin-bottom: 20px;">pooja.sharma@example.in</span>
            <ul style="list-style: none; display: flex; flex-direction: column; gap: 12px; font-size: 0.9rem;">
              <li><strong style="color: var(--color-aubergine);">✦ Order History</strong></li>
              <li><a href="#" onclick="showToast('Address book view'); return false;">Saved Addresses</a></li>
              <li><a href="#" onclick="navigateTo('wishlist'); return false;">My Favourites (${AppState.wishlist.length})</a></li>
              <li><a href="#" onclick="showToast('Signed out'); return false;">Sign Out</a></li>
            </ul>
          </div>
        </aside>

        <!-- Orders -->
        <div>
          <h3 class="serif-editorial" style="font-size: 1.5rem; margin-bottom: 20px;">Recent Orders</h3>
          <div style="border: 1px solid var(--color-border); background: #FFF; padding: 24px;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 16px; margin-bottom: 16px;">
              <div>
                <strong>Order #UB-84920</strong>
                <span style="font-size: 0.85rem; color: var(--color-text-muted); display: block;">Placed 9 Sept 2026</span>
              </div>
              <span class="badge badge-saffron">Processing (1–2 days dispatch)</span>
            </div>
            <div style="display: flex; gap: 20px; align-items: center;">
              <span style="font-size: 2rem;">🌿</span>
              <div>
                <strong>Kumkumadi Facial Oil (15 ml) + 24-Hour Moisturiser</strong>
                <span style="display: block; font-size: 0.85rem; color: var(--color-text-muted);">Total: ₹1,625 • Prepaid via Razorpay</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderWishlist(container) {
  const items = AppState.wishlist.map(getProduct).filter(Boolean);

  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>Saved Favourites</strong>
      </div>

      <div style="margin: var(--space-xl) 0 var(--space-2xl);">
        <span class="eyebrow">Your Wishlist</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine);">Saved for a little later.</h1>
        <p style="color: var(--color-text-muted);">${items.length} favourite ${items.length === 1 ? 'ritual' : 'rituals'} saved</p>
      </div>

      ${items.length === 0 ? `
        <div style="text-align: center; padding: 64px 0;">
          <span style="font-size: 3rem; display: block; margin-bottom: 16px;">♡</span>
          <h3 class="serif-editorial" style="font-size: 1.5rem; margin-bottom: 8px;">Your wishlist is waiting</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 24px;">Save items as you browse to keep track of rituals you love.</p>
          <button class="btn-primary" onclick="navigateTo('shop')">Explore Collections</button>
        </div>
      ` : `
        <div class="product-grid">
          ${items.map(renderProductCard).join('')}
        </div>
      `}
    </div>
  `;
}

function renderSearchPage(container) {
  const q = AppState.searchQuery.toLowerCase();
  const matchedProducts = PRODUCTS_DATA.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q) || 
    p.concerns.some(c => c.includes(q))
  );

  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl);">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>Search Results</strong>
      </div>

      <div style="margin: var(--space-xl) 0 var(--space-2xl);">
        <span class="eyebrow">Search</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine);">Results for "${AppState.searchQuery || 'all'}"</h1>
        <p style="color: var(--color-text-muted);">Found ${matchedProducts.length} matching product rituals</p>
      </div>

      ${matchedProducts.length === 0 ? `
        <div style="text-align: center; padding: 64px 0;">
          <span style="font-size: 3rem; display: block; margin-bottom: 16px;">✦</span>
          <h3 class="serif-editorial" style="font-size: 1.5rem; margin-bottom: 8px;">No matching rituals found</h3>
          <p style="color: var(--color-text-muted); margin-bottom: 24px;">Try searching for "rose", "oil", "moisturiser", or "soap".</p>
          <button class="btn-secondary" onclick="AppState.searchQuery='rose'; renderSearchPage(document.getElementById('main-content'));">Search "rose"</button>
        </div>
      ` : `
        <div class="product-grid">
          ${matchedProducts.map(renderProductCard).join('')}
        </div>
      `}
    </div>
  `;
}

function renderPolicyPage(container, type) {
  const policies = {
    'privacy-policy': {
      title: 'Privacy Policy',
      content: 'At Unravel Beauty Secrets, we respect and safeguard the personal information of every visitor and customer. We collect contact and delivery details strictly to fulfil your orders, process secure payments via licensed gateways (Razorpay), and provide customer care. We never sell or exchange your personal data with third-party advertisers.'
    },
    'terms': {
      title: 'Terms & Conditions',
      content: 'Welcome to Unravel Beauty Secrets. By accessing and ordering through our store, you agree to our terms of service, fair usage policies, and Indian jurisdiction in Kolkata, West Bengal. All prices are listed in Indian Rupees (INR) inclusive of applicable taxes.'
    },
    'delivery-returns': {
      title: 'Delivery & Returns Policy',
      content: 'We dispatch all domestic parcels from our Kolkata atelier within 1–2 business days via Delhivery. Standard transit requires 3–8 business days across India. Orders exceeding ₹1,999 qualify for complimentary domestic delivery. Due to the handcrafted, artisanal nature of skincare, we do not accept returns on opened personal care items. Any damages during transit reported within 48 hours receive immediate replacement support.'
    }
  };

  const pol = policies[type] || policies['privacy-policy'];

  container.innerHTML = `
    <div class="container" style="padding-bottom: var(--space-4xl); max-width: 800px;">
      <div class="breadcrumb-nav">
        <a href="#" onclick="navigateTo('home'); return false;">Home</a>
        <span>/</span>
        <strong>${pol.title}</strong>
      </div>

      <div style="margin: var(--space-2xl) 0 var(--space-xl);">
        <span class="eyebrow">Official Store Policies</span>
        <h1 class="serif-editorial" style="font-size: 3rem; color: var(--color-aubergine); margin-bottom: 16px;">${pol.title}</h1>
      </div>

      <div style="background: #FFFFFF; border: 1px solid var(--color-border); padding: 40px; font-size: 1.05rem; line-height: 1.8; color: var(--color-text-muted);">
        <p style="margin-bottom: 20px;">${pol.content}</p>
        <p style="margin-bottom: 20px;">For any policy inquiries or personal data assistance, please reach our dedicated support desk at <strong>support@unravelbeautysecrets.in</strong> or telephone <strong>+91 9903398080</strong>.</p>
        <p>Unravel Beauty Secrets • 9A Kailash Pandit Lane, New Alipore, Kolkata 700053, West Bengal.</p>
      </div>
    </div>
  `;
}

function render404(container) {
  container.innerHTML = `
    <div class="container" style="text-align: center; padding: var(--space-4xl) 0; max-width: 700px;">
      <span style="font-size: 4rem;">🌸</span>
      <span class="eyebrow" style="margin-top: 16px;">Page Not Found (404)</span>
      <h1 class="serif-editorial" style="font-size: 3.5rem; color: var(--color-aubergine); margin-bottom: 16px;">This path needs<br>a little care.</h1>
      <p style="color: var(--color-text-muted); font-size: 1.1rem; margin-bottom: 32px;">
        The page you are looking for might have moved, or no longer exists. Allow us to guide you back to our rituals.
      </p>
      <div style="display: flex; gap: 16px; justify-content: center;">
        <button class="btn-primary" onclick="navigateTo('home')">Return to Homepage</button>
        <button class="btn-secondary" onclick="navigateTo('shop')">Explore Bestsellers</button>
      </div>
    </div>
  `;
}

// Hash-based routing support
window.addEventListener('load', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    navigateTo(hash);
  }
});
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    navigateTo(hash);
  }
});


// LIVE SEARCH ENGINE (Convenient, Instant As-You-Type)
function handleLiveSearch(query) {
  const container = document.getElementById('search-live-results');
  const clearBtn = document.getElementById('search-clear-btn');
  if (!container) return;

  const q = query.trim().toLowerCase();
  if (clearBtn) {
    clearBtn.style.display = q ? 'block' : 'none';
  }

  if (!q) {
    renderSearchRecentAndPopular(container);
    return;
  }

  // Save to recent searches
  saveRecentSearch(query.trim());

  const matched = PRODUCTS_DATA.filter(p => 
    p.title.toLowerCase().includes(q) || 
    p.description.toLowerCase().includes(q) || 
    p.categoryName.toLowerCase().includes(q) ||
    p.concerns.some(c => c.toLowerCase().includes(q)) ||
    p.ingredients.toLowerCase().includes(q)
  );

  if (matched.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 32px 0; color: var(--color-text-muted);">
        <span style="font-size: 2rem; display: block; margin-bottom: 8px;">🔍</span>
        <p>No rituals found matching "<strong>${query}</strong>"</p>
        <span style="font-size: 0.85rem;">Try searching for <em>Kumkumadi</em>, <em>Rose</em>, <em>Hair Oil</em>, or <em>Acne</em>.</span>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-light); margin-bottom: 8px;">
      Found ${matched.length} matching ${matched.length === 1 ? 'ritual' : 'rituals'}:
    </div>
    ${matched.map(p => `
      <div class="search-live-item" onclick="closeAllDrawers(); navigateTo('product:${p.slug}')">
        <div class="search-live-left">
          <div class="search-live-thumb">🌿</div>
          <div>
            <h4 class="search-live-title">${p.title}</h4>
            <div class="search-live-meta">${p.categoryName} • ${p.size}</div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <span class="search-live-price">₹${p.price}</span>
          ${p.inStock ? 
            `<button class="btn-primary" style="padding: 8px 14px; font-size: 0.72rem;" onclick="event.stopPropagation(); addToCart('${p.id}');">Add to Bag</button>` :
            `<span class="badge badge-out-of-stock">Out of stock</span>`
          }
        </div>
      </div>
    `).join('')}
  `;
}

function clearSearchField() {
  const inp = document.getElementById('search-modal-input');
  if (inp) {
    inp.value = '';
    handleLiveSearch('');
    inp.focus();
  }
}

function saveRecentSearch(term) {
  try {
    let recents = JSON.parse(localStorage.getItem('unravel_recent_searches') || '[]');
    recents = [term, ...recents.filter(t => t.toLowerCase() !== term.toLowerCase())].slice(0, 5);
    localStorage.setItem('unravel_recent_searches', JSON.stringify(recents));
  } catch (e) {}
}

function renderSearchRecentAndPopular(container) {
  let recents = [];
  try {
    recents = JSON.parse(localStorage.getItem('unravel_recent_searches') || '[]');
  } catch (e) {}

  container.innerHTML = `
    ${recents.length > 0 ? `
      <div style="margin-bottom: 16px;">
        <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-light); display: block; margin-bottom: 8px;">Recent Searches</span>
        <div class="chips-row" style="margin-bottom: 0;">
          ${recents.map(r => `
            <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='${r}'; handleLiveSearch('${r}');">${r}</button>
          `).join('')}
        </div>
      </div>
    ` : ''}
    <div>
      <span style="font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--color-text-light); display: block; margin-bottom: 8px;">Popular Rituals</span>
      <div class="chips-row" style="margin-bottom: 0;">
        <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='Kumkumadi'; handleLiveSearch('Kumkumadi');">Kumkumadi Tailam</button>
        <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='Rose Water'; handleLiveSearch('Rose Water');">Rose Water</button>
        <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='Hair Oil'; handleLiveSearch('Hair Oil');">Volume Hair Oil</button>
        <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='Bridal Soap'; handleLiveSearch('Bridal Soap');">Bridal Soap</button>
        <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='Moisturiser'; handleLiveSearch('Moisturiser');">AM/PM Moisturiser</button>
        <button class="chip-btn" onclick="document.getElementById('search-modal-input').value='Brightening'; handleLiveSearch('Brightening');">Brightening</button>
      </div>
    </div>
  `;
}
