const loginForm = $("#loginForm"), signupForm = $("#signupForm");
const show = which => {
  loginForm.classList.toggle("hidden", which !== "login");
  signupForm.classList.toggle("hidden", which !== "signup");
};
$("#toSignup").onclick = () => show("signup");
$("#toLogin").onclick = () => show("login");

/* already signed in? skip the login screen */
const existing = Session.get();
if (existing) location.replace(existing.role === "admin" ? "admin.html" : "menu.html");

loginForm.addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#loginEmail").value.trim().toLowerCase();
  const password = $("#loginPassword").value;

  if (email === CONFIG.ADMIN_EMAIL.toLowerCase() && password === CONFIG.ADMIN_PASSWORD) {
    Session.set({ role: "admin", email });
    return location.href = "admin.html";
  }
  const hash = await hashPw(password);
  const user = getUsers().find(u => u.email === email && u.password === hash);
  if (!user) return toast("Email or password is incorrect.", "error");
  Session.set({ role: "user", email });
  location.href = "menu.html";
});

signupForm.addEventListener("submit", async e => {
  e.preventDefault();
  const name = $("#signupName").value.trim();
  const email = $("#signupEmail").value.trim().toLowerCase();
  const password = $("#signupPassword").value;
  const confirm = $("#signupConfirm").value;
  const address = $("#signupAddress").value.trim();

  if (!name || !email || !password || !confirm || !address) return toast("Please fill in every field.", "error");
  if (password.length < 6) return toast("Password needs at least 6 characters.", "error");
  if (password !== confirm) return toast("Passwords don't match.", "error");
  if (email === CONFIG.ADMIN_EMAIL.toLowerCase()) return toast("That email is reserved.", "error");

  const users = getUsers();
  if (users.some(u => u.email === email)) return toast("This email is already registered. Log in instead.", "error");

  users.push({ name, email, password: await hashPw(password), address, createdAt: new Date().toLocaleString() });
  DB.set("foodUsers", users);
  addNotification("New customer", `${name} created an account (${email}).`);
  signupForm.reset();
  show("login");
  $("#loginEmail").value = email;
  toast("Account created. You can log in now.", "ok");
});
