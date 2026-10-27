requireAdmin();

function page(name) {
  $$(".admin-page").forEach(p => p.classList.toggle("hidden", p.id !== "page-" + name));
  $$(".sidebar button[data-page]").forEach(b => b.classList.toggle("active", b.dataset.page === name));
  render();
}
$$(".sidebar button[data-page]").forEach(b => b.onclick = () => page(b.dataset.page));
$("#logoutBtn").onclick = logout;

const orderRow = o => `<tr>
  <td><b>${esc(o.orderId)}</b><br><small>${esc(o.date)}</small></td>
  <td>${esc(o.userName)}<br><small>${esc(o.userEmail)}</small></td>
  <td>${esc(o.food)}</td><td>${money(o.total)}</td>
  <td>${esc(o.paymentMethod)}<br><small>${esc(o.paymentStatus)}</small></td>
  <td><select class="status-select" data-order="${esc(o.orderId)}">
    ${CONFIG.STATUSES.map(s => `<option ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}</select></td></tr>`;

function render() {
  const users = getUsers(), orders = getOrders(), notes = getNotifications(), foods = getFoods();

  /* dashboard */
  $("#sCustomers").textContent = users.length;
  $("#sOrders").textContent = orders.length;
  $("#sRevenue").textContent = money(orders.reduce((s, o) => s + Number(o.total), 0));
  $("#sNotes").textContent = notes.length;
  $("#recent").innerHTML = orders.length
    ? `<table><tr><th>Order</th><th>Customer</th><th>Food</th><th>Total</th><th>Payment</th><th>Status</th></tr>${orders.slice(-5).reverse().map(orderRow).join("")}</table>`
    : `<p class="empty">No orders yet.</p>`;

  /* foods */
  $("#foodRows").innerHTML = foods.map(f => `<tr>
    <td style="font-size:26px">${esc(f.emoji)}</td><td><b>${esc(f.name)}</b></td><td>${esc(f.category)}</td>
    <td>${money(f.price)}</td><td>★ ${Number(f.rating).toFixed(1)}</td>
    <td><button class="btn ghost small" data-toggle="${f.id}">${f.available === false ? "Hidden — show" : "Visible — hide"}</button></td>
    <td><button class="btn danger small" data-del="${f.id}">Delete</button></td></tr>`).join("");

  /* orders */
  $("#orderBox").innerHTML = orders.length
    ? `<table><tr><th>Order</th><th>Customer</th><th>Food</th><th>Total</th><th>Payment</th><th>Status</th></tr>${orders.slice().reverse().map(orderRow).join("")}</table>`
    : `<p class="empty">No orders yet.</p>`;

  /* customers */
  $("#custRows").innerHTML = users.length
    ? users.map(u => `<tr><td>${esc(u.name)}</td><td>${esc(u.email)}</td><td>${esc(u.address)}</td><td>${esc(u.createdAt)}</td></tr>`).join("")
    : `<tr><td colspan="4" class="empty">No customers yet.</td></tr>`;

  /* notifications */
  $("#noteBox").innerHTML = notes.length
    ? notes.map(n => `<div class="notice"><b>${esc(n.title)}</b><p>${esc(n.message)}</p><small>${esc(n.date)}</small></div>`).join("")
    : `<p class="empty">No notifications.</p>`;

  $$("[data-order]").forEach(s => s.onchange = () => {
    const all = getOrders(), o = all.find(x => x.orderId === s.dataset.order);
    if (o) { o.status = s.value; DB.set("foodOrders", all); toast(`Order ${o.orderId}: ${o.status}`, "ok"); render(); }
  });
  $$("[data-toggle]").forEach(b => b.onclick = () => {
    const all = getFoods(), f = all.find(x => x.id === Number(b.dataset.toggle));
    f.available = f.available === false; DB.set("foodItems", all); render();
  });
  $$("[data-del]").forEach(b => b.onclick = () => {
    if (!confirm("Delete this dish from the menu?")) return;
    DB.set("foodItems", getFoods().filter(x => x.id !== Number(b.dataset.del))); render();
  });
}

$("#addFood").addEventListener("submit", e => {
  e.preventDefault();
  const name = $("#fName").value.trim(), price = Number($("#fPrice").value);
  if (!name || !(price > 0)) return toast("Enter a name and a price above 0.", "error");
  const foods = getFoods();
  foods.push({
    id: Math.max(0, ...foods.map(f => f.id)) + 1, name,
    emoji: $("#fEmoji").value.trim() || "🍽️",
    category: $("#fCat").value.trim() || "Other",
    price, rating: Math.min(5, Math.max(0, Number($("#fRating").value) || 4)), available: true
  });
  DB.set("foodItems", foods); e.target.reset(); toast("Dish added to the menu.", "ok"); render();
});
$("#clearNotes").onclick = () => { localStorage.removeItem("adminNotifications"); render(); };
window.addEventListener("storage", render);
page("dashboard");
