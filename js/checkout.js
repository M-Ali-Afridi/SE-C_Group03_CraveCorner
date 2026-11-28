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
   INLINE VALIDATION — helpers and field validators
   ================================================================ */

// Track whether a field has been touched (blurred) at least once.
// We only show real-time input errors after the first blur.
var fieldTouched = {
    name:    false,
    email:   false,
    phone:   false,
    address: false
};

// Mark a field as invalid: red border, show the error message, hide the valid tick
function showError(fieldId, errorId, validId, message) {
    var field = document.getElementById(fieldId);
    var errEl = document.getElementById(errorId);
    var valEl = document.getElementById(validId);

    if (field) {
        field.classList.add("input-error");
        field.classList.remove("input-valid");
    }
    if (errEl) {
        errEl.textContent = message;
        errEl.style.display = "block";
    }
    if (valEl) {
        valEl.style.display = "none";
    }
}

// Mark a field as valid: green border, hide the error, show the valid tick
function clearError(fieldId, errorId, validId) {
    var field = document.getElementById(fieldId);
    var errEl = document.getElementById(errorId);
    var valEl = document.getElementById(validId);

    if (field) {
        field.classList.remove("input-error");
        field.classList.add("input-valid");
    }
    if (errEl) {
        errEl.style.display = "none";
    }
    if (valEl) {
        valEl.style.display = "block";
    }
}

// Validate the Full Name field (min 3 chars, letters and spaces only)
function validateName() {
    var field = document.getElementById("customer-name");
    if (!field) { return true; }
    var val = field.value.trim();
    if (val.length < 3) {
        showError("customer-name", "name-error", "name-valid",
                  "Name must be at least 3 characters.");
        return false;
    }
    var namePattern = /^[a-zA-Z\s]+$/;
    if (!namePattern.test(val)) {
        showError("customer-name", "name-error", "name-valid",
                  "Name can only contain letters and spaces.");
        return false;
    }
    clearError("customer-name", "name-error", "name-valid");
    return true;
}

// Validate the Email field (simple format check)
function validateEmail() {
    var field = document.getElementById("customer-email");
    if (!field) { return true; }
    var val = field.value.trim();
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(val)) {
        showError("customer-email", "email-error", "email-valid",
                  "Please enter a valid email address.");
        return false;
    }
    clearError("customer-email", "email-error", "email-valid");
    return true;
}

// Validate the Phone field (Pakistani format: 03xxxxxxxxx — 11 digits)
function validatePhone() {
    var field = document.getElementById("customer-phone");
    if (!field) { return true; }
    var raw = field.value.replace(/-/g, "").replace(/\s/g, "");
    var phonePattern = /^03\d{9}$/;
    if (!phonePattern.test(raw)) {
        showError("customer-phone", "phone-error", "phone-valid",
                  "Enter a valid Pakistani number, e.g. 03001234567.");
        return false;
    }
    clearError("customer-phone", "phone-error", "phone-valid");
    return true;
}

// Validate the Delivery Address field.
// Only required when Delivery (not Pickup) is selected.
function validateAddress() {
    var deliveryRadio = document.querySelector('[name="deliveryType"][value="delivery"]');
    var isDelivery    = deliveryRadio && deliveryRadio.checked;

    if (!isDelivery) {
        // Pickup — address is not needed; clear any existing error state
        var field = document.getElementById("customer-address");
        if (field) {
            field.classList.remove("input-error");
            field.classList.remove("input-valid");
        }
        var errEl = document.getElementById("address-error");
        if (errEl) { errEl.style.display = "none"; }
        return true;
    }

    var addrField = document.getElementById("customer-address");
    if (!addrField) { return true; }
    var val = addrField.value.trim();
    if (val.length < 10) {
        showError("customer-address", "address-error", "address-valid",
                  "Please enter your full delivery address (at least 10 characters).");
        return false;
    }
    clearError("customer-address", "address-error", "address-valid");
    return true;
}

// Validate that at least one Payment Method radio button is checked
function validatePayment() {
    var radios  = document.querySelectorAll('[name="paymentMethod"]');
    var checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            checked = true;
            break;
        }
    }
    var errEl = document.getElementById("payment-error");
    if (!checked) {
        if (errEl) {
            errEl.textContent = "Please select a payment method.";
            errEl.style.display = "block";
        }
        return false;
    }
    if (errEl) { errEl.style.display = "none"; }
    return true;
}

// Run all validators in order. Focus the first invalid field. Return true if all pass.
function validateAll() {
    var nameOk    = validateName();
    var emailOk   = validateEmail();
    var phoneOk   = validatePhone();
    var addressOk = validateAddress();
    var paymentOk = validatePayment();

    if (!nameOk) {
        var n = document.getElementById("customer-name");
        if (n) { n.focus(); }
        return false;
    }
    if (!emailOk) {
        var e = document.getElementById("customer-email");
        if (e) { e.focus(); }
        return false;
    }
    if (!phoneOk) {
        var p = document.getElementById("customer-phone");
        if (p) { p.focus(); }
        return false;
    }
    if (!addressOk) {
        var a = document.getElementById("customer-address");
        if (a) { a.focus(); }
        return false;
    }
    return paymentOk;
}

// Attach blur + input listeners so errors appear on first blur then update live
function attachFieldListeners() {
    // ---- Full Name ----
    var nameField = document.getElementById("customer-name");
    if (nameField) {
        nameField.addEventListener("blur", function () {
            fieldTouched.name = true;
            validateName();
        });
        nameField.addEventListener("input", function () {
            saveFormValues();
            if (fieldTouched.name) { validateName(); }
        });
    }

    // ---- Email ----
    var emailField = document.getElementById("customer-email");
    if (emailField) {
        emailField.addEventListener("blur", function () {
            fieldTouched.email = true;
            validateEmail();
        });
        emailField.addEventListener("input", function () {
            saveFormValues();
            if (fieldTouched.email) { validateEmail(); }
        });
    }

    // ---- Phone ----
    var phoneField = document.getElementById("customer-phone");
    if (phoneField) {
        phoneField.addEventListener("blur", function () {
            fieldTouched.phone = true;
            validatePhone();
        });
        phoneField.addEventListener("input", function () {
            saveFormValues();
            if (fieldTouched.phone) { validatePhone(); }
        });
    }

    // ---- Delivery Address ----
    var addrField = document.getElementById("customer-address");
    if (addrField) {
        addrField.addEventListener("blur", function () {
            fieldTouched.address = true;
            validateAddress();
        });
        addrField.addEventListener("input", function () {
            saveFormValues();
            if (fieldTouched.address) { validateAddress(); }
        });
    }
}

/* ================================================================
   DELIVERY TYPE TOGGLE
   ================================================================ */

// Called when the delivery/pickup radio changes.
// Shows or hides the delivery address field and recalculates the total.
function chooseDeliveryType() {
    var deliveryRadio = document.querySelector('[name="deliveryType"][value="delivery"]');
    var addressGroup  = document.getElementById("address-group");
    var isDelivery    = deliveryRadio && deliveryRadio.checked;

    if (addressGroup) {
        addressGroup.style.display = isDelivery ? "" : "none";
    }

    var cartItems = loadCart();
    var totals    = calculateTotals(cartItems, isDelivery);
    showTotals(totals);

    saveFormValues();
}

/* ================================================================
   FORM PERSISTENCE
   ================================================================ */

// Save all form field values to localStorage so they survive a reload
function saveFormValues() {
    try {
        var nameField  = document.getElementById("customer-name");
        var emailField = document.getElementById("customer-email");
        var phoneField = document.getElementById("customer-phone");
        var addrField  = document.getElementById("customer-address");
        var payRadio   = document.querySelector('[name="paymentMethod"]:checked');
        var delRadio   = document.querySelector('[name="deliveryType"]:checked');

        var formData = {
            name:         nameField  ? nameField.value  : "",
            email:        emailField ? emailField.value : "",
            phone:        phoneField ? phoneField.value : "",
            address:      addrField  ? addrField.value  : "",
            payment:      payRadio   ? payRadio.value   : "",
            deliveryType: delRadio   ? delRadio.value   : "delivery"
        };
        localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
        // Silently ignore storage errors
    }
}

// Restore saved form values from localStorage on page load
function loadFormValues() {
    var raw = "";
    try {
        raw = localStorage.getItem(FORM_STORAGE_KEY);
    } catch (e) {
        return;
    }
    if (!raw) { return; }

    var data = {};
    try {
        data = JSON.parse(raw);
    } catch (e) {
        return;
    }

    var nameField  = document.getElementById("customer-name");
    var emailField = document.getElementById("customer-email");
    var phoneField = document.getElementById("customer-phone");
    var addrField  = document.getElementById("customer-address");

    if (nameField  && data.name)    { nameField.value  = data.name;    }
    if (emailField && data.email)   { emailField.value = data.email;   }
    if (phoneField && data.phone)   { phoneField.value = data.phone;   }
    if (addrField  && data.address) { addrField.value  = data.address; }

    if (data.payment) {
        var payRadio = document.querySelector('[name="paymentMethod"][value="' + data.payment + '"]');
        if (payRadio) { payRadio.checked = true; }
    }

    if (data.deliveryType) {
        var delRadio = document.querySelector('[name="deliveryType"][value="' + data.deliveryType + '"]');
        if (delRadio) { delRadio.checked = true; }
    }

    // Apply the restored delivery type (show/hide address, recalc fee)
    chooseDeliveryType();
}

/* ================================================================
   NAVIGATION HELPERS
   ================================================================ */

// Navigate back to the cart page
function goBackToCart() {
    window.location.href = CART_URL;
}

/* ================================================================
   INITIALISATION — entry point (Phase 2: + delivery toggle)
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
                goBackToCart();
            });
        }
        return;
    }

    if (emptySection)   { emptySection.classList.add("d-none");      }
    if (checkoutLayout) { checkoutLayout.classList.remove("d-none"); }
    if (mobileSummary)  { mobileSummary.classList.remove("d-none");  }

    showOrderItems(cartItems);

    // Restore saved form values and trigger delivery toggle
    loadFormValues();

    // Calculate and show totals (chooseDeliveryType is already called inside loadFormValues)
    var deliveryRadio = document.querySelector('[name="deliveryType"][value="delivery"]');
    var isDelivery    = deliveryRadio && deliveryRadio.checked;
    var totals        = calculateTotals(cartItems, isDelivery);
    showTotals(totals);

    // Wire up Back to Cart button
    var backBtn = document.getElementById("back-to-cart-btn");
    if (backBtn) {
        backBtn.addEventListener("click", function () {
            goBackToCart();
        });
    }

    // Wire up delivery type radios
    var delRadios = document.querySelectorAll('[name="deliveryType"]');
    for (var j = 0; j < delRadios.length; j++) {
        delRadios[j].addEventListener("change", function () {
            chooseDeliveryType();
        });
    }

    // Wire up payment radios to validate and save form values
    var payRadios = document.querySelectorAll('[name="paymentMethod"]');
    for (var k = 0; k < payRadios.length; k++) {
        payRadios[k].addEventListener("change", function () {
            validatePayment();
            saveFormValues();
        });
    }

    // Attach field-level live validation listeners
    attachFieldListeners();
}

/* ================================================================
   BOOTSTRAP — start everything once the DOM is ready
   ================================================================ */
document.addEventListener("DOMContentLoaded", function () {
    initCheckoutPage();
});
