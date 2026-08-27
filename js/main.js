// Estado Global da Aplicação
const state = {
  products: [],
  categories: [],
  cart: JSON.parse(localStorage.getItem('tozzi_cart')) || [],
  selectedCategory: 'all',
  searchQuery: '',
  whatsappNumber: '5515999999999' // Insira o número do WhatsApp da Tozzi Materiais Elétricos
};

// Elementos do DOM
const DOM = {
  productsGrid: document.getElementById('productsGrid'),
  categoriesContainer: document.getElementById('categoriesContainer'),
  searchInput: document.getElementById('searchInput'),
  cartDrawer: document.getElementById('cartDrawer'),
  cartOverlay: document.getElementById('cartOverlay'),
  cartSidebar: document.getElementById('cartSidebar'),
  openCartBtn: document.getElementById('openCartBtn'),
  closeCartBtn: document.getElementById('closeCartBtn'),
  cartItems: document.getElementById('cartItems'),
  cartTotal: document.getElementById('cartTotal'),
  cartBadge: document.getElementById('cartBadge'),
  deliveryMethod: document.getElementById('deliveryMethod'),
  addressField: document.getElementById('addressField'),
  customerAddress: document.getElementById('customerAddress'),
  checkoutBtn: document.getElementById('checkoutBtn')
};

// Debounce para otimização de busca
function debounce(func, timeout = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => { func.apply(this, args); }, timeout);
  };
}

// Renderização dos Produtos
function renderProducts() {
  if (state.products.length === 0) {
    DOM.productsGrid.innerHTML = `
      <div class="col-span-full text-center py-12 text-slate-500">
        <i class="fa-solid fa-box-open text-4xl mb-3"></i>
        <p>Nenhum produto encontrado.</p>
      </div>
    `;
    return;
  }

  DOM.productsGrid.innerHTML = state.products.map(product => `
    <div class="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-600 transition-colors">
      <div>
        <div class="h-48 bg-slate-950 overflow-hidden relative">
          <img src="${product.image_url || 'https://via.placeholder.com/300'}" alt="${product.name}" class="w-full h-full object-cover">
          ${product.featured ? `<span class="absolute top-2 left-2 bg-amber-500 text-slate-950 font-bold text-xs px-2 py-0.5 rounded">Destaque</span>` : ''}
        </div>
        <div class="p-4">
          <span class="text-xs text-amber-500 uppercase font-semibold tracking-wider">${product.category_name || 'Geral'}</span>
          <h3 class="font-bold text-white text-base mt-1 line-clamp-1">${product.name}</h3>
          <p class="text-slate-400 text-xs mt-1 line-clamp-2">${product.description || ''}</p>
        </div>
      </div>
      <div class="p-4 pt-0 flex items-center justify-between mt-2">
        <span class="text-lg font-bold text-white">R$ ${parseFloat(product.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        <button onclick="addToCart(${product.id})" class="bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-white font-bold p-2.5 rounded-lg transition-colors">
          <i class="fa-solid fa-plus"></i>
        </button>
      </div>
    </div>
  `).join('');
}

// Renderização dos Filtros de Categoria
function renderCategories() {
  const categoriesHTML = state.categories.map(cat => `
    <button data-slug="${cat.slug}" class="category-btn bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors">
      ${cat.name}
    </button>
  `).join('');

  DOM.categoriesContainer.innerHTML = `
    <button data-slug="all" class="category-btn bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors">
      Todos os Produtos
    </button>
  ` + categoriesHTML;

  // Listeners das Categorias
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.category-btn').forEach(b => {
        b.className = 'category-btn bg-slate-800 text-slate-300 hover:bg-slate-700 font-medium px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors';
      });
      e.target.className = 'category-btn bg-amber-500 text-slate-950 font-bold px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors';
      state.selectedCategory = e.target.dataset.slug;
      fetchProducts();
    });
  });
}

// Fetch dos Produtos na API
async function fetchProducts() {
  try {
    const params = new URLSearchParams();
    if (state.selectedCategory !== 'all') params.append('category', state.selectedCategory);
    if (state.searchQuery) params.append('search', state.searchQuery);

    const res = await fetch(`/api/products?${params.toString()}`);
    state.products = await res.json();
    renderProducts();
  } catch (err) {
    console.error('Erro ao buscar produtos:', err);
  }
}

// Fetch das Categorias
async function fetchCategories() {
  try {
    const res = await fetch('/api/categories');
    state.categories = await res.json();
    renderCategories();
  } catch (err) {
    console.error('Erro ao carregar categorias:', err);
  }
}

// Carrinho de Compras
window.addToCart = function(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  const existing = state.cart.find(item => item.id === productId);
  if (existing) {
    existing.quantity++;
  } else {
    state.cart.push({ ...product, quantity: 1 });
  }

  saveCart();
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
};

function saveCart() {
  localStorage.setItem('tozzi_cart', JSON.stringify(state.cart));
  updateCartUI();
}

function updateCartUI() {
  const totalCount = state.cart.reduce((acc, item) => acc + item.quantity, 0);
  DOM.cartBadge.innerText = totalCount;

  if (state.cart.length === 0) {
    DOM.cartItems.innerHTML = '<p class="text-center text-slate-500 py-8">Seu carrinho está vazio.</p>';
    DOM.cartTotal.innerText = 'R$ 0,00';
    return;
  }

  let total = 0;
  DOM.cartItems.innerHTML = state.cart.map(item => {
    const itemTotal = item.price * item.quantity;
    total += itemTotal;
    return `
      <div class="flex items-center justify-between bg-slate-950 p-3 rounded-lg border border-slate-800">
        <div class="flex-1 pr-2">
          <h4 class="font-bold text-sm text-white line-clamp-1">${item.name}</h4>
          <p class="text-xs text-amber-500">R$ ${parseFloat(item.price).toFixed(2)}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateQuantity(${item.id}, -1)" class="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold flex items-center justify-center text-xs">-</button>
          <span class="text-sm font-bold w-4 text-center">${item.quantity}</span>
          <button onclick="updateQuantity(${item.id}, 1)" class="w-6 h-6 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold flex items-center justify-center text-xs">+</button>
        </div>
      </div>
    `;
  }).join('');

  DOM.cartTotal.innerText = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

// Controle do Drawer
function toggleCart(open) {
  if (open) {
    DOM.cartDrawer.classList.remove('pointer-events-none');
    DOM.cartOverlay.classList.remove('opacity-0');
    DOM.cartSidebar.classList.remove('translate-x-full');
  } else {
    DOM.cartOverlay.classList.add('opacity-0');
    DOM.cartSidebar.classList.add('translate-x-full');
    setTimeout(() => DOM.cartDrawer.classList.add('pointer-events-none'), 300);
  }
}

// Geração e Checkout WhatsApp
DOM.checkoutBtn.addEventListener('click', () => {
  if (state.cart.length === 0) {
    alert('Adicione ao menos um produto no carrinho!');
    return;
  }

  const method = DOM.deliveryMethod.value;
  const address = DOM.customerAddress.value.trim();

  if (method.includes('Entrega') && !address) {
    alert('Por favor, digite o endereço completo para entrega em Cerquilho-SP.');
    return;
  }

  let message = `*NOVO PEDIDO - TOZZI MATERIAIS ELÉTRICOS*\n`;
  message += `📍 *Cidade:* Cerquilho-SP\n`;
  message += `📦 *Modalidade:* ${method}\n`;
  if (address) message += `🏠 *Endereço:* ${address}\n`;
  message += `------------------------------------\n\n`;

  let total = 0;
  state.cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;
    message += `• ${item.quantity}x ${item.name} - R$ ${subtotal.toFixed(2)}\n`;
  });

  message += `\n*TOTAL: R$ ${total.toFixed(2)}*`;

  const encoded = encodeURIComponent(message);
  window.open(`https://wa.me/${state.whatsappNumber}?text=${encoded}`, '_blank');
});

// Event Listeners Globais
DOM.openCartBtn.addEventListener('click', () => toggleCart(true));
DOM.closeCartBtn.addEventListener('click', () => toggleCart(false));
DOM.cartOverlay.addEventListener('click', () => toggleCart(false));

DOM.deliveryMethod.addEventListener('change', (e) => {
  if (e.target.value.includes('Entrega')) {
    DOM.addressField.classList.remove('hidden');
  } else {
    DOM.addressField.classList.add('hidden');
  }
});

DOM.searchInput.addEventListener('input', debounce((e) => {
  state.searchQuery = e.target.value.trim();
  fetchProducts();
}, 400));

// Inicialização
fetchCategories();
fetchProducts();
updateCartUI();