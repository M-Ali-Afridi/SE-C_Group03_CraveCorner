/* ==========================================================================
   Crave Corner - Cart Page Script (js/cart.js)
   Member 2 (Ordering): Cart page logic.

   SHARED CART CONTRACT (how Menu / Dish Details connect to Cart):
   - localStorage key "cc_cart" (also read by js/layout.js and js/dish-details.js)
     stores a JSON ARRAY of cart item objects.
   - Supported item shape:
     {
       lineId: "margherita-large-extra-cheese", // unique per dish + size + addons
       id: "margherita",                         // dish id
       name: "Margherita Pizza",                 // dish display name
       unitPrice: 1200,                          // final unit price in PKR (also accepts price)
       price: 1200,                              // alias supported for compatibility
       quantity: 1,                              // whole number >= 1 (also accepts qty)
       image: "images/margherita.jpg",           // path from repo root (optional)
       size: "Large",                            // size text or "" / null
       addons: ["Extra Cheese"]                  // array of add-on strings (can be empty)
     }
   - Note: Cart page lives in pages/cart.html, so relative image paths from
     the repository root automatically get "../" added in front when displayed.
   - localStorage key "cravePromo" stores the applied promo code as:
     {"code": "CRAVE10"} or is removed when no promo is active.
   ========================================================================== */

/* --------------------------------------------------------------------------
   Constants (all configuration values and page filenames in one place)
   -------------------------------------------------------------------------- */

// localStorage key where the shared cart array is saved
const CART_STORAGE_KEY = "cc_cart";

// localStorage key where the active promo code object is saved
const PROMO_STORAGE_KEY = "cravePromo";

// Delivery fee in PKR when the cart has at least one item
const DELIVERY_FEE = 150;

// Sales tax rate (5% of subtotal)
const TAX_RATE = 0.05;

// Only valid promo code (case-insensitive after trimming spaces)
const VALID_PROMO_CODE = "CRAVE10";

// Discount rate for the valid promo code (10% off subtotal)
const PROMO_DISCOUNT_RATE = 0.10;

// How long the invalid quantity error stays visible (in milliseconds)
const ERROR_DISPLAY_MS = 3000;

// Page filenames assumed across the group repository (pages/ folder)
const HOME_PAGE = "../index.html";
const MENU_PAGE = "menu.html";
const DISH_DETAILS_PAGE = "dish-details.html";
const DEALS_PAGE = "deals.html";
const RESERVATION_PAGE = "reservation.html";
const CATERING_PAGE = "catering.html";
const FAVORITES_PAGE = "favorites.html";
const ABOUT_PAGE = "about.html";
const CONTACT_PAGE = "contact.html";
const REVIEWS_PAGE = "reviews.html";
const LOGIN_PAGE = "login.html";
const ACCOUNT_PAGE = "account.html";
const CHECKOUT_PAGE = "checkout.html";

/* --------------------------------------------------------------------------
   Storage Helper Functions
   -------------------------------------------------------------------------- */

// Loads the cart array safely from localStorage; returns [] if missing or invalid
function loadCart() {
  try {
    var rawData = localStorage.getItem(CART_STORAGE_KEY);
    if (!rawData) {
      return [];
    }

    var parsedData = JSON.parse(rawData);
    if (!Array.isArray(parsedData)) {
      return [];
    }

    var cleanItems = [];
    for (var i = 0; i < parsedData.length; i = i + 1) {
      var rawItem = parsedData[i];
      if (!rawItem || typeof rawItem !== "object" || !rawItem.name) {
        continue;
      }

      // Support both price (contract) and unitPrice (dish-details.js)
      var rawPrice = rawItem.price !== undefined ? rawItem.price : rawItem.unitPrice;
      var unitPrice = Number(rawPrice);
      if (isNaN(unitPrice) || unitPrice < 0) {
        unitPrice = 0;
      }

      // Support both qty (contract) and quantity (dish-details.js)
      var rawQty = rawItem.qty !== undefined ? rawItem.qty : rawItem.quantity;
      var quantity = Math.round(Number(rawQty));
      if (isNaN(quantity) || quantity < 1) {
        quantity = 1;
      }

      var itemSize = "";
      if (typeof rawItem.size === "string" && rawItem.size.trim() !== "") {
        itemSize = rawItem.size.trim();
      }

      var itemAddons = [];
      if (Array.isArray(rawItem.addons)) {
        for (var j = 0; j < rawItem.addons.length; j = j + 1) {
          if (typeof rawItem.addons[j] === "string" && rawItem.addons[j].trim() !== "") {
            itemAddons.push(rawItem.addons[j].trim());
          }
        }
      }

      var itemId = typeof rawItem.id === "string" ? rawItem.id : "item-" + i;
      var itemLineId = "";
      if (typeof rawItem.lineId === "string" && rawItem.lineId.trim() !== "") {
        itemLineId = rawItem.lineId.trim();
      } else {
        itemLineId = itemId + "-" + itemSize.toLowerCase() + "-" + itemAddons.join("-").toLowerCase();
      }

      var itemImage = "";
      if (typeof rawItem.image === "string" && rawItem.image.trim() !== "") {
        itemImage = rawItem.image.trim();
      }

      cleanItems.push({
        lineId: itemLineId,
        id: itemId,
        name: String(rawItem.name),
        unitPrice: unitPrice,
        price: unitPrice,
        quantity: quantity,
        image: itemImage,
        size: itemSize,
        addons: itemAddons
      });
    }

    return cleanItems;
  } catch (error) {
    return [];
  }
}

// Stores active timeout IDs so repeated clicks reset the 3-second error timer
var quantityErrorTimers = {};

// Saves the cart array safely to localStorage
function saveCart(cartItems) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
  } catch (error) {
    // Ignore storage errors if browser blocks localStorage
  }
}

// Safely removes the stored promo code from localStorage
function clearStoredPromo() {
  try {
    localStorage.removeItem(PROMO_STORAGE_KEY);
  } catch (error) {
    // Ignore storage errors if browser blocks localStorage
  }
}

// Safely loads the applied promo code from localStorage; returns "" if none
function loadPromo() {
  try {
    var rawPromo = localStorage.getItem(PROMO_STORAGE_KEY);
    if (!rawPromo) {
      return "";
    }
    var parsedPromo = JSON.parse(rawPromo);
    if (parsedPromo && typeof parsedPromo.code === "string") {
      var cleanCode = parsedPromo.code.trim().toUpperCase();
      if (cleanCode === VALID_PROMO_CODE) {
        return cleanCode;
      }
    }
    return "";
  } catch (error) {
    return "";
  }
}

// Safely saves the valid promo code object to localStorage
function savePromo(code) {
  try {
    localStorage.setItem(PROMO_STORAGE_KEY, JSON.stringify({ code: code }));
  } catch (error) {
    // Ignore storage errors if browser blocks localStorage
  }
}

/* --------------------------------------------------------------------------
   Formatting & Header Badge Helpers
   -------------------------------------------------------------------------- */

// Formats a whole number in rupees like "Rs. 1,550"
function formatPrice(amount) {
  var rounded = Math.round(Number(amount));
  if (isNaN(rounded)) {
    rounded = 0;
  }
  return "Rs. " + rounded.toLocaleString("en-US");
}

// Adds "../" in front of repository-root image paths because cart.html is inside pages/
function buildImagePath(imagePath) {
  if (!imagePath) {
    return "";
  }
  if (
    imagePath.indexOf("../") === 0 ||
    imagePath.indexOf("http://") === 0 ||
    imagePath.indexOf("https://") === 0 ||
    imagePath.indexOf("data:") === 0
  ) {
    return imagePath;
  }
  return "../" + imagePath;
}

// Updates the Cart item-count badge in the shared header
function updateCartBadge() {
  if (typeof window.ccUpdateCartBadge === "function") {
    window.ccUpdateCartBadge();
    return;
  }

  var badgeEl = document.getElementById("cc-cart-count");
  if (!badgeEl) {
    return;
  }

  var cartItems = loadCart();
  var totalCount = 0;
  for (var i = 0; i < cartItems.length; i = i + 1) {
    totalCount = totalCount + cartItems[i].quantity;
  }
  badgeEl.textContent = String(totalCount);
}

/* --------------------------------------------------------------------------
   Cart Rendering Functions
   -------------------------------------------------------------------------- */

// Builds one white product card DOM element for a cart item
function createCartItemCard(item, index) {
  var card = document.createElement("article");
  card.className = "cc-card product-card";

  var topRow = document.createElement("div");
  topRow.className = "product-card-top";

  // Product image or clean fallback badge if image is missing or not found
  var imageWrap = document.createElement("div");
  imageWrap.className = "product-image-wrap";

  var fallback = document.createElement("span");
  fallback.className = "product-image-fallback";
  fallback.textContent = item.name.charAt(0).toUpperCase();
  fallback.setAttribute("aria-hidden", "true");

  if (item.image) {
    var img = document.createElement("img");
    img.className = "product-image";
    img.src = buildImagePath(item.image);
    img.alt = item.name;
    img.addEventListener("error", function () {
      img.style.display = "none";
      fallback.style.display = "block";
    });
    fallback.style.display = "none";
    imageWrap.appendChild(img);
    imageWrap.appendChild(fallback);
  } else {
    imageWrap.setAttribute("role", "img");
    imageWrap.setAttribute("aria-label", item.name);
    imageWrap.appendChild(fallback);
  }

  // Product title, optional size/add-ons, and unit price
  var infoCol = document.createElement("div");
  infoCol.className = "product-info";

  var title = document.createElement("h3");
  title.className = "product-name";
  title.textContent = item.name;
  infoCol.appendChild(title);

  var optionParts = [];
  if (item.size) {
    optionParts.push("Size: " + item.size);
  }
  if (item.addons.length > 0) {
    optionParts.push("Add-ons: " + item.addons.join(", "));
  }
  if (optionParts.length > 0) {
    var optionsText = document.createElement("p");
    optionsText.className = "product-options";
    optionsText.textContent = optionParts.join(" | ");
    infoCol.appendChild(optionsText);
  }

  var unitPriceText = document.createElement("p");
  unitPriceText.className = "product-unit-price";
  unitPriceText.textContent = formatPrice(item.unitPrice) + " each";
  infoCol.appendChild(unitPriceText);

  // Quantity stepper, item total, and trash remove button
  var controlsCol = document.createElement("div");
  controlsCol.className = "product-controls";

  var qtyBox = document.createElement("div");
  qtyBox.className = "qty-control";

  var minusBtn = document.createElement("button");
  minusBtn.type = "button";
  minusBtn.className = "qty-btn";
  minusBtn.textContent = "-";
  minusBtn.setAttribute("aria-label", "Decrease quantity of " + item.name);
  minusBtn.addEventListener("click", function () {
    decreaseQuantity(index);
  });

  var qtyNumber = document.createElement("span");
  qtyNumber.className = "qty-value";
  qtyNumber.textContent = String(item.quantity);
  qtyNumber.setAttribute("aria-label", "Quantity");

  var plusBtn = document.createElement("button");
  plusBtn.type = "button";
  plusBtn.className = "qty-btn";
  plusBtn.textContent = "+";
  plusBtn.setAttribute("aria-label", "Increase quantity of " + item.name);
  plusBtn.addEventListener("click", function () {
    increaseQuantity(index);
  });

  qtyBox.appendChild(minusBtn);
  qtyBox.appendChild(qtyNumber);
  qtyBox.appendChild(plusBtn);

  var itemTotalText = document.createElement("p");
  itemTotalText.className = "product-line-total";
  itemTotalText.textContent = formatPrice(item.unitPrice * item.quantity);

  var removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "remove-btn";
  removeBtn.setAttribute("aria-label", "Remove " + item.name + " from cart");
  removeBtn.title = "Remove item";
  removeBtn.addEventListener("click", function () {
    removeItem(index);
  });
  removeBtn.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" ' +
    'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<polyline points="3 6 5 6 21 6"></polyline>' +
    '<path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>' +
    '<path d="M10 11v6"></path>' +
    '<path d="M14 11v6"></path>' +
    '<path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"></path>' +
    "</svg>";

  controlsCol.appendChild(qtyBox);
  controlsCol.appendChild(itemTotalText);
  controlsCol.appendChild(removeBtn);

  topRow.appendChild(imageWrap);
  topRow.appendChild(infoCol);
  topRow.appendChild(controlsCol);

  // Per-item quantity error placeholder (filled if user tries to go below 1)
  var errorText = document.createElement("p");
  errorText.id = "product-error-" + index;
  errorText.className = "product-error d-none";
  errorText.setAttribute("role", "alert");
  errorText.setAttribute("aria-live", "polite");

  card.appendChild(topRow);
  card.appendChild(errorText);

  return card;
}

// Renders all cart items or displays the empty cart state
function showCart() {
  var cartItems = loadCart();
  var emptySection = document.getElementById("empty-cart-section");
  var cartLayout = document.getElementById("cart-layout");
  var itemsList = document.getElementById("cart-items-list");
  var mobileBar = document.getElementById("mobile-summary-bar");

  if (!emptySection || !cartLayout || !itemsList || !mobileBar) {
    return;
  }

  itemsList.innerHTML = "";
  for (var timerKey in quantityErrorTimers) {
    clearTimeout(quantityErrorTimers[timerKey]);
  }
  quantityErrorTimers = {};

  if (cartItems.length === 0) {
    emptySection.classList.remove("d-none");
    cartLayout.classList.add("d-none");
    mobileBar.classList.add("d-none");
    document.body.classList.remove("has-cart-items");
    clearStoredPromo();
    var promoInput = document.getElementById("promo-input");
    if (promoInput) {
      promoInput.value = "";
    }
    showPromoMessage("", true);
    calculateTotals(cartItems);
    updateCartBadge();
    return;
  }

  emptySection.classList.add("d-none");
  cartLayout.classList.remove("d-none");
  mobileBar.classList.remove("d-none");
  document.body.classList.add("has-cart-items");

  for (var i = 0; i < cartItems.length; i = i + 1) {
    var itemCard = createCartItemCard(cartItems[i], i);
    itemsList.appendChild(itemCard);
  }

  // Keep active promo message visible across page refreshes
  if (loadPromo() === VALID_PROMO_CODE) {
    showPromoMessage("Promo code " + VALID_PROMO_CODE + " applied! 10% discount included in total.", true);
  }

  calculateTotals(cartItems);
  updateCartBadge();
}

/* --------------------------------------------------------------------------
   Quantity Stepper & Remove Functions
   -------------------------------------------------------------------------- */

// Shows an invalid quantity error under a specific product card for 3 seconds
function showQuantityError(index) {
  var errorEl = document.getElementById("product-error-" + index);
  if (!errorEl) {
    return;
  }

  errorEl.textContent = "Invalid quantity. Please enter a valid quantity.";
  errorEl.classList.remove("d-none");

  if (quantityErrorTimers[index]) {
    clearTimeout(quantityErrorTimers[index]);
  }

  quantityErrorTimers[index] = setTimeout(function () {
    errorEl.textContent = "";
    errorEl.classList.add("d-none");
  }, ERROR_DISPLAY_MS);
}

// Increases an item's quantity by 1 and refreshes the cart
function increaseQuantity(index) {
  var cartItems = loadCart();
  if (index < 0 || index >= cartItems.length) {
    return;
  }

  cartItems[index].quantity = cartItems[index].quantity + 1;
  saveCart(cartItems);
  showCart();
}

// Decreases an item's quantity by 1, or shows an error if quantity is already 1
function decreaseQuantity(index) {
  var cartItems = loadCart();
  if (index < 0 || index >= cartItems.length) {
    return;
  }

  if (cartItems[index].quantity <= 1) {
    cartItems[index].quantity = 1;
    showQuantityError(index);
    return;
  }

  cartItems[index].quantity = cartItems[index].quantity - 1;
  saveCart(cartItems);
  showCart();
}

// Removes an item from the cart, clears promo if empty, and refreshes the cart
function removeItem(index) {
  var cartItems = loadCart();
  if (index < 0 || index >= cartItems.length) {
    return;
  }

  cartItems.splice(index, 1);
  saveCart(cartItems);

  if (cartItems.length === 0) {
    clearStoredPromo();
  }

  showCart();
}

/* --------------------------------------------------------------------------
   Promo Code & Price Calculation Functions
   -------------------------------------------------------------------------- */

// Displays a success (sage green) or error (terracotta) message below the promo input
function showPromoMessage(message, isSuccess) {
  var msgEl = document.getElementById("promo-message");
  if (!msgEl) {
    return;
  }

  msgEl.classList.remove("promo-message-success");
  msgEl.classList.remove("promo-message-error");

  if (!message) {
    msgEl.textContent = "";
    return;
  }

  msgEl.textContent = message;
  if (isSuccess) {
    msgEl.classList.add("promo-message-success");
  } else {
    msgEl.classList.add("promo-message-error");
  }
}

// Calculates subtotal, delivery fee, 5% tax, promo discount, and final total
function calculateTotals(cartItems) {
  var subtotal = 0;
  for (var i = 0; i < cartItems.length; i = i + 1) {
    subtotal = subtotal + (cartItems[i].unitPrice * cartItems[i].quantity);
  }

  var deliveryFee = 0;
  if (cartItems.length > 0) {
    deliveryFee = DELIVERY_FEE;
  }

  var taxAmount = Math.round(subtotal * TAX_RATE);

  var discountAmount = 0;
  if (cartItems.length > 0 && loadPromo() === VALID_PROMO_CODE) {
    discountAmount = Math.round(subtotal * PROMO_DISCOUNT_RATE);
  }

  var totalAmount = subtotal + deliveryFee + taxAmount - discountAmount;

  var subtotalEl = document.getElementById("summary-subtotal");
  var deliveryEl = document.getElementById("summary-delivery");
  var taxEl = document.getElementById("summary-tax");
  var totalEl = document.getElementById("summary-total");
  var mobileTotalEl = document.getElementById("mobile-summary-total");

  if (subtotalEl) {
    subtotalEl.textContent = formatPrice(subtotal);
  }
  if (deliveryEl) {
    deliveryEl.textContent = formatPrice(deliveryFee);
  }
  if (taxEl) {
    taxEl.textContent = formatPrice(taxAmount);
  }
  if (totalEl) {
    totalEl.textContent = formatPrice(totalAmount);
  }
  if (mobileTotalEl) {
    mobileTotalEl.textContent = formatPrice(totalAmount);
  }
}

// Validates and applies the promo code entered by the user
function applyPromo() {
  var promoInput = document.getElementById("promo-input");
  if (!promoInput) {
    return;
  }

  var enteredCode = promoInput.value.trim().toUpperCase();
  if (enteredCode === "") {
    showPromoMessage("Please enter a promo code.", false);
    return;
  }

  if (enteredCode !== VALID_PROMO_CODE) {
    showPromoMessage("Invalid promo code. Try " + VALID_PROMO_CODE + ".", false);
    return;
  }

  if (loadPromo() === VALID_PROMO_CODE) {
    showPromoMessage("Promo code " + VALID_PROMO_CODE + " is already applied.", false);
    return;
  }

  savePromo(VALID_PROMO_CODE);
  showPromoMessage("Promo code " + VALID_PROMO_CODE + " applied! 10% discount included in total.", true);
  calculateTotals(loadCart());
}

// Navigates to checkout.html only when the cart has at least one item
function goToCheckout() {
  var cartItems = loadCart();
  if (cartItems.length === 0) {
    return;
  }
  window.location.href = CHECKOUT_PAGE;
}

/* --------------------------------------------------------------------------
   Page Initialization
   -------------------------------------------------------------------------- */

// Sets up initial event listeners and renders the cart when the page loads
function initCartPage() {
  var applyPromoBtn = document.getElementById("apply-promo-btn");
  if (applyPromoBtn) {
    applyPromoBtn.addEventListener("click", applyPromo);
  }

  var promoInput = document.getElementById("promo-input");
  if (promoInput) {
    promoInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        applyPromo();
      }
    });
  }

  var checkoutBtn = document.getElementById("checkout-btn");
  if (checkoutBtn) {
    checkoutBtn.addEventListener("click", goToCheckout);
  }

  var mobileCheckoutBtn = document.getElementById("mobile-checkout-btn");
  if (mobileCheckoutBtn) {
    mobileCheckoutBtn.addEventListener("click", goToCheckout);
  }

  showCart();
}

document.addEventListener("DOMContentLoaded", initCartPage);
