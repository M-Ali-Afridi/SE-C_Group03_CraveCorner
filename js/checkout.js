/* =============================================================
   js/checkout.js  —  Crave Corner · Checkout Page
   Member 2 (Ordering) | Branch: i263145
   Phase 1: cart data loading and order summary rendering
   ============================================================= */

/* ----------------------------------------------------------------
   CONSTANTS — page filenames and storage / business-logic values
   ---------------------------------------------------------------- */
var CART_URL                = "cart.html";               // Cart page (same pages/ folder)
var MENU_URL                = "menu.html";               // Menu page (same pages/ folder)
var ORDER_CONFIRMATION_URL  = "order-confirmation.html"; // Order Confirmation page (same pages/ folder)

var CART_STORAGE_KEY  = "cc_cart";           // localStorage key for the cart array
var PROMO_STORAGE_KEY = "cravePromo";        // localStorage key for the active promo code
var ORDER_STORAGE_KEY = "cc_last_order";     // localStorage key for the most recent placed order
var ORDERS_LIST_KEY   = "cc_orders";         // localStorage key for the full order history list
var FORM_STORAGE_KEY  = "cc_checkout_form";  // localStorage key for auto-saved form values

var DELIVERY_FEE         = 150;       // flat delivery fee in PKR
var PICKUP_FEE           = 0;         // fee charged when customer selects Pickup
var TAX_RATE             = 0.05;      // 5% tax applied to the subtotal
var VALID_PROMO_CODE     = "CRAVE10"; // the only accepted promo code
var PROMO_DISCOUNT_RATE  = 0.10;     // 10% discount applied when promo is active

/* ================================================================
   DATA LAYER
   ================================================================ */

// Read the cart array from localStorage.
// Normalises items so the rest of the code always has:
// id, name, unitPrice, quantity, image, size, addons.
function loadCart() {
    var raw = "";
    try {
        raw = localStorage.getItem(CART_STORAGE_KEY);
    } catch (e) {
        return [];
    }
    if (!raw) {
        return [];
    }
    var items = [];
    try {
        items = JSON.parse(raw);
    } catch (e) {
        return [];
    }
    if (!Array.isArray(items)) {
        return [];
    }

    // Normalise field names (cart.js stores price/unitPrice and qty/quantity)
    var clean = [];
    for (var i = 0; i < items.length; i++) {
        var it = items[i];
        var unitPrice = (it.price !== undefined) ? it.price : (it.unitPrice || 0);
        var quantity  = (it.qty  !== undefined)  ? it.qty  : (it.quantity  || 1);
        clean.push({
            lineId:    it.lineId    || it.id || i,
            id:        it.id        || "",
            name:      it.name      || "Item",
            unitPrice: unitPrice,
            quantity:  quantity,
            image:     it.image     || "",
            size:      it.size      || "",
            addons:    it.addons    || []
        });
    }
    return clean;
}

// Read the saved promo code from localStorage.
// Returns "CRAVE10" if the stored code is valid, otherwise returns "".
function loadPromo() {
    var raw = "";
    try {
        raw = localStorage.getItem(PROMO_STORAGE_KEY);
    } catch (e) {
        return "";
    }
    if (!raw) {
        return "";
    }
    var obj = {};
    try {
        obj = JSON.parse(raw);
    } catch (e) {
        return "";
    }
    if (obj && obj.code === VALID_PROMO_CODE) {
        return VALID_PROMO_CODE;
    }
    return "";
}

/* ================================================================
   FORMATTING
   ================================================================ */

// Return a formatted price string — e.g. "Rs. 1,500"
function formatPrice(amount) {
    return "Rs. " + Math.round(amount).toLocaleString("en-US");
}

// Escape HTML special characters to prevent XSS when inserting text
function escapeHtml(text) {
    var div = document.createElement("div");
    div.appendChild(document.createTextNode(String(text)));
    return div.innerHTML;
}

/* ================================================================
   ORDER SUMMARY RENDERING
   ================================================================ */

// Build one HTML row string for a single cart item in the summary panel
function buildItemRow(item) {
    var lineTotal = Math.round(item.unitPrice * item.quantity);

    // Build options line from size + addons
    var optionParts = [];
    if (item.size) {
        optionParts.push(item.size);
    }
    if (item.addons && item.addons.length > 0) {
        for (var i = 0; i < item.addons.length; i++) {
            optionParts.push(item.addons[i]);
        }
    }
    var optionsText = optionParts.join(", ");

    var html = '<div class="summary-item-row">';
    html +=   '<div class="summary-item-info">';
    html +=     '<span class="summary-item-name">' + escapeHtml(item.name) + '</span>';
    if (optionsText) {
        html += '<span class="summary-item-options">' + escapeHtml(optionsText) + '</span>';
    }
    html +=     '<span class="summary-item-qty">Qty: ' + item.quantity + ' &times; ' + formatPrice(item.unitPrice) + '</span>';
    html +=   '</div>';
    html +=   '<span class="summary-item-total">' + formatPrice(lineTotal) + '</span>';
    html += '</div>';
    return html;
}

// Render all cart items into the #checkout-items-list container
function showOrderItems(cartItems) {
    var container = document.getElementById("checkout-items-list");
    if (!container) {
        return;
    }
    if (!cartItems || cartItems.length === 0) {
        container.innerHTML = '<p class="text-muted">No items.</p>';
        return;
    }
    var html = "";
    for (var i = 0; i < cartItems.length; i++) {
        html += buildItemRow(cartItems[i]);
    }
    container.innerHTML = html;
}

/* ================================================================
   TOTALS CALCULATION & DISPLAY
   ================================================================ */

// Calculate all monetary totals from the cart items.
// isDelivery: true = charge DELIVERY_FEE, false = PICKUP_FEE (free)
// Returns an object: { subtotal, deliveryFee, taxAmount,
//                      discountAmount, promoActive, totalAmount }
function calculateTotals(cartItems, isDelivery) {
    var subtotal = 0;
    for (var i = 0; i < cartItems.length; i++) {
        subtotal += cartItems[i].unitPrice * cartItems[i].quantity;
    }
    subtotal = Math.round(subtotal);

    var fee = isDelivery ? DELIVERY_FEE : PICKUP_FEE;

    var taxAmount = Math.round(subtotal * TAX_RATE);

    var promoCode      = loadPromo();
    var promoActive    = (promoCode === VALID_PROMO_CODE);
    var discountAmount = promoActive ? Math.round(subtotal * PROMO_DISCOUNT_RATE) : 0;

    var totalAmount = subtotal + fee + taxAmount - discountAmount;

    return {
        subtotal:       subtotal,
        deliveryFee:    fee,
        taxAmount:      taxAmount,
        discountAmount: discountAmount,
        promoActive:    promoActive,
        totalAmount:    totalAmount
    };
}

// Push totals into the summary panel DOM elements
function showTotals(totals) {
    var subEl    = document.getElementById("summary-subtotal");
    var delEl    = document.getElementById("summary-delivery");
    var taxEl    = document.getElementById("summary-tax");
    var totalEl  = document.getElementById("summary-total");
    var discRow  = document.getElementById("summary-discount-row");
    var discEl   = document.getElementById("summary-discount");
    var mobTotal = document.getElementById("mobile-summary-total");

    if (subEl)    { subEl.textContent    = formatPrice(totals.subtotal); }
    if (delEl)    { delEl.textContent    = totals.deliveryFee === 0 ? "Free" : formatPrice(totals.deliveryFee); }
    if (taxEl)    { taxEl.textContent    = formatPrice(totals.taxAmount); }
    if (totalEl)  { totalEl.textContent  = formatPrice(totals.totalAmount); }
    if (mobTotal) { mobTotal.textContent = formatPrice(totals.totalAmount); }

    if (discRow && discEl) {
        if (totals.promoActive && totals.discountAmount > 0) {
            discEl.textContent = "- " + formatPrice(totals.discountAmount);
            discRow.classList.remove("d-none");
        } else {
            discRow.classList.add("d-none");
        }
    }
}

/* ================================================================
   INITIALISATION — entry point (Phase 1: summary only)
   ================================================================ */
function initCheckoutPage() {
    var cartItems = loadCart();

    var emptySection   = document.getElementById("empty-checkout-section");
    var checkoutLayout = document.getElementById("checkout-layout");
    var mobileSummary  = document.getElementById("mobile-summary-bar");

    if (cartItems.length === 0) {
        if (emptySection)   { emptySection.classList.remove("d-none"); }
        if (checkoutLayout) { checkoutLayout.classList.add("d-none");  }
        if (mobileSummary)  { mobileSummary.classList.add("d-none");   }

        var emptyBackBtn = document.getElementById("empty-back-to-cart-btn");
        if (emptyBackBtn) {
            emptyBackBtn.addEventListener("click", function () {
                window.location.href = CART_URL;
            });
        }
        return;
    }

    if (emptySection)   { emptySection.classList.add("d-none");      }
    if (checkoutLayout) { checkoutLayout.classList.remove("d-none"); }
    if (mobileSummary)  { mobileSummary.classList.remove("d-none");  }

    showOrderItems(cartItems);

    // Default: delivery is selected, so calculate with delivery fee
    var deliveryRadio = document.querySelector('[name="deliveryType"][value="delivery"]');
    var isDelivery    = deliveryRadio && deliveryRadio.checked;
    var totals        = calculateTotals(cartItems, isDelivery);
    showTotals(totals);
}

/* ================================================================
   BOOTSTRAP — start everything once the DOM is ready
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {
    initCheckoutPage();
});
