import { db } from "./db.js";

// Global administrative state
let activeRoutes = [];
let activeFleets = [];
let bookingRequests = [];
let appSettings = {};
let currentActiveTarget = "pageAnalytics";

document.addEventListener("DOMContentLoaded", async () => {
  // Check authorization session state
  if (sessionStorage.getItem("ots_admin_auth") === "true") {
    showDashboard();
  } else {
    showLogin();
  }

  setupAuthHandlers();
});

// Setup gate authorization (Email & Password)
function setupAuthHandlers() {
  const loginForm = document.getElementById("loginForm");
  const emailField = document.getElementById("emailField");
  const passcodeField = document.getElementById("passcodeField");
  const loginError = document.getElementById("loginError");
  const togglePassword = document.getElementById("togglePassword");

  // 1. Hook password show/hide eye toggle button
  if (togglePassword && passcodeField) {
    togglePassword.addEventListener("click", () => {
      const isPass = passcodeField.getAttribute("type") === "password";
      passcodeField.setAttribute("type", isPass ? "text" : "password");
      togglePassword.classList.toggle("fa-eye");
      togglePassword.classList.toggle("fa-eye-slash");
    });
  }

  // 2. Submit credentials handler
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = emailField.value.trim();
    const entered = passcodeField.value.trim();
    
    if (!email || !entered) {
      loginError.style.display = "block";
      loginError.innerHTML = '<i class="fas fa-exclamation-circle"></i> Kripya Email aur Password dono bharein!';
      return;
    }

    // Visual feedback: show spinner & disable button
    const submitBtn = loginForm.querySelector("button[type='submit']");
    const originalHtml = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Gate...';
    loginError.style.display = "none";

    const result = await db.verifyCredentials(email, entered);

    // Reset button states
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;

    if (result.success) {
      sessionStorage.setItem("ots_admin_auth", "true");
      loginError.style.display = "none";
      showDashboard();
    } else {
      loginError.style.display = "block";
      loginError.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${result.error}`;
      passcodeField.value = "";
    }
  });

  // Logout console action
  document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem("ots_admin_auth");
    window.location.reload();
  });
}

function showLogin() {
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("adminDashboard").style.display = "none";
}

async function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("adminDashboard").style.display = "grid";
  
  // Safe Auto-Seed dynamically if collections are empty in Firestore
  await db.seedDefaultsIfEmpty();
  
  await refreshDashboardData();
  setupNavigation();
  setupDashboardActions();
}

async function refreshDashboardData() {
  try {
    // 1. Fetch system datasets
    appSettings = await db.getSettings();
    activeRoutes = await db.getRoutes();
    activeFleets = await db.getFleets();
    bookingRequests = await db.getBookings();
    
    // 2. Render all dashboard parts
    renderAnalyticsOverview();
    renderRoutesTable();
    renderFleetsTable();
    renderBookingsTable();
    populateSettingsForm();
    
  } catch (error) {
    console.error("[AdminDashboard] Refresh error:", error);
  }
}

function renderAnalyticsOverview() {
  document.getElementById("countRoutes").textContent = activeRoutes.length;
  document.getElementById("countBookings").textContent = bookingRequests.length;
  document.getElementById("countCities").textContent = appSettings.serviceableCities || "38+";
  
  const statusEl = document.getElementById("dbStatus");
  if (db.firebaseLoaded) {
    statusEl.textContent = "Firebase Active";
    statusEl.style.color = "#10b981";
  } else {
    statusEl.textContent = "LocalStorage";
    statusEl.style.color = "hsl(var(--color-gold-base))";
  }
}

function setupNavigation() {
  const menuItems = document.querySelectorAll(".admin-menu-item");
  const pages = document.querySelectorAll(".admin-page");

  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      // Toggle active classes in menu
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");

      // Toggle visible dashboard page content
      const target = item.getAttribute("data-target");
      currentActiveTarget = target;
      
      pages.forEach(p => {
        if (p.id === target) p.classList.add("active");
        else p.classList.remove("active");
      });
    });
  });
}

// Renders Page 2: Manage Routes Table
function renderRoutesTable() {
  const tbody = document.getElementById("routesTableBody");
  tbody.innerHTML = "";

  if (activeRoutes.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align:center; padding: 30px; color:hsl(var(--color-text-gray));">
          No routes defined. Click "Add New Route" to get started.
        </td>
      </tr>
    `;
    return;
  }

  activeRoutes.forEach(route => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="font-weight:700;">${route.from}</td>
      <td style="font-weight:700;">${route.to}</td>
      <td style="color: hsl(var(--color-gold-base)); font-weight:800; font-family:var(--font-display);">₹${route.price}</td>
      <td><span class="hub-badge" style="background:rgba(234,179,8,0.1); color:hsl(var(--color-gold-base));">${route.type}</span></td>
      <td>
        <div style="display:flex; gap:10px;">
          <button class="btn-circle edit-route-btn" data-id="${route.id}" title="Edit Route">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-circle delete-route-btn" data-id="${route.id}" style="color:#ef4444; border-color:rgba(239,68,68,0.2);" title="Delete Route">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;

    // Hook edit trigger
    tr.querySelector(".edit-route-btn").addEventListener("click", () => {
      openRouteModal(route);
    });

    // Hook delete trigger
    tr.querySelector(".delete-route-btn").addEventListener("click", async () => {
      if (confirm(`Are you sure you want to delete the route from ${route.from} to ${route.to}?`)) {
        await db.deleteRoute(route.id);
        await refreshDashboardData();
      }
    });

    tbody.appendChild(tr);
  });
}

// Renders Page 3: Manage Dynamic Fleets
function renderFleetsTable() {
  const tbody = document.getElementById("fleetsTableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  if (activeFleets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center; padding: 30px; color:hsl(var(--color-text-gray));">
          No fleets defined. Click "Add New Car" to get started.
        </td>
      </tr>
    `;
    return;
  }

  activeFleets.forEach(fleet => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="width: 80px;"><img src="${fleet.image}" style="max-height:40px; max-width:70px; object-fit:contain; border-radius:4px;"></td>
      <td style="font-weight:700;">${fleet.name}</td>
      <td style="font-size:12px;">${fleet.category}</td>
      <td>${fleet.seats} Seater</td>
      <td>AC: ${fleet.ac}</td>
      <td style="font-size:11px; color:hsl(var(--color-text-gray));">${fleet.feature}</td>
      <td>
        <div style="display:flex; gap:10px;">
          <button class="btn-circle edit-fleet-btn" title="Edit Car"><i class="fas fa-edit"></i></button>
          <button class="btn-circle delete-fleet-btn" style="color:#ef4444; border-color:rgba(239,68,68,0.2);" title="Delete Car"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    `;

    tr.querySelector(".edit-fleet-btn").addEventListener("click", () => openFleetModal(fleet));
    tr.querySelector(".delete-fleet-btn").addEventListener("click", async () => {
      if (confirm(`Are you sure you want to remove ${fleet.name} from fleets?`)) {
        await db.deleteFleet(fleet.id);
        await refreshDashboardData();
      }
    });

    tbody.appendChild(tr);
  });
}

// Renders Page 4: View Bookings Table
function renderBookingsTable() {
  const tbody = document.getElementById("bookingsTableBody");
  tbody.innerHTML = "";

  if (bookingRequests.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align:center; padding:30px; color:hsl(var(--color-text-gray));">
          No passenger booking requests recorded yet.
        </td>
      </tr>
    `;
    return;
  }

  bookingRequests.forEach(booking => {
    const tr = document.createElement("tr");
    
    // Format timestamp nicely
    const dateObj = new Date(booking.timestamp);
    const dateFormatted = dateObj.toLocaleDateString("en-IN", { day:'numeric', month:'short' });
    const timeFormatted = dateObj.toLocaleTimeString("en-IN", { hour:'2-digit', minute:'2-digit' });

    tr.innerHTML = `
      <td>
        <div style="font-weight:600;">${dateFormatted}</div>
        <div style="font-size:11px; color:hsl(var(--color-text-gray));">${timeFormatted}</div>
      </td>
      <td>
        <div style="font-weight:700;"><i class="fas fa-location-dot" style="color:#10b981; font-size:10px;"></i> ${booking.pickup}</div>
        <div style="font-weight:700; margin-top:2px;"><i class="fas fa-location-pin" style="color:#ef4444; font-size:10px;"></i> ${booking.drop}</div>
      </td>
      <td><div style="font-size:12px; font-weight:500;">${booking.car}</div></td>
      <td><span class="hub-badge">${booking.tripType}</span></td>
      <td style="color:hsl(var(--color-gold-base)); font-weight:800; font-family:var(--font-display);">${booking.fare}</td>
      <td>
        <div style="display:flex; gap:10px;">
          <button class="btn-circle delete-booking-btn" data-id="${booking.id}" style="color:#ef4444; border-color:rgba(239,68,68,0.2);" title="Clear Log">
            <i class="fas fa-trash-alt"></i>
          </button>
        </div>
      </td>
    `;

    // Hook delete booking trigger
    tr.querySelector(".delete-booking-btn").addEventListener("click", async () => {
      if (confirm("Delete this booking request record from log?")) {
        await db.deleteBooking(booking.id);
        await refreshDashboardData();
      }
    });

    tbody.appendChild(tr);
  });
}

// Populates Page 5: Configuration Settings Form
function populateSettingsForm() {
  document.getElementById("setHostName").value = appSettings.hostName;
  document.getElementById("setClientPhone").value = appSettings.clientPhone;
  document.getElementById("setGoogleRating").value = appSettings.googleRating || "4.8";
  document.getElementById("setCities").value = appSettings.serviceableCities || "38+";
  document.getElementById("setHappyRides").value = appSettings.happyRides || "120k+";
  document.getElementById("setActiveDrivers").value = appSettings.activeDrivers || "2100+";

  // Handle Firebase Toggle Switch Button Visually
  const fbToggle = document.getElementById("setFirebaseToggle");
  const useFb = appSettings.useFirebase !== undefined ? appSettings.useFirebase : true;
  
  if (useFb) {
    fbToggle.classList.add("active");
  } else {
    fbToggle.classList.remove("active");
  }
}

function setupDashboardActions() {
  // 1. Routes Modal
  const routeModal = document.getElementById("routeModal");
  const newRouteBtn = document.getElementById("newRouteBtn");
  const closeModalBtn = document.getElementById("closeModalBtn");
  const routeForm = document.getElementById("routeForm");
  
  newRouteBtn.addEventListener("click", () => openRouteModal());
  closeModalBtn.addEventListener("click", closeRouteModal);
  routeModal.addEventListener("click", (e) => {
    if (e.target === routeModal) closeRouteModal();
  });

  // Route form CRUD Submit
  routeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("routeIdField").value;
    const from = document.getElementById("routeFrom").value.trim();
    const to = document.getElementById("routeTo").value.trim();
    const price = document.getElementById("routePrice").value;
    const type = document.getElementById("routeType").value;

    const routePayload = { from, to, price, type };
    if (id) routePayload.id = id;

    await db.saveRoute(routePayload);
    closeRouteModal();
    await refreshDashboardData();
  });

  // 2. Fleets Modal
  const fleetModal = document.getElementById("fleetModal");
  const newFleetBtn = document.getElementById("newFleetBtn");
  const closeFleetModalBtn = document.getElementById("closeFleetModalBtn");
  const fleetForm = document.getElementById("fleetForm");

  if (newFleetBtn) newFleetBtn.addEventListener("click", () => openFleetModal());
  if (closeFleetModalBtn) closeFleetModalBtn.addEventListener("click", closeFleetModal);
  if (fleetModal) {
    fleetModal.addEventListener("click", (e) => {
      if (e.target === fleetModal) closeFleetModal();
    });
  }

  // Fleet form CRUD Submit
  if (fleetForm) {
    fleetForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("fleetIdField").value;
      const name = document.getElementById("fleetNameField").value.trim();
      const category = document.getElementById("fleetCategoryField").value.trim();
      const ac = document.getElementById("fleetAcField").value;
      const seats = document.getElementById("fleetSeatsField").value;
      const bags = document.getElementById("fleetBagsField").value;
      const feature = document.getElementById("fleetFeatureField").value.trim();
      const image = document.getElementById("fleetImageField").value.trim() || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400";

      const fleetPayload = { name, category, ac, seats, bags, feature, image };
      if (id) fleetPayload.id = id;

      await db.saveFleet(fleetPayload);
      closeFleetModal();
      await refreshDashboardData();
    });
  }

  // 3. Settings Config forms
  const fbToggle = document.getElementById("setFirebaseToggle");
  fbToggle.addEventListener("click", () => {
    fbToggle.classList.toggle("active");
  });

  const settingsForm = document.getElementById("settingsForm");
  settingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const hostName = document.getElementById("setHostName").value.trim();
    const clientPhone = document.getElementById("setClientPhone").value.trim();
    const googleRating = document.getElementById("setGoogleRating").value.trim();
    const serviceableCities = document.getElementById("setCities").value.trim();
    const happyRides = document.getElementById("setHappyRides").value.trim();
    const activeDrivers = document.getElementById("setActiveDrivers").value.trim();
    const useFirebase = fbToggle.classList.contains("active");

    const settingsPayload = {
      hostName,
      clientPhone,
      googleRating,
      serviceableCities,
      happyRides,
      activeDrivers,
      useFirebase
    };

    await db.saveSettings(settingsPayload);
    alert("System settings configurations updated successfully!");
    window.location.reload();
  });
}

function openRouteModal(route = null) {
  const routeModal = document.getElementById("routeModal");
  const modalTitle = document.getElementById("modalTitle");
  const submitText = document.getElementById("modalSubmitText");
  const idField = document.getElementById("routeIdField");
  const fromField = document.getElementById("routeFrom");
  const toField = document.getElementById("routeTo");
  const priceField = document.getElementById("routePrice");
  const typeField = document.getElementById("routeType");

  routeModal.classList.add("active");

  if (route) {
    modalTitle.textContent = "Edit Route Details";
    submitText.textContent = "Update Route";
    idField.value = route.id;
    fromField.value = route.from;
    toField.value = route.to;
    priceField.value = route.price;
    typeField.value = route.type;
  } else {
    modalTitle.textContent = "Add New Outstation Route";
    submitText.textContent = "Create Route";
    idField.value = "";
    document.getElementById("routeForm").reset();
  }
}

function closeRouteModal() {
  document.getElementById("routeModal").classList.remove("active");
}

function openFleetModal(fleet = null) {
  const fleetModal = document.getElementById("fleetModal");
  const modalTitle = document.getElementById("fleetModalTitle");
  const submitText = document.getElementById("fleetModalSubmitText");
  
  const idField = document.getElementById("fleetIdField");
  const nameField = document.getElementById("fleetNameField");
  const catField = document.getElementById("fleetCategoryField");
  const acField = document.getElementById("fleetAcField");
  const seatsField = document.getElementById("fleetSeatsField");
  const bagsField = document.getElementById("fleetBagsField");
  const featField = document.getElementById("fleetFeatureField");
  const imgField = document.getElementById("fleetImageField");

  fleetModal.classList.add("active");

  if (fleet) {
    modalTitle.textContent = "Edit Car Fleet Details";
    submitText.textContent = "Update Car";
    idField.value = fleet.id;
    nameField.value = fleet.name;
    catField.value = fleet.category;
    acField.value = fleet.ac;
    seatsField.value = fleet.seats;
    bagsField.value = fleet.bags;
    featField.value = fleet.feature;
    imgField.value = fleet.image;
  } else {
    modalTitle.textContent = "Register New Car Fleet";
    submitText.textContent = "Register Car";
    idField.value = "";
    document.getElementById("fleetForm").reset();
  }
}

function closeFleetModal() {
  document.getElementById("fleetModal").classList.remove("active");
}
