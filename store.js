/* Shared helpers: storage, session, cart, toasts, notifications */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = n => CONFIG.CURRENCY + Number(n).toLocaleString("en-IN");

const DB = {
  get(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  set(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
};
const getUsers = () => DB.get("foodUsers", []);
const getOrders = () => DB.get("foodOrders", []);
const getNotifications = () => DB.get("adminNotifications", []);
function getFoods() {
  let f = DB.get("foodItems", null);
  if (!f) { f = DEFAULT_FOODS; DB.set("foodItems", f); }
  return f;
}

async function hashPw(pw) {
  try {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode("fe::" + pw));
    return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
  } catch { return "plain::" + pw; }
}

/* session (cleared when the tab closes) */
const Session = {
  get() { try { return JSON.parse(sessionStorage.getItem("fe_session")); } catch { return null; } },
  set(s) { sessionStorage.setItem("fe_session", JSON.stringify(s)); },
  clear() { sessionStorage.removeItem("fe_session"); }
};
function requireUser() {
  const s = Session.get();
  if (!s || s.role !== "user") { location.replace("index.html"); throw new Error("not signed in"); }
  const u = getUsers().find(x => x.email === s.email);
  if (!u) { Session.clear(); location.replace("index.html"); throw new Error("no user"); }
  return u;
}
function requireAdmin() {
  const s = Session.get();
  if (!s || s.role !== "admin") { location.replace("index.html"); throw new Error("not admin"); }
}
function logout() { Session.clear(); location.href = "index.html"; }

/* cart (saved per customer so it survives page changes) */
const cartKey = email => "foodCart_" + email;
const getCart = email => DB.get(cartKey(email), []);
const saveCart = (email, c) => DB.set(cartKey(email), c);
function totals(cart) {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = cart.length ? CONFIG.DELIVERY_FEE : 0;
  const tax = Math.round(subtotal * CONFIG.TAX_RATE);
  return { subtotal, delivery, tax, total: subtotal + delivery + tax };
}

function addNotification(title, message) {
  const n = getNotifications();
  n.unshift({ title, message, date: new Date().toLocaleString() });
  DB.set("adminNotifications", n);
}

function toast(msg, type = "") {
  let box = $("#toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = "toast " + type; t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}
