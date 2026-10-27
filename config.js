/* Site settings. NOTE: this is a front-end demo, so anything here is visible
   to anyone who opens the site. For a real site, move login to a server. */
const CONFIG = {
  ADMIN_EMAIL: "2500030216@kluniversity.in",
  ADMIN_PASSWORD: "30216@",
  DELIVERY_FEE: 40,
  TAX_RATE: 0.05,
  CURRENCY: "₹",
  STATUSES: ["Order Confirmed", "Preparing", "Out for Delivery", "Delivered"]
};
const DEFAULT_FOODS = [
  { id: 1, name: "Chicken Biryani",  emoji: "🍛", category: "Biryani",  price: 250, rating: 4.8, available: true },
  { id: 2, name: "Veg Pizza",        emoji: "🍕", category: "Pizza",    price: 320, rating: 4.5, available: true },
  { id: 3, name: "Chicken Burger",   emoji: "🍔", category: "Burger",   price: 180, rating: 4.7, available: true },
  { id: 4, name: "Paneer Biryani",   emoji: "🍚", category: "Biryani",  price: 220, rating: 4.4, available: true },
  { id: 5, name: "Noodles",          emoji: "🍜", category: "Chinese",  price: 150, rating: 4.3, available: true },
  { id: 6, name: "Chicken Shawarma", emoji: "🌯", category: "Shawarma", price: 200, rating: 4.9, available: true }
];
