/* ==========================================================================
   Crave Corner - Dish Details Page Script (js/dish-details.js)
   Reads ?id=<dish-id> from the URL, renders dish details from MENU_ITEMS,
   manages size/add-ons/quantity, updates live totals, saves to cc_cart and
   cc_recent in localStorage, and renders related dishes.
   ========================================================================== */

(function () {
  "use strict";

  var CART_KEY = "cc_cart";
  var RECENT_KEY = "cc_recent";
  var MAX_RECENT = 4;
  var MIN_QTY = 1;
  var MAX_QTY = 10;

  var PIZZA_SIZES = [
    { key: "small", name: "Small", label: "Small (7 inch)" },
    { key: "medium", name: "Medium", label: "Medium (10 inch)" },
    { key: "large", name: "Large", label: "Large (13 inch)" }
  ];

  // Category-specific add-ons and prices in PKR
  const ADDONS = {
    Burgers: [
      { name: "Extra Cheese Slice", price: 80 },
      { name: "Extra Patty", price: 250 },
      { name: "Jalapenos", price: 50 }
    ],
    Pizza: [
      { name: "Extra Cheese", price: 150 },
      { name: "Stuffed Crust", price: 200 },
      { name: "Extra Toppings", price: 120 }
    ],
    Pasta: [
      { name: "Extra Chicken", price: 150 },
      { name: "Extra Cheese", price: 100 }
    ],
    Sides: [
      { name: "Dipping Sauce", price: 50 },
      { name: "Cheese Sauce", price: 80 }
    ],
    Drinks: []
  };

  var errorContainer = document.getElementById("dish-error-state");
  var detailSection = document.getElementById("dish-detail-section");
  var recentSection = document.getElementById("recently-viewed-section");
  var relatedSection = document.getElementById("related-dishes-section");

  if (!errorContainer || !detailSection || !recentSection || !relatedSection || typeof MENU_ITEMS === "undefined") {
    return;
  }

  /**
   * Formats a numeric PKR amount as "Rs. 1,099".
   */
  function formatPrice(amount) {
    return "Rs. " + Number(amount).toLocaleString("en-US");
  }

  /**
   * Finds a dish object in MENU_ITEMS by its id string.
   */
  function findDishById(dishId) {
    if (!dishId) {
      return null;
    }

    for (var i = 0; i < MENU_ITEMS.length; i += 1) {
      if (MENU_ITEMS[i].id === dishId) {
        return MENU_ITEMS[i];
      }
    }
    return null;
  }

  /**
   * Reads the dish id from the URL query string (?id=...).
   */
  function getRequestedDishId() {
    var params = new URLSearchParams(window.location.search);
    return (params.get("id") || "").trim();
  }

  /**
   * Safely reads a JSON array from localStorage; returns [] if missing or invalid.
   */
  function readJsonArray(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Safely writes a value as JSON to localStorage.
   */
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore storage failures in restricted browser modes
    }
  }

  /**
   * Records the current dish id at the front of cc_recent (no duplicates, max 4).
   */
  function recordRecentlyViewed(dishId) {
    var stored = readJsonArray(RECENT_KEY).filter(function (id) {
      return typeof id === "string" && id !== dishId && findDishById(id) !== null;
    });

    stored.unshift(dishId);
    if (stored.length > MAX_RECENT) {
      stored = stored.slice(0, MAX_RECENT);
    }

    writeJson(RECENT_KEY, stored);
    return stored;
  }

  /**
   * Renders the friendly not-found error state and leaves all other sections empty.
   */
  function renderNotFoundState() {
    errorContainer.innerHTML = "";
    detailSection.innerHTML = "";
    recentSection.innerHTML = "";
    relatedSection.innerHTML = "";
    detailSection.classList.add("d-none");
    recentSection.classList.add("d-none");
    relatedSection.classList.add("d-none");

    var card = document.createElement("div");
    card.className = "cc-card p-4 p-md-5 text-center";
    card.setAttribute("role", "alert");

    var message = document.createElement("p");
    message.className = "cc-alert-error p-3 mb-4";
    message.textContent = "Sorry, we could not find that dish.";

    var backBtn = document.createElement("a");
    backBtn.href = "menu.html";
    backBtn.className = "btn btn-cc-primary";
    backBtn.textContent = "Back to Menu";

    card.appendChild(message);
    card.appendChild(backBtn);
    errorContainer.appendChild(card);
  }

  /**
   * Creates a small linked card for Recently Viewed and You May Also Like rows.
   */
  function createSmallDishCard(item) {
    var col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-3";

    var linkCard = document.createElement("a");
    linkCard.href = "dish-details.html?id=" + encodeURIComponent(item.id);
    linkCard.className = "cc-card cc-small-card h-100";

    var title = document.createElement("h3");
    title.className = "cc-small-card-title";
    title.textContent = item.name;

    var price = document.createElement("p");
    price.className = "cc-price mb-0";
    if (item.sizes) {
      var minPrice = Math.min(item.sizes.small, item.sizes.medium, item.sizes.large);
      price.textContent = "from " + formatPrice(minPrice);
    } else {
      price.textContent = formatPrice(item.price);
    }

    linkCard.appendChild(title);
    linkCard.appendChild(price);
    col.appendChild(linkCard);

    return col;
  }

  /**
   * Renders the "Recently viewed" section excluding the current dish.
   */
  function renderRecentlyViewed(recentIds, currentDishId) {
    recentSection.innerHTML = "";

    var heading = document.createElement("h2");
    heading.className = "h4 mb-3";
    heading.textContent = "Recently viewed";
    recentSection.appendChild(heading);

    var otherDishes = [];
    recentIds.forEach(function (id) {
      if (id !== currentDishId) {
        var found = findDishById(id);
        if (found) {
          otherDishes.push(found);
        }
      }
    });

    if (otherDishes.length === 0) {
      var emptyLine = document.createElement("p");
      emptyLine.className = "cc-empty-note mb-0";
      emptyLine.textContent = "Dishes you view will appear here.";
      recentSection.appendChild(emptyLine);
      return;
    }

    var row = document.createElement("div");
    row.className = "row g-3";
    otherDishes.forEach(function (item) {
      row.appendChild(createSmallDishCard(item));
    });
    recentSection.appendChild(row);
  }

  /**
   * Renders up to 3 other dishes from the same category in "You may also like".
   */
  function renderRelatedDishes(currentDish) {
    relatedSection.innerHTML = "";

    var relatedItems = MENU_ITEMS.filter(function (item) {
      return item.category === currentDish.category && item.id !== currentDish.id;
    }).slice(0, 3);

    var heading = document.createElement("h2");
    heading.className = "h4 mb-3";
    heading.textContent = "You may also like";
    relatedSection.appendChild(heading);

    if (relatedItems.length === 0) {
      return;
    }

    var row = document.createElement("div");
    row.className = "row g-3";
    relatedItems.forEach(function (item) {
      row.appendChild(createSmallDishCard(item));
    });
    relatedSection.appendChild(row);
  }

  /**
   * Checks whether two string arrays contain the exact same add-ons.
   */
  function haveSameAddons(listA, listB) {
    var a = Array.isArray(listA) ? listA.slice().sort() : [];
    var b = Array.isArray(listB) ? listB.slice().sort() : [];

    if (a.length !== b.length) {
      return false;
    }
    for (var i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Adds the selected dish configuration to localStorage key "cc_cart".
   * Merges quantity if a line with the same id, size, and addons already exists.
   */
  function addItemToCart(newItem) {
    var cart = readJsonArray(CART_KEY).filter(function (entry) {
      return entry && typeof entry === "object" && typeof entry.id === "string";
    });

    var matched = false;
    for (var i = 0; i < cart.length; i += 1) {
      var line = cart[i];
      var lineSize = line.size !== undefined ? line.size : null;
      if (
        line.id === newItem.id &&
        lineSize === newItem.size &&
        haveSameAddons(line.addons, newItem.addons)
      ) {
        var existingQty = Number(line.quantity !== undefined ? line.quantity : line.qty);
        line.quantity = (isNaN(existingQty) || existingQty < 1 ? 0 : existingQty) + newItem.quantity;
        line.unitPrice = newItem.unitPrice;
        matched = true;
        break;
      }
    }

    if (!matched) {
      cart.push(newItem);
    }

    writeJson(CART_KEY, cart);

    if (typeof window.ccUpdateCartBadge === "function") {
      window.ccUpdateCartBadge();
    }
  }

  /**
   * Renders the full dish detail view and attaches interactive listeners.
   */
  function renderDishDetails(dish) {
    document.title = dish.name + " | Crave Corner";
    errorContainer.innerHTML = "";
    detailSection.innerHTML = "";

    var isPizza = Boolean(dish.sizes);
    var selectedSize = isPizza ? "Medium" : null;
    var currentQty = 1;

    // Top "Back to Menu" link
    var backWrap = document.createElement("div");
    backWrap.className = "mb-4";

    var backLink = document.createElement("a");
    backLink.href = "menu.html";
    backLink.className = "btn btn-cc-secondary cc-back-link";
    backLink.textContent = "Back to Menu";
    backWrap.appendChild(backLink);
    detailSection.appendChild(backWrap);

    // Main card holding the 2-column layout
    var mainCard = document.createElement("article");
    mainCard.className = "cc-card p-4 p-md-5";

    var row = document.createElement("div");
    row.className = "row g-4 align-items-start";

    // Left column: Photo placeholder block
    var leftCol = document.createElement("div");
    leftCol.className = "col-12 col-lg-5";

    var photoBox = document.createElement("div");
    photoBox.className = "cc-photo-placeholder";
    photoBox.setAttribute("role", "img");
    photoBox.setAttribute("aria-label", dish.name + " (" + dish.category + ") photo placeholder");

    var photoCat = document.createElement("span");
    photoCat.className = "cc-photo-placeholder-category";
    photoCat.textContent = dish.category;

    var photoName = document.createElement("span");
    photoName.className = "cc-photo-placeholder-title";
    photoName.textContent = dish.name;

    var photoNote = document.createElement("span");
    photoNote.className = "cc-photo-placeholder-note";
    photoNote.textContent = "Dish photo coming soon";

    photoBox.appendChild(photoCat);
    photoBox.appendChild(photoName);
    photoBox.appendChild(photoNote);
    leftCol.appendChild(photoBox);

    // Right column: Dish info & customization options
    var rightCol = document.createElement("div");
    rightCol.className = "col-12 col-lg-7";

    var categoryP = document.createElement("p");
    categoryP.className = "mb-2";
    var categorySmall = document.createElement("small");
    categorySmall.className = "cc-detail-category";
    categorySmall.textContent = dish.category;
    categoryP.appendChild(categorySmall);

    var heading = document.createElement("h1");
    heading.className = "mb-2";
    heading.textContent = dish.name;

    var priceDisplay = document.createElement("p");
    priceDisplay.className = "cc-price cc-detail-base-price mb-4";

    rightCol.appendChild(categoryP);
    rightCol.appendChild(heading);
    rightCol.appendChild(priceDisplay);

    // Size options (Pizza only)
    var sizeRadios = [];
    if (isPizza) {
      var sizeGroup = document.createElement("fieldset");
      sizeGroup.className = "cc-option-group mb-4";

      var sizeLegend = document.createElement("legend");
      sizeLegend.className = "cc-option-heading";
      sizeLegend.textContent = "Choose Size";
      sizeGroup.appendChild(sizeLegend);

      var sizeList = document.createElement("div");
      sizeList.className = "d-flex flex-column gap-2";

      PIZZA_SIZES.forEach(function (sizeInfo) {
        var inputId = "size-" + sizeInfo.key;
        var itemWrap = document.createElement("div");
        itemWrap.className = "cc-option-item";

        var label = document.createElement("label");
        label.className = "cc-option-label";
        label.setAttribute("for", inputId);

        var radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "pizza-size";
        radio.id = inputId;
        radio.value = sizeInfo.name;
        radio.className = "cc-option-input";
        radio.setAttribute("data-price", String(dish.sizes[sizeInfo.key]));
        if (sizeInfo.name === "Medium") {
          radio.checked = true;
        }

        var textSpan = document.createElement("span");
        textSpan.textContent = sizeInfo.label;

        var priceSpan = document.createElement("span");
        priceSpan.className = "cc-price";
        priceSpan.textContent = formatPrice(dish.sizes[sizeInfo.key]);

        label.appendChild(radio);
        label.appendChild(textSpan);
        itemWrap.appendChild(label);
        itemWrap.appendChild(priceSpan);
        sizeList.appendChild(itemWrap);
        sizeRadios.push(radio);
      });

      sizeGroup.appendChild(sizeList);
      rightCol.appendChild(sizeGroup);
    }

    // Add-ons section (by category)
    var categoryAddons = ADDONS[dish.category] || [];
    var addonCheckboxes = [];

    var addonGroup = document.createElement("fieldset");
    addonGroup.className = "cc-option-group mb-4";

    var addonLegend = document.createElement("legend");
    addonLegend.className = "cc-option-heading";
    addonLegend.textContent = "Add-ons";
    addonGroup.appendChild(addonLegend);

    if (categoryAddons.length === 0) {
      var noAddonsText = document.createElement("p");
      noAddonsText.className = "mb-0";
      noAddonsText.textContent = "No add-ons for this item.";
      addonGroup.appendChild(noAddonsText);
    } else {
      var addonList = document.createElement("div");
      addonList.className = "d-flex flex-column gap-2";

      categoryAddons.forEach(function (addon, index) {
        var addonId = "addon-" + index;
        var itemWrap = document.createElement("div");
        itemWrap.className = "cc-option-item";

        var label = document.createElement("label");
        label.className = "cc-option-label";
        label.setAttribute("for", addonId);

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = addonId;
        checkbox.value = addon.name;
        checkbox.className = "cc-option-input";
        checkbox.setAttribute("data-price", String(addon.price));

        var nameSpan = document.createElement("span");
        nameSpan.textContent = addon.name;

        var priceSpan = document.createElement("span");
        priceSpan.className = "cc-price";
        priceSpan.textContent = "+" + formatPrice(addon.price);

        label.appendChild(checkbox);
        label.appendChild(nameSpan);
        itemWrap.appendChild(label);
        itemWrap.appendChild(priceSpan);
        addonList.appendChild(itemWrap);
        addonCheckboxes.push(checkbox);
      });

      addonGroup.appendChild(addonList);
    }
    rightCol.appendChild(addonGroup);

    // Quantity stepper (1 to 10)
    var qtyGroup = document.createElement("div");
    qtyGroup.className = "cc-option-group mb-4";

    var qtyLabel = document.createElement("label");
    qtyLabel.setAttribute("for", "dish-quantity");
    qtyLabel.className = "cc-option-heading d-block";
    qtyLabel.textContent = "Quantity";

    var stepper = document.createElement("div");
    stepper.className = "cc-qty-stepper";

    var minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "btn btn-cc-secondary cc-qty-btn";
    minusBtn.setAttribute("aria-label", "Decrease quantity");
    minusBtn.textContent = "-";

    var qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.id = "dish-quantity";
    qtyInput.className = "form-control cc-input cc-qty-input";
    qtyInput.min = String(MIN_QTY);
    qtyInput.max = String(MAX_QTY);
    qtyInput.step = "1";
    qtyInput.value = "1";

    var plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "btn btn-cc-secondary cc-qty-btn";
    plusBtn.setAttribute("aria-label", "Increase quantity");
    plusBtn.textContent = "+";

    var qtyError = document.createElement("p");
    qtyError.id = "qty-error-msg";
    qtyError.className = "cc-alert-error p-2 px-3 mt-2 mb-0 d-none";
    qtyError.setAttribute("aria-live", "polite");

    stepper.appendChild(minusBtn);
    stepper.appendChild(qtyInput);
    stepper.appendChild(plusBtn);
    qtyGroup.appendChild(qtyLabel);
    qtyGroup.appendChild(stepper);
    qtyGroup.appendChild(qtyError);
    rightCol.appendChild(qtyGroup);

    // Live total summary box
    var summaryBox = document.createElement("div");
    summaryBox.className = "cc-summary-box mb-4";
    summaryBox.setAttribute("aria-live", "polite");

    var unitRow = document.createElement("div");
    unitRow.className = "cc-summary-row mb-2";
    var unitLabel = document.createElement("span");
    unitLabel.textContent = "Unit price";
    var unitValue = document.createElement("span");
    unitValue.className = "cc-price";
    unitRow.appendChild(unitLabel);
    unitRow.appendChild(unitValue);

    var totalRow = document.createElement("div");
    totalRow.className = "cc-summary-row";
    var totalLabel = document.createElement("strong");
    totalLabel.textContent = "Total";
    var totalValue = document.createElement("span");
    totalValue.className = "cc-price cc-summary-total";
    totalRow.appendChild(totalLabel);
    totalRow.appendChild(totalValue);

    summaryBox.appendChild(unitRow);
    summaryBox.appendChild(totalRow);
    rightCol.appendChild(summaryBox);

    // Add to Cart button + status message
    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-cc-primary";
    addBtn.textContent = "Add to Cart";

    var cartFeedback = document.createElement("p");
    cartFeedback.className = "cc-alert-success p-2 px-3 mt-3 mb-0 d-none";
    cartFeedback.setAttribute("role", "status");
    cartFeedback.setAttribute("aria-live", "polite");

    rightCol.appendChild(addBtn);
    rightCol.appendChild(cartFeedback);

    row.appendChild(leftCol);
    row.appendChild(rightCol);
    mainCard.appendChild(row);
    detailSection.appendChild(mainCard);

    /**
     * Computes selected base price, add-on names, and unit price.
     */
    function getCurrentPricing() {
      var basePrice = 0;

      if (isPizza) {
        selectedSize = "Medium";
        sizeRadios.forEach(function (radio) {
          if (radio.checked) {
            selectedSize = radio.value;
            basePrice = Number(radio.getAttribute("data-price"));
          }
        });
      } else {
        basePrice = Number(dish.price);
      }

      var selectedAddons = [];
      var addonsTotal = 0;
      addonCheckboxes.forEach(function (checkbox) {
        if (checkbox.checked) {
          selectedAddons.push(checkbox.value);
          addonsTotal += Number(checkbox.getAttribute("data-price"));
        }
      });

      return {
        basePrice: basePrice,
        addons: selectedAddons,
        unitPrice: basePrice + addonsTotal
      };
    }

    /**
     * Refreshes the displayed base price, unit price, and total.
     */
    function updateTotals() {
      var pricing = getCurrentPricing();
      priceDisplay.textContent = formatPrice(pricing.basePrice);
      unitValue.textContent = formatPrice(pricing.unitPrice);
      totalValue.textContent = formatPrice(pricing.unitPrice * currentQty);
    }

    function showQtyError(msg) {
      qtyError.textContent = msg;
      qtyError.classList.remove("d-none");
    }

    function clearQtyError() {
      qtyError.textContent = "";
      qtyError.classList.add("d-none");
    }

    /**
     * Validates and clamps the quantity input to 1..10.
     * When allowEmptyDuringTyping is true, lets the user clear the field briefly
     * while typing, but clamps any out-of-range or non-numeric entry immediately.
     */
    function validateQuantity(allowEmptyDuringTyping) {
      var raw = qtyInput.value.trim();

      if (raw === "") {
        currentQty = MIN_QTY;
        showQtyError("Quantity must be between 1 and 10.");
        if (!allowEmptyDuringTyping) {
          qtyInput.value = String(MIN_QTY);
        }
        updateTotals();
        return;
      }

      var parsed = Number(raw);
      if (isNaN(parsed) || !isFinite(parsed)) {
        currentQty = MIN_QTY;
        qtyInput.value = String(MIN_QTY);
        showQtyError("Please enter a valid number between 1 and 10.");
        updateTotals();
        return;
      }

      var rounded = Math.round(parsed);
      if (rounded < MIN_QTY) {
        currentQty = MIN_QTY;
        qtyInput.value = String(MIN_QTY);
        showQtyError("Minimum quantity is 1.");
        updateTotals();
        return;
      }

      if (rounded > MAX_QTY) {
        currentQty = MAX_QTY;
        qtyInput.value = String(MAX_QTY);
        showQtyError("Maximum quantity is 10.");
        updateTotals();
        return;
      }

      currentQty = rounded;
      if (String(rounded) !== raw) {
        qtyInput.value = String(rounded);
        showQtyError("Quantity must be a whole number between 1 and 10.");
      } else {
        clearQtyError();
      }
      updateTotals();
    }

    // Option change listeners
    sizeRadios.forEach(function (radio) {
      radio.addEventListener("change", updateTotals);
    });

    addonCheckboxes.forEach(function (checkbox) {
      checkbox.addEventListener("change", updateTotals);
    });

    // Stepper buttons
    minusBtn.addEventListener("click", function () {
      clearQtyError();
      if (currentQty > MIN_QTY) {
        currentQty -= 1;
      }
      qtyInput.value = String(currentQty);
      updateTotals();
    });

    plusBtn.addEventListener("click", function () {
      clearQtyError();
      if (currentQty < MAX_QTY) {
        currentQty += 1;
      }
      qtyInput.value = String(currentQty);
      updateTotals();
    });

    qtyInput.addEventListener("input", function () {
      validateQuantity(true);
    });

    qtyInput.addEventListener("change", function () {
      validateQuantity(false);
    });

    qtyInput.addEventListener("blur", function () {
      validateQuantity(false);
    });

    // Add to Cart click
    addBtn.addEventListener("click", function () {
      validateQuantity(false);
      var pricing = getCurrentPricing();

      addItemToCart({
        id: dish.id,
        name: dish.name,
        size: isPizza ? selectedSize : null,
        addons: pricing.addons,
        quantity: currentQty,
        unitPrice: pricing.unitPrice
      });

      cartFeedback.textContent = "Added " + currentQty + " x " + dish.name + " to your cart.";
      cartFeedback.classList.remove("d-none");
    });

    updateTotals();
  }

  // Initialize page
  var dishId = getRequestedDishId();
  var dish = findDishById(dishId);

  if (!dish) {
    renderNotFoundState();
    return;
  }

  var recentIds = recordRecentlyViewed(dish.id);
  renderDishDetails(dish);
  renderRecentlyViewed(recentIds, dish.id);
  renderRelatedDishes(dish);
})();
