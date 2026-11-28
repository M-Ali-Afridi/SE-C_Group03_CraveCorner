/* ==========================================================================
   Author: M. Rehan Sadiq
   Roll Number: 26i-3122
   Section: Section C
   Crave Corner - My Account & Order History Script (js/account.js)
   Reads the logged-in session, manages per-user orders in localStorage,
   renders the order list and details modal, and handles logout.
   ========================================================================== */

(function () {
  "use strict";

  var SESSION_KEY = "cc_current_user";
  var ORDERS_KEY = "cc_orders";

  // Demo account: sample orders are seeded ONLY for this email (case-insensitive)
  // so the order-details feature can be demonstrated without affecting real users.
  var DEMO_EMAIL = "demo@cravecorner.com";

  // The three sample orders seeded exclusively for the demo account above
  var SAMPLE_ORDERS = [
    {
      id: "#CC104",
      status: "Delivered",
      items: [{ name: "Chicken Burger", price: 650, qty: 1 }],
      deliveryFee: 0
    },
    {
      id: "#CC105",
      status: "Preparing",
      items: [{ name: "Zinger Burger", price: 750, qty: 1 }],
      deliveryFee: 0
    },
    {
      id: "#CC106",
      status: "Cancelled",
      items: [{ name: "Loaded Fries", price: 450, qty: 1 }],
      deliveryFee: 0
    }
  ];

  var activeUserOrders = [];

  /* ------------------------------------------------------------------------
     1. Storage & Session Helpers
     ------------------------------------------------------------------------ */

  /**
   * Safely parses JSON from localStorage or sessionStorage.
   */
  function readJsonFromStorage(storage, key, fallback) {
    try {
      var raw = storage.getItem(key);
      if (!raw) {
        return fallback;
      }
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  /**
   * Reads the active session the same way js/auth.js does
   * (checks localStorage first for Remember Me, then sessionStorage).
   */
  function getCurrentSession() {
    var localSession = readJsonFromStorage(window.localStorage, SESSION_KEY, null);
    if (localSession && typeof localSession === "object" && localSession.email) {
      return localSession;
    }

    var tabSession = readJsonFromStorage(window.sessionStorage, SESSION_KEY, null);
    if (tabSession && typeof tabSession === "object" && tabSession.email) {
      return tabSession;
    }

    return null;
  }

  /**
   * Clears the active session from both localStorage and sessionStorage.
   */
  function clearSession() {
    try {
      window.localStorage.removeItem(SESSION_KEY);
      window.sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      // Ignore storage removal errors
    }
  }

  /**
   * Normalizes the user's email for consistent per-user order storage lookup.
   */
  function getUserOrderKey(session) {
    return String((session && session.email) || "").trim().toLowerCase();
  }

  /**
   * Extracts the user's first name without changing capitalization.
   */
  function getExactFirstName(session) {
    if (session && typeof session.firstName === "string" && session.firstName.trim()) {
      return session.firstName.trim();
    }
    var full = String((session && session.fullName) || "").trim();
    return full ? full.split(/\s+/)[0] : "Guest";
  }

  /**
   * Creates a clean copy of the sample orders array.
   */
  function cloneSampleOrders() {
    return SAMPLE_ORDERS.map(function (order) {
      return {
        id: order.id,
        status: order.status,
        items: order.items.map(function (item) {
          return {
            name: item.name,
            price: item.price,
            qty: item.qty
          };
        }),
        deliveryFee: order.deliveryFee
      };
    });
  }

  /**
   * Sanitizes a single order object so missing or invalid fields never crash the UI.
   */
  function normalizeOrder(rawOrder) {
    if (!rawOrder || typeof rawOrder !== "object") {
      return null;
    }

    var orderId = typeof rawOrder.id === "string" && rawOrder.id.trim()
      ? rawOrder.id.trim()
      : "#CC000";

    var status = typeof rawOrder.status === "string" && rawOrder.status.trim()
      ? rawOrder.status.trim()
      : "Preparing";

    var cleanItems = [];
    if (Array.isArray(rawOrder.items)) {
      rawOrder.items.forEach(function (rawItem) {
        if (!rawItem || typeof rawItem !== "object") {
          return;
        }
        var itemName = typeof rawItem.name === "string" && rawItem.name.trim()
          ? rawItem.name.trim()
          : "Dish";
        var itemPrice = Number(rawItem.price);
        var itemQty = Number(rawItem.qty);

        cleanItems.push({
          name: itemName,
          price: !isNaN(itemPrice) && itemPrice >= 0 ? itemPrice : 0,
          qty: !isNaN(itemQty) && itemQty > 0 ? Math.floor(itemQty) : 1
        });
      });
    }

    var fee = Number(rawOrder.deliveryFee);
    return {
      id: orderId,
      status: status,
      items: cleanItems,
      deliveryFee: !isNaN(fee) && fee > 0 ? fee : 0
    };
  }

  /**
   * Loads orders for the current user from localStorage key "cc_orders".
   * Seeds sample orders ONLY for the demo account on its first visit.
   * All other users with no saved orders see the empty state.
   * Recovers gracefully if stored data is missing or corrupted.
   */
  function loadOrSeedUserOrders(session) {
    var userKey = getUserOrderKey(session);
    var allOrders = null;

    // Try to read the entire cc_orders map from localStorage
    try {
      var raw = window.localStorage.getItem(ORDERS_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          allOrders = parsed;
        }
      }
    } catch (error) {
      // Corrupted JSON — treat as if nothing is stored
      allOrders = null;
    }

    // Check whether this user already has an orders entry
    var userHasEntry = allOrders &&
      Object.prototype.hasOwnProperty.call(allOrders, userKey);

    if (!userHasEntry) {
      // Only seed sample orders for the demo account; everyone else gets the empty state
      var isDemoAccount = userKey === DEMO_EMAIL.trim().toLowerCase();
      if (isDemoAccount) {
        var seeded = cloneSampleOrders();
        var nextMap = allOrders || {};
        nextMap[userKey] = seeded;
        try {
          window.localStorage.setItem(ORDERS_KEY, JSON.stringify(nextMap));
        } catch (error) {
          // Keep the in-memory list if the write fails
        }
        return seeded;
      }
      // Not the demo account and no saved orders — show the empty state
      return [];
    }

    var userEntries = allOrders[userKey];
    if (!Array.isArray(userEntries)) {
      return [];
    }

    var validOrders = [];
    userEntries.forEach(function (entry) {
      var clean = normalizeOrder(entry);
      if (clean && clean.items.length > 0) {
        validOrders.push(clean);
      }
    });
    return validOrders;
  }

  /* ------------------------------------------------------------------------
     2. Calculation & Formatting Helpers
     ------------------------------------------------------------------------ */

  /**
   * Formats a numeric PKR value as "Rs. 650".
   */
  function formatPrice(amount) {
    var safeAmount = Number(amount);
    if (isNaN(safeAmount)) {
      safeAmount = 0;
    }
    return "Rs. " + safeAmount.toLocaleString("en-US");
  }

  /**
   * Calculates subtotal, delivery fee, and grand total for an order.
   */
  function calculateOrderTotals(order) {
    var subtotal = 0;
    order.items.forEach(function (item) {
      subtotal += item.price * item.qty;
    });

    var deliveryFee = order.deliveryFee > 0 ? order.deliveryFee : 0;
    return {
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      total: subtotal + deliveryFee
    };
  }

  /**
   * Returns the CSS class matching the order status badge colour.
   */
  function getStatusBadgeClass(status) {
    var normalized = String(status || "").trim().toLowerCase();
    if (normalized === "delivered") {
      return "cc-status-badge cc-status-delivered";
    }
    if (normalized === "cancelled") {
      return "cc-status-badge cc-status-cancelled";
    }
    return "cc-status-badge cc-status-preparing";
  }

  /**
   * Builds the primary dish summary text shown on an order row.
   */
  function getOrderDishSummary(order) {
    if (!order.items || order.items.length === 0) {
      return "Order Items";
    }
    if (order.items.length === 1) {
      return order.items[0].name;
    }
    return order.items[0].name + " +" + (order.items.length - 1) + " more";
  }

  /* ------------------------------------------------------------------------
     3. UI Rendering & Modal Helpers
     ------------------------------------------------------------------------ */

  /**
   * Updates the shared header account dropdown to show the logged-in user's name,
   * active "My Account" link, and "Logout" option without modifying js/layout.js.
   */
  function syncHeaderAccountState(session) {
    var accountBtn = document.getElementById("ccAccountDropdown");
    if (!accountBtn) {
      return;
    }

    var dropdownWrapper = accountBtn.closest(".dropdown");
    var menuEl = dropdownWrapper ? dropdownWrapper.querySelector(".dropdown-menu") : null;
    if (!menuEl) {
      return;
    }

    var firstName = getExactFirstName(session);
    var accountSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
        '<circle cx="12" cy="7" r="4"></circle>' +
      "</svg>";

    accountBtn.innerHTML = accountSvg;
    var nameSpan = document.createElement("span");
    nameSpan.className = "cc-header-user-name";
    nameSpan.textContent = firstName;
    accountBtn.appendChild(nameSpan);
    accountBtn.setAttribute("aria-label", "Account: " + session.fullName);
    accountBtn.setAttribute("title", session.fullName);

    menuEl.innerHTML = "";

    var userHeaderLi = document.createElement("li");
    var userHeaderSpan = document.createElement("span");
    userHeaderSpan.className = "dropdown-item-text fw-semibold cc-dropdown-user-label";
    userHeaderSpan.textContent = session.fullName;
    userHeaderLi.appendChild(userHeaderSpan);

    var dividerLi = document.createElement("li");
    dividerLi.innerHTML = '<hr class="dropdown-divider">';

    var myAccountLi = document.createElement("li");
    var myAccountLink = document.createElement("a");
    myAccountLink.className = "dropdown-item active";
    myAccountLink.href = "account.html";
    myAccountLink.setAttribute("aria-current", "page");
    myAccountLink.textContent = "My Account";
    myAccountLi.appendChild(myAccountLink);

    var logoutLi = document.createElement("li");
    var logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.id = "cc-header-logout-btn";
    logoutBtn.className = "dropdown-item cc-dropdown-logout";
    logoutBtn.textContent = "Logout";
    logoutBtn.addEventListener("click", handleLogout);
    logoutLi.appendChild(logoutBtn);

    menuEl.appendChild(userHeaderLi);
    menuEl.appendChild(dividerLi);
    menuEl.appendChild(myAccountLi);
    menuEl.appendChild(logoutLi);
  }

  /**
   * Renders the user's welcome greeting using the exact first name from sign-up.
   */
  function renderProfileWelcome(session) {
    var welcomeEl = document.getElementById("account-welcome-text");
    if (welcomeEl) {
      welcomeEl.textContent = "Welcome, " + getExactFirstName(session) + "!";
    }
  }

  /**
   * Renders the bordered list of orders or the friendly empty-state panel.
   */
  function renderOrdersList(orders) {
    var listEl = document.getElementById("orders-list");
    var emptyEl = document.getElementById("orders-empty-state");
    if (!listEl || !emptyEl) {
      return;
    }

    listEl.innerHTML = "";

    if (!orders || orders.length === 0) {
      listEl.classList.add("d-none");
      emptyEl.classList.remove("d-none");
      return;
    }

    emptyEl.classList.add("d-none");
    listEl.classList.remove("d-none");

    orders.forEach(function (order) {
      var totals = calculateOrderTotals(order);

      var row = document.createElement("article");
      row.className = "cc-order-row";

      var mainInfo = document.createElement("div");
      mainInfo.className = "cc-order-main";

      var idSpan = document.createElement("span");
      idSpan.className = "cc-order-id";
      idSpan.textContent = order.id;

      var dishSpan = document.createElement("span");
      dishSpan.className = "cc-order-dish";
      dishSpan.textContent = getOrderDishSummary(order);

      mainInfo.appendChild(idSpan);
      mainInfo.appendChild(dishSpan);

      var metaInfo = document.createElement("div");
      metaInfo.className = "cc-order-meta";

      var priceSpan = document.createElement("span");
      priceSpan.className = "cc-price cc-order-price";
      priceSpan.textContent = formatPrice(totals.total);

      var statusSpan = document.createElement("span");
      statusSpan.className = getStatusBadgeClass(order.status);
      statusSpan.textContent = order.status;

      var detailsBtn = document.createElement("button");
      detailsBtn.type = "button";
      detailsBtn.className = "btn btn-cc-secondary cc-view-details-btn";
      detailsBtn.textContent = "View Details";
      detailsBtn.setAttribute("aria-label", "View details for order " + order.id);
      detailsBtn.addEventListener("click", function () {
        openOrderModal(order);
      });

      metaInfo.appendChild(priceSpan);
      metaInfo.appendChild(statusSpan);
      metaInfo.appendChild(detailsBtn);

      row.appendChild(mainInfo);
      row.appendChild(metaInfo);
      listEl.appendChild(row);
    });
  }

  /**
   * Populates and opens the Bootstrap modal for the selected order.
   */
  function openOrderModal(order) {
    var modalEl = document.getElementById("orderDetailsModal");
    var titleEl = document.getElementById("orderDetailsModalLabel");
    var statusEl = document.getElementById("modal-order-status");
    var itemsBodyEl = document.getElementById("modal-order-items-body");
    var subtotalEl = document.getElementById("modal-order-subtotal");
    var deliveryRowEl = document.getElementById("modal-delivery-row");
    var deliveryEl = document.getElementById("modal-order-delivery");
    var totalEl = document.getElementById("modal-order-total");

    if (!modalEl || !titleEl || !statusEl || !itemsBodyEl || !subtotalEl || !deliveryRowEl || !deliveryEl || !totalEl) {
      return;
    }

    titleEl.textContent = "Order " + order.id;
    statusEl.className = getStatusBadgeClass(order.status);
    statusEl.textContent = order.status;

    itemsBodyEl.innerHTML = "";
    order.items.forEach(function (item) {
      var lineTotal = item.price * item.qty;

      var tr = document.createElement("tr");

      var nameTd = document.createElement("td");
      nameTd.textContent = item.name;

      var qtyTd = document.createElement("td");
      qtyTd.className = "text-center";
      qtyTd.textContent = String(item.qty);

      var unitTd = document.createElement("td");
      unitTd.className = "text-end";
      unitTd.textContent = formatPrice(item.price);

      var lineTd = document.createElement("td");
      lineTd.className = "text-end fw-medium";
      lineTd.textContent = formatPrice(lineTotal);

      tr.appendChild(nameTd);
      tr.appendChild(qtyTd);
      tr.appendChild(unitTd);
      tr.appendChild(lineTd);
      itemsBodyEl.appendChild(tr);
    });

    var totals = calculateOrderTotals(order);
    subtotalEl.textContent = formatPrice(totals.subtotal);

    if (totals.deliveryFee > 0) {
      deliveryEl.textContent = formatPrice(totals.deliveryFee);
      deliveryRowEl.classList.remove("d-none");
    } else {
      deliveryRowEl.classList.add("d-none");
    }

    totalEl.textContent = formatPrice(totals.total);

    if (window.bootstrap && window.bootstrap.Modal) {
      var modalInstance = window.bootstrap.Modal.getOrCreateInstance(modalEl);
      modalInstance.show();
    }
  }

  /* ------------------------------------------------------------------------
     4. Actions & Initialization
     ------------------------------------------------------------------------ */

  /**
   * Clears the session the same way js/auth.js does and returns to login.html.
   */
  function handleLogout() {
    clearSession();
    window.location.href = "login.html";
  }

  /**
   * Initializes the My Account page: checks auth, renders profile and orders.
   */
  function initAccountPage() {
    var session = getCurrentSession();
    if (!session) {
      window.location.replace("login.html");
      return;
    }

    var dashboardEl = document.getElementById("account-dashboard");
    if (dashboardEl) {
      dashboardEl.classList.remove("d-none");
    }

    syncHeaderAccountState(session);
    renderProfileWelcome(session);

    activeUserOrders = loadOrSeedUserOrders(session);
    renderOrdersList(activeUserOrders);

    var logoutBtn = document.getElementById("account-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }
  }

  document.addEventListener("DOMContentLoaded", initAccountPage);
})();
