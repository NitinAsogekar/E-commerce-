// main.js - ALL IN ONE CONTROLLER FOR 12 PAGES

// 1. CONFIG - Backend URL
const API = "http://localhost:3000";

// 2. GET USER DATA
const token = localStorage.getItem("token");
const role = localStorage.getItem("role");
const username = localStorage.getItem("username");
const currentPage = location.pathname.split("/").pop();

// 3. PUBLIC PAGES - No token needed
const publicPages = ["home.html", "login.html", "signup.html", "contact.html", ""];

// 4. TOKEN CHECK - Redirect to login if token missing
if (!publicPages.includes(currentPage) &&!token) {
  alert("Please login first");
  location.href = "login.html";
}

// 5. ROLE CHECK - Prevent customer entering vendor page and vice-versa
if (token && role) {
  if (role === "customer" && currentPage.startsWith("vendor_")) {
    alert("Vendors only");
    location.href = "customer_view_products.html";
  }
  if (role === "customer" && currentPage === "view_product.html") {
    location.href = "customer_view_products.html";
  }
  if (role === "vendor" && currentPage.startsWith("customer_")) {
    // allow vendor to view as customer if you want, comment this if not
    // location.href = "view_product.html";
  }
}

// 6. COMMON FUNCTIONS FOR ALL PAGES
function logout() {
  localStorage.clear();
  location.href = "login.html";
}

// Auth fetch for all pages
async function authFetch(url, options = {}) {
  options.headers = {
   ...options.headers,
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };
  const res = await fetch(API + url, options);
  if (res.status === 401) {
    logout();
  }
  return res;
}

// 7. AUTO LOAD NAVBAR IN ALL PAGES
document.addEventListener("DOMContentLoaded", () => {
  // If page has <div id="navbar"></div>, load navbar.html inside it
  const navContainer = document.getElementById("navbar");
  if (navContainer) {
    fetch("navbar.html")
     .then(r => r.text())
     .then(html => {
        navContainer.innerHTML = html;
        highlightCurrentPage();
        setupNavbarRole();
      });
  } else {
    highlightCurrentPage();
  }

  // Auto show username if page has id="u"
  const u = document.getElementById("u");
  if (u) u.innerText = username || "Guest";
});

function highlightCurrentPage() {
  document.querySelectorAll(".menu a").forEach(a => {
    if (a.getAttribute("href") === currentPage) {
      a.style.background = "#666";
    }
  });
}

function setupNavbarRole() {
  const menu = document.getElementById("mainMenu");
  if (!menu) return;

  // Show welcome
  if (username && menu) {
    const welcome = document.createElement("span");
    welcome.innerText = `Hi, ${username} (${role})`;
    welcome.style.marginLeft = "10px";
    welcome.style.color = "#aaa";
    menu.prepend(welcome);
  }
}

// 8. PAGE LINKS MAP - Use this to navigate
const LINKS = {
  home: "home.html",
  login: "login.html",
  signup: "signup.html",
  shop: "customer_view_products.html",
  cart: "customer_cart.html",
  orders: "place_order.html",
  profile: "customer_profile.html",
  dashboard: "vendor_dashboard.html",
  myproducts: "view_product.html",
  addproduct: "add_product.html",
  editproduct: "edit_product.html",
  contact: "contact.html"
};

function go(page) {
  location.href = LINKS[page];
}