

const CART_KEY = 'cart_v1';

function getCart(){
  try { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
  catch(e){ return []; }
}
function saveCart(cart){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function normalizeId(id){
  return String(id || '').trim().replace(/\s+/g, '-').toLowerCase();
}

function parsePrice(text){
  if(!text) return 0;
  const cleaned = String(text).replace(/[^\d.,]/g,'').replace(/\./g,'').replace(/,/g,'.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

function addToCart({ id, name, price = 0, qty = 1 }){
  const nid = normalizeId(id || name);
  const cart = getCart();
  const idx = cart.findIndex(p => p.id === nid);
  if(idx >= 0){
    cart[idx].qty = (cart[idx].qty || 0) + Number(qty);
  } else {
    cart.push({ id: nid, name: String(name||'Producto'), price: Number(price||0), qty: Number(qty||1) });
  }
  saveCart(cart);
}

document.addEventListener('DOMContentLoaded', function(){
  updateCartBadge();
  renderCartPage();

  const checkout = document.getElementById('checkoutBtn');
  const messageBox = document.getElementById('checkoutMessage'); // elemento nuevo en el HTML
  if(checkout){
    checkout.addEventListener('click', function(e){
      e.preventDefault();
      const { items, total } = cartSummary();
      if(!items.length){
        showMessage('El carrito está vacío.', false);
        return;
      }
      showMessage(`Procesando compra por $${total.toLocaleString()}...`, true);
      checkout.disabled = true;

      setTimeout(()=>{
        clearCart();
        showMessage('✅ Compra realizada con éxito. ¡Gracias por tu compra!', true);
        checkout.disabled = false;
      }, 1500);
    });
  }

  function showMessage(text, ok=true){
    if(!messageBox) return;
    messageBox.textContent = text;
    messageBox.style.color = ok ? 'green' : 'red';
  }
});

function removeFromCart(id){
  const nid = normalizeId(id);
  const cart = getCart().filter(p => p.id !== nid);
  saveCart(cart);
  renderCartPage();
}

function updateQuantity(id, qty){
  const nid = normalizeId(id);
  const cart = getCart();
  const idx = cart.findIndex(p => p.id === nid);
  if(idx >= 0){
    cart[idx].qty = Math.max(1, Number(qty));
    saveCart(cart);
  }
}

function clearCart(){
  localStorage.removeItem(CART_KEY);
  updateCartBadge();
  renderCartPage();
}

function cartSummary(){
  const cart = getCart();
  const total = cart.reduce((s,p)=> s + (p.price * p.qty), 0);
  const count = cart.reduce((s,p)=> s + p.qty, 0);
  return { items: cart, total, count };
}

function updateCartBadge(){
  const el = document.getElementById('cartCount');
  if(!el) return;
  const c = cartSummary().count;
  el.textContent = c ? String(c) : '';
}

function renderCartPage(){
  const container = document.getElementById('cartItems');
  const totalEl = document.getElementById('cartTotal');
  if(!container) return;
  const { items, total } = cartSummary();
  container.innerHTML = '';
  if(!items.length){
    container.innerHTML = '<p>El carrito está vacío.</p>';
    if(totalEl) totalEl.textContent = '$ 0';
    return;
  }

  const list = document.createElement('div');
  list.className = 'cart-list';
  items.forEach(it => {
    const row = document.createElement('div');
    row.className = 'cart-row';
    row.innerHTML = `
      <div class="cart-row-left">
        <div class="cart-name">${escapeHtml(it.name)}</div>
        <div class="cart-price">$ ${Number(it.price).toLocaleString()}</div>
      </div>
      <div class="cart-row-right">
        <button class="qty-decrease" data-id="${it.id}">−</button>
        <input class="qty-input" data-id="${it.id}" type="number" min="1" value="${it.qty}" />
        <button class="qty-increase" data-id="${it.id}">+</button>
        <button class="cart-remove" data-id="${it.id}">Eliminar</button>
      </div>
    `;
    list.appendChild(row);
  });
  container.appendChild(list);
  if(totalEl) totalEl.textContent = '$ ' + total.toLocaleString();
}

function escapeHtml(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

document.addEventListener('click', function(e){
  const addBtn = e.target.closest('.add-btn');
  if(addBtn){
    const id = addBtn.dataset.id || addBtn.dataset.productId || addBtn.dataset.name;
    const name = addBtn.dataset.name || addBtn.dataset.title || addBtn.dataset.product || 'Producto';
    const price = parseFloat(addBtn.dataset.price || addBtn.dataset.valor || 0);
    addToCart({ id, name, price, qty: 1 });
    return;
  }

  const addTo = e.target.closest('.add-to-cart');
  if(addTo){
    const card = addTo.closest('.product-card') || addTo.closest('.card');
    const id = (card && card.dataset.id) ? card.dataset.id : (addTo.dataset.id || addTo.dataset.productId);
    const name = card ? (card.querySelector('h2')?.textContent || card.querySelector('h3')?.textContent || 'Producto') : (addTo.dataset.name || 'Producto');
    const priceText = card ? (card.querySelector('.price')?.textContent || '') : '';
    const price = parsePrice(priceText) || parseFloat(addTo.dataset.price || 0);
    addToCart({ id, name: name.trim(), price, qty: 1 });
    return;
  }

  const inc = e.target.closest('.qty-increase');
  if(inc){ const id = inc.dataset.id; const input = document.querySelector(`.qty-input[data-id="${id}"]`); input.value = Number(input.value) + 1; updateQuantity(id, input.value); renderCartPage(); return; }
  const dec = e.target.closest('.qty-decrease');
  if(dec){ const id = dec.dataset.id; const input = document.querySelector(`.qty-input[data-id="${id}"]`); input.value = Math.max(1, Number(input.value) - 1); updateQuantity(id, input.value); renderCartPage(); return; }
  const rem = e.target.closest('.cart-remove');
  if(rem){ removeFromCart(rem.dataset.id); return; }
});

document.addEventListener('input', function(e){
  if(e.target.matches('.qty-input')){
    const id = e.target.dataset.id;
    const val = Math.max(1, Number(e.target.value || 1));
    updateQuantity(id, val);
    renderCartPage();
  }
});

document.addEventListener('DOMContentLoaded', function(){
  updateCartBadge();
  renderCartPage();

  const checkout = document.getElementById('checkoutBtn');
  if(checkout){
    checkout.addEventListener('click', function(){
      const { items, total } = cartSummary();
      if(!items.length){ alert('El carrito está vacío.'); return; }
      if(confirm(`Confirmar compra por $ ${total.toLocaleString()} ?`)){
        clearCart();
        alert('Compra finalizada (simulada). Gracias.');
      }
    });
  }
});