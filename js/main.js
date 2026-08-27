// Estado Global da Aplicação
const state = {
  products: [],
  categories: [],
  selectedCategory: 'all',
  cart: JSON.parse(localStorage.getItem('tozzi_cart')) || []
};

// Referências de Elementos do DOM
const DOM = {
  productsGrid: document.getElementById('productsGrid'),
  categoriesContainer: document.getElementById('categoriesContainer'),
  cartBadge: document.getElementById('cartBadge'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartOverlay: document.getElementById('cartOverlay'),
  cartSidebar: document.getElementById('cartSidebar'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  openCartBtn: document.getElementById('openCartBtn'),
  closeCartBtn: document.getElementById('closeCartBtn'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  deliveryMethod: document.getElementById('deliveryMethod'),
  addressField: document.getElementById('addressField'),
  customerAddress: document.getElementById('customerAddress'),
  searchInput: document.getElementById('searchInput'),
  searchInputMobile: document.getElementById('searchInputMobile')
};

// --- BUSCA DE DADOS NA API ---

async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    if (!res.ok) throw new Error('Erro ao buscar categorias');
    state.categories = await res.json();
    renderCategories();
  } catch (err) {
    console.error('Falha ao carregar categorias:', err);
  }
}

async function fetchProducts(searchQuery = '') {
  try {
    let url = `/api/products?category=${state.selectedCategory}`;
    if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

    const res = await fetch(url);
    if (!res.ok) throw new Error('Erro ao buscar produtos');
    state.products = await res.json();
    renderProducts();
  } catch (err) {
    console.error('Falha ao carregar produtos:', err);
    DOM.productsGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <i class="fa-solid fa-triangle-exclamation text-3xl mb-2 text-amber-500"></i>
        <p>Não foi possível carregar o catálogo de produtos no momento.</p>
      </div>
    `;
  }
}

// --- RENDERIZAÇÃO DA VITRINE ---

function renderProducts() {
  if (!DOM.productsGrid) return;

  if (state.products.length === 0) {
    DOM.productsGrid.innerHTML = `
      <div class="col-span-full text-center py-16 text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
        <i class="fa-solid fa-box-open text-4xl mb-3 text-slate-600"></i>
        <p class="text-base font-medium text-slate-400">Nenhum produto encontrado nesta categoria.</p>
      </div>
    `;
    return;
  }

  DOM.productsGrid.innerHTML = state.products.map(product => `
    <div class="product-card bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/5">
      <div>
        <div class="h-48 bg-slate-950 overflow-hidden relative">
          <img src="${product.image_url || 'https://via.placeholder.com/400x300?text=Tozzi+Eletricos'}" 
               alt="${product.name}" 
               class="w-full h-full object-cover hover:scale-110 transition-transform duration-500">
          ${product.featured ? `<span class="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">Destaque</span>` : ''}
        </div>
        <div class="p-5">
          <span class="text-[11px] text-emerald-400 uppercase font-bold tracking-wider">${product.category_name || 'Geral'}</span>
          <h3 class="font-bold text-white text-base mt-1 line-clamp-1">${product.name}</h3>
          <p class="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">${product.description || 'Produto com certificado de segurança e alta durabilidade.'}</p>
        </div>
      </div>
      <div class="p-5 pt-0 flex items-center justify-between mt-2 border-t border-slate-800/50">
        <div>
          <span class="text-xs text-slate-500 block">Preço un.</span>
          <span class="text-lg font-black text-emerald-400">R$ ${parseFloat(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
        <button onclick="addToCart(${product.id})" class="bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-bold p-3 rounded-xl transition-all duration-200">
          <i class="fa-solid fa-cart-plus text-base"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (typeof gsap !== 'undefined') {
    gsap.from('.product-card', {
      duration: 0.4,
      y: 15,
      opacity: 0,
      stagger: 0.04,
      ease: 'power2.out'
    });
  }
}

function renderCategories() {
  if (!DOM.categoriesContainer) return;

  const categoriesHTML = state.categories.map(cat => `
    <button data-slug="${cat.slug}" class="category-btn bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all">
      ${cat.name}
    </button>
  `).join('');

  DOM.categoriesContainer.innerHTML = `
    <button data-slug="all" class="category-btn bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all shadow-md">
      Todos os Produtos
    </button>
  ` + categoriesHTML;

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-btn').forEach(b => {
        b.className = 'category-btn bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 font-medium px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all';
      });
      e.target.className = 'category-btn bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-full text-sm whitespace-nowrap transition-all shadow-md';
      state.selectedCategory = e.target.dataset.slug;
      fetchProducts();
    });
  });
}

// --- LÓGICA DO CARRINHO DE COTAÇÃO ---

window.addToCart = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existingItem = state.cart.find(item => item.id === productId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      quantity: 1
    });
  }

  saveCart();
  updateCartUI();
  toggleCart(true);
};

window.updateQuantity = function(productId, delta) {
  const item = state.cart.find(i => i.id === productId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== productId);
  }

  saveCart();
  updateCartUI();
};

window.removeFromCart = function(productId) {
  state.cart = state.cart.filter(i => i.id !== productId);
  saveCart();
  updateCartUI();
};

function saveCart() {
  localStorage.setItem('tozzi_cart', JSON.stringify(state.cart));
}

function updateCartUI() {
  const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  if (DOM.cartBadge) DOM.cartBadge.innerText = totalItems;
  if (DOM.cartTotal) DOM.cartTotal.innerText = `R$ ${totalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  if (!DOM.cartItems) return;

  if (state.cart.length === 0) {
    DOM.cartItems.innerHTML = `
      <div class="text-center py-12 text-slate-500">
        <i class="fa-solid fa-cart-arrow-down text-4xl mb-3 text-slate-700"></i>
        <p class="text-sm">Seu carrinho de cotação está vazio.</p>
      </div>
    `;
    return;
  }

  DOM.cartItems.innerHTML = state.cart.map(item => `
    <div class="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
      <div class="flex-1 min-w-0">
        <h4 class="text-white text-sm font-bold truncate">${item.name}</h4>
        <span class="text-emerald-400 text-xs font-semibold">R$ ${(item.price * item.quantity).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
      </div>
      <div class="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
        <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs font-bold">-</button>
        <span class="text-xs font-bold text-white px-1">${item.quantity}</span>
        <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 rounded bg-slate-800 text-slate-300 hover:bg-slate-700 flex items-center justify-center text-xs font-bold">+</button>
      </div>
      <button onclick="removeFromCart(${item.id})" class="text-slate-500 hover:text-rose-400 p-1">
        <i class="fa-solid fa-trash-can text-sm"></i>
      </button>
    </div>
  `).join('');
}

function toggleCart(open) {
  if (!DOM.cartDrawer || !DOM.cartSidebar || !DOM.cartOverlay) return;

  if (open) {
    DOM.cartDrawer.classList.remove('pointer-events-none');
    DOM.cartOverlay.classList.remove('opacity-0');
    DOM.cartSidebar.classList.remove('translate-x-full');
  } else {
    DOM.cartOverlay.classList.add('opacity-0');
    DOM.cartSidebar.classList.add('translate-x-full');
    setTimeout(() => {
      DOM.cartDrawer.classList.add('pointer-events-none');
    }, 300);
  }
}

// --- CHECKOUT VIA WHATSAPP ---

function handleCheckout() {
  if (state.cart.length === 0) {
    alert('Adicione ao menos um item ao seu orçamento antes de prosseguir.');
    return;
  }

  const deliveryMethod = DOM.deliveryMethod ? DOM.deliveryMethod.value : 'Retirada na Matriz (Cerquilho-SP)';
  const address = DOM.customerAddress ? DOM.customerAddress.value.trim() : '';

  if (deliveryMethod.includes('Entrega') && !address) {
    alert('Por favor, informe o endereço da obra para calcularmos o frete de entrega.');
    if (DOM.customerAddress) DOM.customerAddress.focus();
    return;
  }

  let text = `*SOLICITAÇÃO DE COTAÇÃO - TOZZI MATERIAIS ELÉTRICOS*\n\n`;
  text += `*Itens Solicitados:*\n`;

  let total = 0;
  state.cart.forEach((item, index) => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    text += `${index + 1}. ${item.name} (x${item.quantity}) - R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  });

  text += `\n*Estimativa Total:* R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n`;
  text += `*Forma de Recebimento:* ${deliveryMethod}\n`;
  
  if (address) {
    text += `*Endereço:* ${address}\n`;
  }

  text += `\nAguardo o retorno do vendedor sobre a disponibilidade de estoque!`;

  const phone = '5515991135609';
  const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  
  window.open(whatsappUrl, '_blank');
}

// --- EVENT LISTENERS E INICIALIZAÇÃO ---

document.addEventListener('DOMContentLoaded', () => {
  fetchCategories();
  fetchProducts();
  updateCartUI();

  if (DOM.openCartBtn) DOM.openCartBtn.addEventListener('click', () => toggleCart(true));
  if (DOM.closeCartBtn) DOM.closeCartBtn.addEventListener('click', () => toggleCart(false));
  if (DOM.cartOverlay) DOM.cartOverlay.addEventListener('click', () => toggleCart(false));
  if (DOM.checkoutBtn) DOM.checkoutBtn.addEventListener('click', handleCheckout);

  if (DOM.deliveryMethod) {
    DOM.deliveryMethod.addEventListener('change', (e) => {
      if (DOM.addressField) {
        if (e.target.value.includes('Entrega')) {
          DOM.addressField.classList.remove('hidden');
        } else {
          DOM.addressField.classList.add('hidden');
        }
      }
    });
  }

  // Busca por Texto em Tempo Real
  const setupSearch = (inputEl) => {
    if (!inputEl) return;
    let timeout = null;
    inputEl.addEventListener('input', (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        fetchProducts(e.target.value.trim());
      }, 300);
    });
  };

  setupSearch(DOM.searchInput);
  setupSearch(DOM.searchInputMobile);
});