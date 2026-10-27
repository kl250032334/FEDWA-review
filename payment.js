const user = requireUser();
const cart = getCart(user.email);
if (!cart.length) { location.replace("menu.html#cart"); throw new Error("empty cart"); }
const t = totals(cart);
let method = "";

$("#payAmount").textContent = money(t.total);
$("#payItems").textContent = cart.map(i => `${i.name} × ${i.qty}`).join(", ");

function select(m) {
  method = m;
  $$(".method").forEach(el => el.classList.toggle("selected", el.dataset.m === m));
  $("#upiForm").classList.toggle("hidden", m !== "UPI");
  $("#cardForm").classList.toggle("hidden", m !== "Card");
}
$$(".method").forEach(el => el.onclick = () => { el.querySelector("input").checked = true; select(el.dataset.m); });

/* input formatting */
$("#cardNumber").addEventListener("input", e => {
  e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
});
$("#expiry").addEventListener("input", e => {
  let v = e.target.value.replace(/\D/g, "").slice(0, 4);
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  e.target.value = v;
});
$("#cvv").addEventListener("input", e => e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3));

const luhn = num => { let s = 0, alt = false;
  for (let i = num.length - 1; i >= 0; i--) { let d = +num[i]; if (alt) { d *= 2; if (d > 9) d -= 9; } s += d; alt = !alt; }
  return s % 10 === 0; };

function validate() {
  if (!method) return "Please choose a payment method.";
  if (method === "UPI") {
    if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test($("#upiId").value.trim())) return "Enter a valid UPI ID, like name@bank.";
  }
  if (method === "Card") {
    const num = $("#cardNumber").value.replace(/\s/g, "");
    if (num.length !== 16 || !luhn(num)) return "Enter a valid 16-digit card number.";
    if (!$("#cardName").value.trim()) return "Enter the name on the card.";
    const m = $("#expiry").value.match(/^(\d{2})\/(\d{2})$/);
    if (!m || +m[1] < 1 || +m[1] > 12) return "Enter expiry as MM/YY.";
    const now = new Date();
    if (2000 + +m[2] < now.getFullYear() || (2000 + +m[2] === now.getFullYear() && +m[1] < now.getMonth() + 1)) return "This card has expired.";
    if ($("#cvv").value.length !== 3) return "Enter the 3-digit CVV.";
  }
  return "";
}

$("#payBtn").onclick = () => {
  const err = validate();
  if (err) return toast(err, "error");

  const orders = getOrders();
  let orderId; do { orderId = "FE" + Math.floor(1000 + Math.random() * 9000); } while (orders.some(o => o.orderId === orderId));

  const cod = method === "Cash on Delivery";
  orders.push({
    orderId, userName: user.name, userEmail: user.email, address: user.address,
    food: cart.map(i => `${i.name} × ${i.qty}`).join(", "),
    items: cart, total: t.total, paymentMethod: method,
    paymentStatus: cod ? "Pay on delivery" : "Payment successful",
    status: CONFIG.STATUSES[0], date: new Date().toLocaleString()
  });
  DB.set("foodOrders", orders);
  addNotification("New order", `Order ${orderId} from ${user.name} · ${money(t.total)} · ${method}`);
  saveCart(user.email, []);   /* card details are never stored */

  $("#payForm").classList.add("hidden");
  $("#done").classList.remove("hidden");
  $("#doneId").textContent = orderId;
};
$("#backBtn").onclick = () => location.href = "menu.html#cart";
