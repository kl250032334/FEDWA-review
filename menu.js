const user = requireUser();
let foods = getFoods().filter(f => f.available !== false);
let cart = getCart(user.email);
let category = "All", query = "";

$("#userAddress").textContent = user.address;
$("#userName").textContent = user.name.split(" ")[0];

function cartCount() { return cart.reduce((s, i) => s + i.qty, 0); }
function persist() { saveCart(user.email, cart); $("#cartBadge").textContent = cartCount() || ""; }

/* views */
function view(name) {
  if (!["menu", "cart", "orders"].includes(name)) name = "menu";
  $$(".view").forEach(v => v.classList.toggle("hidden", v.id !== "view-" + name));
  $$(".nav button[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view === name));
  if (name === "cart") renderCart();
  if (name === "orders") renderOrders();
  if (location.hash !== "#" + name) history.replaceState(null, "", "#" + name);
  window.scrollTo(0, 0);
}
$$(".nav button[data-view]").forEach(b => b.onclick = () => view(b.dataset.view));
$("#logoutBtn").onclick = logout;

/* menu */
function renderChips() {
  const cats = ["All", ...new Set(foods.map(f => f.category))];
  $("#chips").innerHTML = cats.map(c => `<button class="chip ${c === category ? "active" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");
  $$("#chips .chip").forEach(b => b.onclick = () => { category = b.dataset.c; renderChips(); renderGrid(); });
}
function renderGrid() {
  const list = foods.filter(f =>
    (category === "All" || f.category === category) &&
    (f.name + " " + f.category).toLowerCase().includes(query));
  $("#foodGrid").innerHTML = list.length ? list.map(f => `
    <article class="food-card">
      <div class="food-img" aria-hidden="true">${esc(f.emoji)}</div>
      <h3>${esc(f.name)}</h3>
      <div class="meta"><span>${esc(f.category)}</span><span class="rate">★ ${Number(f.rating).toFixed(1)}</span></div>
      <div class="price" style="margin-bottom:14px">${money(f.price)}</div>
      <button class="btn" data-add="${f.id}">Add to cart</button>
    </article>`).join("")
    : `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div><p>No dishes match "${esc(query)}". Try another search or category.</p></div>`;
  $$("[data-add]").forEach(b => b.onclick = () => addToCart(Number(b.dataset.add)));
}
$("#foodSearch").addEventListener("input", e => { query = e.target.value.trim().toLowerCase(); renderGrid(); });

function addToCart(id) {
  const f = foods.find(x => x.id === id); if (!f) return;
  const item = cart.find(i => i.id === id);
  if (item) item.qty++; else cart.push({ id: f.id, name: f.name, price: f.price, emoji: f.emoji, qty: 1 });
  persist();
  toast(`${f.name} added to cart`, "ok");
}

/* cart */
function changeQty(id, d) {
  const i = cart.findIndex(x => x.id === id); if (i < 0) return;
  cart[i].qty += d;
  if (cart[i].qty <= 0) cart.splice(i, 1);
  persist(); renderCart();
}
function renderCart() {
  const box = $("#cartBox");
  if (!cart.length) {
    box.innerHTML = `<div class="empty panel"><div class="big">🛒</div><h3>Your cart is empty</h3><p style="margin:8px 0 18px">Add something tasty from the menu.</p><button class="btn" id="goMenu">Browse menu</button></div>`;
    $("#goMenu").onclick = () => view("menu"); return;
  }
  const t = totals(cart);
  box.innerHTML = `
  <div class="cart-wrap">
    <div class="panel">${cart.map(i => `
      <div class="cart-item">
        <div class="em" aria-hidden="true">${esc(i.emoji || "🍽️")}</div>
        <div class="info"><b>${esc(i.name)}</b><br><small>${money(i.price)} each</small></div>
        <div class="qty">
          <button data-q="-1" data-id="${i.id}" aria-label="Decrease ${esc(i.name)}">−</button>
          <b>${i.qty}</b>
          <button data-q="1" data-id="${i.id}" aria-label="Increase ${esc(i.name)}">+</button>
        </div>
        <b style="min-width:70px;text-align:right">${money(i.price * i.qty)}</b>
      </div>`).join("")}
    </div>
    <div class="panel bill">
      <h3 style="margin-bottom:10px">Order summary</h3>
      <p><span>Subtotal</span><span>${money(t.subtotal)}</span></p>
      <p><span>Delivery fee</span><span>${money(t.delivery)}</span></p>
      <p><span>Tax (${CONFIG.TAX_RATE * 100}%)</span><span>${money(t.tax)}</span></p>
      <p class="total"><span>Total</span><span>${money(t.total)}</span></p>
      <div class="addr">📍 <b>Delivering to</b><br>${esc(user.address)}</div>
      <button class="btn green block" id="checkout">Continue to payment</button>
    </div>
  </div>`;
  $$("[data-q]").forEach(b => b.onclick = () => changeQty(Number(b.dataset.id), Number(b.dataset.q)));
  $("#checkout").onclick = () => location.href = "payment.html";
}

/* orders */
function renderOrders() {
  const mine = getOrders().filter(o => o.userEmail === user.email).reverse();
  const box = $("#ordersBox");
  if (!mine.length) { box.innerHTML = `<div class="empty panel"><div class="big">🍽️</div><h3>No orders yet</h3><p>Your orders will show up here.</p></div>`; return; }
  box.innerHTML = mine.map(o => {
    const idx = Math.max(0, CONFIG.STATUSES.indexOf(o.status));
    return `<div class="order">
      <div class="order-head"><h3>Order ${esc(o.orderId)}</h3><span class="pill ${o.status === "Delivered" ? "" : "warn"}">${esc(o.status)}</span></div>
      <p>${esc(o.food)}</p>
      <div class="steps">${CONFIG.STATUSES.map((s, i) => `<div class="step ${i <= idx ? "done" : ""}">${esc(s)}</div>`).join("")}</div>
      <p style="margin-top:12px"><b>${money(o.total)}</b> · ${esc(o.paymentMethod)} · ${esc(o.paymentStatus)}</p>
      <small>Delivering to ${esc(o.address)}<br>Placed ${esc(o.date)}</small>
    </div>`;
  }).join("");
}

renderChips(); renderGrid(); persist();
view(location.hash.slice(1) || "menu");
window.addEventListener("hashchange", () => view(location.hash.slice(1)));
/* keep order progress fresh if the admin updates it in another tab */
window.addEventListener("storage", e => { if (e.key === "foodOrders" && !$("#view-orders").classList.contains("hidden")) renderOrders(); });
