(function () {
  // Seed products
  let products = [
    { id: 1, name: 'Arlo lounge chair', category: 'Seating', price: 680, image: '', description: '' },
    { id: 2, name: 'Noma dining table', category: 'Tables', price: 1240, image: '', description: '' },
    { id: 3, name: 'Lune pendant light', category: 'Bedrooms', price: 290, image: '', description: '' },
    { id: 4, name: 'Cove modular sofa', category: 'Seating', price: 2180, image: '', description: '' },
    { id: 5, name: 'Milo side table', category: 'Tables', price: 340, image: '', description: '' },
    { id: 6, name: 'Sora floor lamp', category: 'Bedrooms', price: 410, image: '', description: '' },
    { id: 7, name: 'Etta dining chair', category: 'Seating', price: 390, image: '', description: '' },
    { id: 8, name: 'Pietro coffee table', category: 'Tables', price: 890, image: '', description: '' },
    { id: 9, name: 'Mori table lamp', category: 'Bedrooms', price: 245, image: '', description: '' },
    { id: 10, name: 'Haven daybed', category: 'Seating', price: 1560, image: '', description: '' },
    { id: 11, name: 'Alba console', category: 'Tables', price: 760, image: '', description: '' },
    { id: 12, name: 'Orb wall light', category: 'Bedrooms', price: 180, image: '', description: '' }
  ];

  // Placeholder SVG data URL (small, lightweight)
  const PLACEHOLDER =
    'data:image/svg+xml;utf8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="100%" height="100%" fill="%23ded7ca"/><text x="50%" y="50%" font-family="sans-serif" font-size="28" fill="%236f746e" text-anchor="middle" dy=".3em">No image</text></svg>'
    );

  // Helpers
  const $ = (sel, root = document) => root.querySelector(sel);
  const money = value => `Tsh ${Number(value).toLocaleString('en-US')}`;

  // Load from localStorage safely
  function safeParse(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      console.warn('Failed to parse localStorage key', key, e);
      return fallback;
    }
  }

  const savedProducts = safeParse('furnshop-products', []).slice(-4).map(product => ({ ...product, category: product.category === 'Lighting' ? 'Bedrooms' : product.category }));
  let removedProductIds = safeParse('furnshop-removed-products', []);
  products = [...products, ...savedProducts].filter(product => !removedProductIds.includes(product.id));

  let activeFilter = 'All';
  let searchTerm = '';
  let cart = safeParse('hearth-cart', []);
  let favorites = safeParse('hearth-favorites', []);

  // Persist cart & favorites
  function save() {
    try { localStorage.setItem('hearth-cart', JSON.stringify(cart)); } catch (e) { console.warn('Cart could not be saved.', e); }
    try { localStorage.setItem('hearth-favorites', JSON.stringify(favorites)); } catch (e) { console.warn('Favorites could not be saved.', e); }
  }

  function saveCatalog() {
    try {
      localStorage.setItem('furnshop-products', JSON.stringify(products.filter(product => product.id > 12)));
      localStorage.setItem('furnshop-removed-products', JSON.stringify(removedProductIds));
    } catch (e) {
      console.warn('Catalog could not be saved.', e);
    }
  }

  // Filter + sort
  function filteredProducts() {
    const search = searchTerm.trim().toLowerCase();
    let list = products.filter(p => (activeFilter === 'All' || p.category === activeFilter) && (p.name.toLowerCase().includes(search) || p.category.toLowerCase().includes(search)));
    const sortSelect = $('#sort-select');
    const sort = sortSelect ? sortSelect.value : '';
    if (sort === 'low') list.sort((a, b) => a.price - b.price);
    if (sort === 'high') list.sort((a, b) => b.price - a.price);
    return list;
  }

  // Render helpers that use safe DOM creation (prevents XSS)
  function renderProducts() {
    const list = filteredProducts();
    const totalEl = $('#product-total');
    if (totalEl) totalEl.textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
    const emptyState = $('#empty-state');
    if (emptyState) emptyState.hidden = list.length > 0;
    const grid = $('#product-grid');
    if (!grid) return;
    grid.innerHTML = ''; // clear

    list.forEach(p => {
      const article = document.createElement('article');
      article.className = 'product-card';

      const imageWrap = document.createElement('div');
      imageWrap.className = 'product-image';
      imageWrap.dataset.product = p.id;

      if (p.image) {
        const img = document.createElement('img');
        img.src = p.image;
        img.alt = p.name;
        img.loading = 'lazy';
        imageWrap.appendChild(img);
      } else {
        const img = document.createElement('img');
        img.src = PLACEHOLDER;
        img.alt = 'placeholder';
        img.loading = 'lazy';
        imageWrap.appendChild(img);
      }

      const favBtn = document.createElement('button');
      favBtn.className = 'favorite' + (favorites.includes(p.id) ? ' active' : '');
      favBtn.setAttribute('aria-label', favorites.includes(p.id) ? 'Remove from favorites' : 'Add to favorites');
      favBtn.dataset.favorite = p.id;
      favBtn.textContent = favorites.includes(p.id) ? '♥' : '♡';
      imageWrap.appendChild(favBtn);

      article.appendChild(imageWrap);

      const h3 = document.createElement('h3');
      h3.textContent = p.name;
      article.appendChild(h3);

      const meta = document.createElement('div');
      meta.className = 'product-meta';
      const span = document.createElement('span');
      span.textContent = p.category;
      const strong = document.createElement('strong');
      strong.textContent = money(p.price);
      meta.appendChild(span);
      meta.appendChild(strong);
      article.appendChild(meta);

      grid.appendChild(article);
    });
  }

  function renderCart() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const cartCount = $('#cart-count');
    if (cartCount) cartCount.textContent = count;

    const cartTotal = $('#cart-total');
    if (cartTotal) cartTotal.textContent = money(cart.reduce((sum, item) => sum + item.price * item.quantity, 0));

    const itemsEl = $('#cart-items');
    if (!itemsEl) return;
    itemsEl.innerHTML = '';

    if (!cart.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-cart';
      empty.textContent = 'Your bag is waiting for something good.';
      itemsEl.appendChild(empty);
      return;
    }

    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-row';

      const img = document.createElement('img');
      img.src = item.image || PLACEHOLDER;
      img.alt = item.name;

      const middle = document.createElement('div');
      const title = document.createElement('h4');
      title.textContent = item.name;
      const qty = document.createElement('p');
      qty.textContent = `${item.quantity} x ${money(item.price)}`;
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-item';
      removeBtn.dataset.remove = item.id;
      removeBtn.textContent = 'Remove';

      middle.appendChild(title);
      middle.appendChild(qty);
      middle.appendChild(removeBtn);

      const price = document.createElement('span');
      price.className = 'cart-price';
      price.textContent = money(item.price * item.quantity);

      row.appendChild(img);
      row.appendChild(middle);
      row.appendChild(price);

      itemsEl.appendChild(row);
    });
  }

  function renderCheckout() {
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const checkoutTotal = $('#checkout-total');
    if (checkoutTotal) checkoutTotal.textContent = money(total);
  }

  function openCart() {
    renderCart();
    const drawer = $('#cart-drawer');
    const scrim = $('#drawer-scrim');
    if (drawer) { drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false'); }
    if (scrim) { scrim.classList.add('open'); scrim.setAttribute('aria-hidden', 'false'); }
  }

  function closeCart() {
    const drawer = $('#cart-drawer');
    const scrim = $('#drawer-scrim');
    if (drawer) { drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true'); }
    if (scrim) { scrim.classList.remove('open'); scrim.setAttribute('aria-hidden', 'true'); }
  }

  function showToast(message) {
    const toast = $('#toast');
    if (!toast) {
      console.log('Toast:', message);
      return;
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2400);
  }

  function addToCart(product) {
    if (!product) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) existing.quantity++;
    else cart.push({ ...product, quantity: 1 });
    products = products.filter(item => item.id !== product.id);
    if (!removedProductIds.includes(product.id)) removedProductIds.push(product.id);
    save();
    saveCatalog();
    renderProducts();
    renderCart();
    showToast(`${product.name} added to your bag`);
  }

  function renderAdminProducts() {
    const listEl = $('#admin-products-list');
    if (!listEl) return;
    listEl.innerHTML = '';
    const uploaded = products.filter(product => product.id > 12); // show uploaded ones first
    if (!uploaded.length) {
      const p = document.createElement('p');
      p.className = 'admin-empty';
      p.textContent = 'No uploaded products yet.';
      listEl.appendChild(p);
      return;
    }
    uploaded.forEach(product => {
      const row = document.createElement('div');
      row.className = 'admin-product-row';
      const img = document.createElement('img');
      img.src = product.image || PLACEHOLDER;
      img.alt = product.name;
      const span = document.createElement('span');
      span.textContent = product.name;
      const del = document.createElement('button');
      del.type = 'button';
      del.dataset.deleteProduct = product.id;
      del.textContent = 'Delete';
      row.appendChild(img);
      row.appendChild(span);
      row.appendChild(del);
      listEl.appendChild(row);
    });
  }

  function openAdmin() {
    renderAdminProducts();
    const modal = $('#admin-modal');
    if (modal) modal.hidden = false;
  }
  function closeAdmin() {
    const modal = $('#admin-modal');
    if (modal) modal.hidden = true;
  }

  function resetImagePreview() {
    const input = $('#product-image');
    if (input) input.value = '';
    const fileName = $('#upload-file-name');
    if (fileName) fileName.textContent = 'No image selected';
    const preview = $('#image-preview');
    if (preview) preview.hidden = true;
    const previewImg = $('#image-preview-img');
    if (previewImg) previewImg.removeAttribute('src');
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  function openProduct(id) {
    const p = products.find(product => product.id === id);
    if (!p) return;
    const modalContent = $('#modal-content');
    if (!modalContent) return;
    modalContent.innerHTML = ''; // clear

    const container = document.createElement('div');
    container.className = 'modal-product';

    const left = document.createElement('div');
    const img = document.createElement('img');
    img.src = p.image || PLACEHOLDER;
    img.alt = p.name;
    left.appendChild(img);

    const right = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = p.category;
    const h2 = document.createElement('h2');
    h2.textContent = p.name;
    const desc = document.createElement('p');
    desc.textContent = p.description || '';
    const price = document.createElement('div');
    price.className = 'modal-price';
    price.textContent = money(p.price);
    const addBtn = document.createElement('button');
    addBtn.className = 'button button-dark';
    addBtn.dataset.add = p.id;
    addBtn.textContent = 'Add to bag →';
    const back = document.createElement('button');
    back.className = 'back-to-products';
    back.dataset.action = 'close-modal';
    back.textContent = '← Back to products';

    right.appendChild(eyebrow);
    right.appendChild(h2);
    right.appendChild(desc);
    right.appendChild(price);
    right.appendChild(addBtn);
    right.appendChild(back);

    container.appendChild(left);
    container.appendChild(right);
    modalContent.appendChild(container);

    const productModal = $('#product-modal');
    if (productModal) productModal.hidden = false;
  }

  // Event delegation for data-* actions
  function delegatedClickHandler(event) {
    const el = event.target.closest('[data-filter], [data-filter-link], [data-favorite], [data-product], [data-add], [data-remove], [data-delete-product], [data-action], [data-delete-product]');
    if (!el) return;

    if (el.dataset.filter) {
      activeFilter = el.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === activeFilter));
      renderProducts();
      return;
    }
    if (el.dataset.filterLink) {
      activeFilter = el.dataset.filterLink;
      document.querySelectorAll('[data-filter]').forEach(button => button.classList.toggle('active', button.dataset.filter === activeFilter));
      renderProducts();
      return;
    }
    if (el.dataset.favorite) {
      const id = Number(el.dataset.favorite);
      favorites = favorites.includes(id) ? favorites.filter(item => item !== id) : [...favorites, id];
      save();
      renderProducts();
      return;
    }
    if (el.dataset.product) {
      openProduct(Number(el.dataset.product));
      return;
    }
    if (el.dataset.add) {
      const id = Number(el.dataset.add);
      const product = products.find(p => p.id === id);
      addToCart(product);
      const productModal = $('#product-modal');
      if (productModal) productModal.hidden = true;
      return;
    }
    if (el.dataset.remove) {
      const id = Number(el.dataset.remove);
      cart = cart.filter(item => item.id !== id);
      save();
      renderCart();
      return;
    }
    if (el.dataset.deleteProduct) {
      const id = Number(el.dataset.deleteProduct);
      products = products.filter(product => product.id !== id);
      if (!removedProductIds.includes(id)) removedProductIds.push(id);
      saveCatalog();
      renderProducts();
      renderAdminProducts();
      return;
    }

    const action = el.dataset.action;
    if (action === 'admin') openAdmin();
    if (action === 'close-admin') closeAdmin();
    if (action === 'remove-image') resetImagePreview();
    if (action === 'cart') openCart();
    if (action === 'close-cart') closeCart();
    if (action === 'close-modal') {
      const productModal = $('#product-modal');
      if (productModal) productModal.hidden = true;
    }
    if (action === 'menu') {
      const nav = document.querySelector('.main-nav');
      if (nav) nav.classList.toggle('mobile-open');
    }
  }

  // Wire up input listeners safely
  function wireInputs() {
    const productImage = $('#product-image');
    if (productImage) {
      productImage.addEventListener('change', event => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
          showToast('Please choose an image file');
          resetImagePreview();
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          showToast('Please choose an image under 5MB');
          resetImagePreview();
          return;
        }
        const uploadFileName = $('#upload-file-name');
        if (uploadFileName) uploadFileName.textContent = file.name;
        const reader = new FileReader();
        reader.onload = () => {
          const previewImg = $('#image-preview-img');
          if (previewImg) previewImg.src = reader.result;
          const preview = $('#image-preview');
          if (preview) preview.hidden = false;
        };
        reader.onerror = () => showToast('Image could not be loaded');
        reader.readAsDataURL(file);
      });
    }

    const productForm = $('#product-form');
    if (productForm) {
      productForm.addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const imageFile = formData.get('image');
        const name = form.elements.name && form.elements.name.value.trim();
        const category = form.elements.category && form.elements.category.value;
        const priceVal = form.elements.price && form.elements.price.value;
        const description = form.elements.description && form.elements.description.value.trim();

        if (!name || !category || !priceVal || !description) {
          showToast('Complete all product details');
          return;
        }
        if (!imageFile || !imageFile.size) {
          showToast('Please add a product image');
          return;
        }

        readImage(imageFile).then(image => {
          const product = {
            id: Date.now(),
            name,
            category,
            price: Number(priceVal),
            image,
            description
          };
          products.push(product);
          renderProducts();
          try { localStorage.setItem('furnshop-products', JSON.stringify(products.filter(item => item.id > 12))); } catch (error) { console.warn('Product saved for this session only because browser storage is full.'); }
          form.reset();
          resetImagePreview();
          renderAdminProducts();
          closeAdmin();
          showToast('Product uploaded successfully!');
        }).catch(error => {
          console.warn('Product image could not be read.', error);
          showToast('Image could not be loaded');
        });
      });
    }

    const sortSelect = $('#sort-select');
    if (sortSelect) sortSelect.addEventListener('change', renderProducts);

    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        const productModal = $('#product-modal');
        if (productModal) productModal.hidden = true;
        closeCart();
        closeAdmin();
      }
    });

    document.addEventListener('click', delegatedClickHandler);
  }

  // Init on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    renderCart();
    wireInputs();
  });

})();
