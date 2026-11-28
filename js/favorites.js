/* ==========================================================================
   Author: M. Rehan Sadiq
   Roll Number: 26i-3122
   Section: Section C
   Crave Corner - Favourites Page Script (js/favorites.js)
   Reads cc_favorites, renders cards from MENU_ITEMS, handles Add to Cart
   (same merge rule as js/dish-details.js) and Remove, and shows aria-live
   status messages without alert(). Works for logged-in and logged-out users.
   ========================================================================== */

(function () {
  "use strict";

  /* Storage key constants — must match the existing keys exactly */
  var FAVORITES_KEY = "cc_favorites"; // list of dish ID strings (same as menu.js)
  var CART_KEY      = "cc_cart";      // array of cart item objects (same as dish-details.js)

  /* Pizza size definitions — same labels and order as js/dish-details.js */
  var PIZZA_SIZES = [
    { key: "small",  label: "Small (7 inch)",   name: "Small"  },
    { key: "medium", label: "Medium (10 inch)", name: "Medium" },
    { key: "large",  label: "Large (13 inch)",  name: "Large"  }
  ];

  /* Duration (ms) the status message remains visible before being hidden */
  var STATUS_HIDE_DELAY = 3000;

  /* -------------------------------------------------------------------------
     1. Storage helpers (mirror the safe pattern used by menu.js)
     ------------------------------------------------------------------------- */

  /**
   * Reads and parses a JSON array from localStorage.
   * Returns [] when the key is absent, empty, or the data is corrupted.
   */
  function readJsonArray(key) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) { return []; }
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Writes a value to localStorage as JSON, silently ignoring quota errors.
   */
  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      // Ignore storage failures
    }
  }

  /**
   * Returns a deduplicated array of valid dish ID strings.
   * Replicates cleanFavoriteIds from js/menu.js exactly.
   */
  function cleanFavoriteIds(list) {
    if (!Array.isArray(list)) { return []; }
    var unique = [];
    list.forEach(function (entry) {
      if (typeof entry === "string" && entry.trim() !== "" && unique.indexOf(entry) === -1) {
        unique.push(entry);
      }
    });
    return unique;
  }

  /**
   * Loads saved favourite IDs from localStorage key "cc_favorites".
   */
  function loadFavoriteIds() {
    return cleanFavoriteIds(readJsonArray(FAVORITES_KEY));
  }

  /**
   * Saves the favourite ID array back to localStorage key "cc_favorites".
   */
  function saveFavoriteIds(ids) {
    writeJson(FAVORITES_KEY, cleanFavoriteIds(ids));
  }

  /**
   * Removes a dish ID from the saved favourites and persists the change.
   */
  function removeFavoriteId(dishId) {
    var current = loadFavoriteIds();
    var updated = current.filter(function (id) { return id !== dishId; });
    saveFavoriteIds(updated);
  }

  /* -------------------------------------------------------------------------
     2. Cart helper — mirrors addItemToCart from js/dish-details.js exactly
     ------------------------------------------------------------------------- */

  /**
   * Checks whether two add-on arrays are identical (sorted string comparison).
   * Copied from js/dish-details.js to stay in sync with its merge rule.
   */
  function haveSameAddons(listA, listB) {
    var a = Array.isArray(listA) ? listA.slice().sort() : [];
    var b = Array.isArray(listB) ? listB.slice().sort() : [];
    if (a.length !== b.length) { return false; }
    for (var i = 0; i < a.length; i += 1) {
      if (a[i] !== b[i]) { return false; }
    }
    return true;
  }

  /**
   * Adds an item to cc_cart using the EXACT same field names and merge rule
   * as addItemToCart in js/dish-details.js:
   *   { id, name, size, addons, quantity, unitPrice }
   * If the same id + size + addons already exist, increment quantity.
   * Then refreshes the header cart counter badge.
   */
  function addItemToCart(newItem) {
    /* Load existing cart, skip any malformed entries */
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
        /* Same line — increase quantity */
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

    /* Update the header cart badge (layout.js exposes ccUpdateCartBadge) */
    if (typeof window.ccUpdateCartBadge === "function") {
      window.ccUpdateCartBadge();
    }
  }

  /* -------------------------------------------------------------------------
     3. Formatting helper
     ------------------------------------------------------------------------- */

  /**
   * Formats a PKR amount as "Rs. 1,099".
   */
  function formatPrice(amount) {
    return "Rs. " + Number(amount).toLocaleString("en-US");
  }

  /* -------------------------------------------------------------------------
     4. Status message helper
     ------------------------------------------------------------------------- */

  var statusTimer = null; // holds the timeout for hiding the status strip

  /**
   * Shows a short text in the aria-live region for STATUS_HIDE_DELAY ms,
   * then hides it again so it doesn't clutter the page.
   */
  function showStatus(message) {
    var el = document.getElementById("fav-status-msg");
    if (!el) { return; }

    el.textContent = message;
    el.classList.remove("visually-hidden");

    /* Clear any pending hide timer and restart it */
    if (statusTimer) { clearTimeout(statusTimer); }
    statusTimer = setTimeout(function () {
      el.classList.add("visually-hidden");
      el.textContent = "";
    }, STATUS_HIDE_DELAY);
  }

  /* -------------------------------------------------------------------------
     5. Card factory — builds one favourite dish card DOM element
     ------------------------------------------------------------------------- */

  /**
   * Builds and returns the full card element for a single favourite dish.
   * @param {object} dish  - Entry from MENU_ITEMS
   */
  function buildFavCard(dish) {
    var isPizza = Boolean(dish.sizes);

    /* Outer column wrapper (Bootstrap grid: 4 per row on lg, 2 on sm, 1 on xs) */
    var col = document.createElement("div");
    col.className = "col-12 col-sm-6 col-lg-4";
    col.setAttribute("data-dish-id", dish.id);

    /* Card container */
    var card = document.createElement("article");
    card.className = "cc-fav-card";
    card.setAttribute("aria-label", dish.name);

    /* -- Image placeholder -- */
    var imgArea = document.createElement("div");
    imgArea.className = "cc-fav-img-placeholder";
    imgArea.setAttribute("role", "img");
    imgArea.setAttribute("aria-label", dish.name + " image placeholder");
    /* Inline SVG food icon (fork & knife) */
    imgArea.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="52" height="52" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>' +
        '<path d="M7 2v20"></path>' +
        '<path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"></path>' +
      '</svg>';

    /* -- Card body -- */
    var body = document.createElement("div");
    body.className = "cc-fav-card-body";

    /* Dish name */
    var nameEl = document.createElement("h2");
    nameEl.className = "cc-fav-dish-name";
    nameEl.textContent = dish.name;

    /* Price display (updated by size selector for pizzas) */
    var priceEl = document.createElement("p");
    priceEl.className = "cc-fav-price";

    /* Saved heart indicator */
    var savedRow = document.createElement("div");
    savedRow.className = "cc-fav-saved-row";
    savedRow.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" ' +
        'fill="currentColor" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' +
      '</svg>' +
      '<span>Saved</span>';

    /* -- Pizza size selector (only for Pizza category) -- */
    var currentSize = null;    // "Small" | "Medium" | "Large" (or null for non-pizza)
    var currentUnitPrice = 0;

    if (isPizza) {
      var sizeWrap = document.createElement("div");
      sizeWrap.className = "cc-fav-size-wrap";

      var sizeLabel = document.createElement("label");
      sizeLabel.className = "cc-fav-size-label";
      /* unique id so the label is associated correctly */
      var selectId = "size-select-" + dish.id;
      sizeLabel.setAttribute("for", selectId);
      sizeLabel.textContent = "Size:";

      var sizeSelect = document.createElement("select");
      sizeSelect.id = selectId;
      sizeSelect.className = "cc-fav-size-select";

      PIZZA_SIZES.forEach(function (s) {
        var opt = document.createElement("option");
        opt.value = s.name;
        opt.textContent = s.label;
        opt.setAttribute("data-price", String(dish.sizes[s.key]));
        if (s.name === "Medium") {
          opt.selected = true;
        }
        sizeSelect.appendChild(opt);
      });

      /* Set initial size/price from the preselected Medium option */
      currentSize = "Medium";
      currentUnitPrice = dish.sizes.medium;
      priceEl.textContent = formatPrice(currentUnitPrice);

      /* Update price display whenever the user changes the size */
      sizeSelect.addEventListener("change", function () {
        var selectedOpt = sizeSelect.options[sizeSelect.selectedIndex];
        currentSize = sizeSelect.value;
        currentUnitPrice = Number(selectedOpt.getAttribute("data-price"));
        priceEl.textContent = formatPrice(currentUnitPrice);
      });

      sizeWrap.appendChild(sizeLabel);
      sizeWrap.appendChild(sizeSelect);
      body.appendChild(nameEl);
      body.appendChild(sizeWrap);
      body.appendChild(priceEl);
    } else {
      currentUnitPrice = dish.price;
      priceEl.textContent = formatPrice(currentUnitPrice);
      body.appendChild(nameEl);
      body.appendChild(priceEl);
    }

    body.appendChild(savedRow);

    /* -- Button row -- */
    var btnRow = document.createElement("div");
    btnRow.className = "cc-fav-btn-row";

    /* Add to Cart button */
    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "btn btn-cc-primary cc-fav-add-btn";
    addBtn.setAttribute("aria-label", "Add " + dish.name + " to cart");
    addBtn.textContent = "Add to Cart";

    addBtn.addEventListener("click", function () {
      /* Build the cart item in exactly the same shape as js/dish-details.js */
      var cartItem = {
        id:        dish.id,
        name:      dish.name,
        size:      currentSize,   // null for non-pizza, "Small"/"Medium"/"Large" for pizza
        addons:    [],            // no add-ons from the favourites page
        quantity:  1,
        unitPrice: currentUnitPrice
      };
      addItemToCart(cartItem);
      showStatus("Added \"" + dish.name + "\" to cart.");
    });

    /* Remove button — same size/font/padding as Add to Cart, error-colour outline */
    var removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "cc-fav-remove-btn";
    removeBtn.setAttribute("aria-label", "Remove " + dish.name + " from favourites");
    removeBtn.textContent = "Remove";

    removeBtn.addEventListener("click", function () {
      /* Remove from storage */
      removeFavoriteId(dish.id);

      /* Remove the card column from the grid */
      var colEl = document.querySelector('[data-dish-id="' + dish.id + '"]');
      if (colEl) {
        colEl.parentNode.removeChild(colEl);
      }

      showStatus("\"" + dish.name + "\" removed from favourites.");

      /* If no cards remain, show the empty state */
      var grid = document.getElementById("fav-grid");
      if (grid && grid.children.length === 0) {
        showEmptyState();
      }
    });

    btnRow.appendChild(addBtn);
    btnRow.appendChild(removeBtn);
    body.appendChild(btnRow);

    card.appendChild(imgArea);
    card.appendChild(body);
    col.appendChild(card);
    return col;
  }

  /* -------------------------------------------------------------------------
     6. Render helpers
     ------------------------------------------------------------------------- */

  /**
   * Hides the grid and shows the friendly empty-state panel.
   */
  function showEmptyState() {
    var grid  = document.getElementById("fav-grid");
    var empty = document.getElementById("fav-empty-state");
    if (grid)  { grid.classList.add("d-none"); }
    if (empty) { empty.classList.remove("d-none"); }
  }

  /**
   * Looks up a dish in MENU_ITEMS by its id string.
   * Returns null if not found, so stale ids are safely skipped.
   */
  function findDishById(dishId) {
    if (typeof MENU_ITEMS === "undefined") { return null; }
    for (var i = 0; i < MENU_ITEMS.length; i += 1) {
      if (MENU_ITEMS[i].id === dishId) { return MENU_ITEMS[i]; }
    }
    return null;
  }

  /**
   * Reads cc_favorites, resolves each id against MENU_ITEMS, and renders cards.
   * Skips ids that are not in MENU_ITEMS (stale / from a future dataset).
   */
  function renderFavorites() {
    var grid  = document.getElementById("fav-grid");
    var empty = document.getElementById("fav-empty-state");
    if (!grid) { return; }

    grid.innerHTML = "";

    /* Guard: if MENU_ITEMS is not loaded, treat as empty */
    if (typeof MENU_ITEMS === "undefined") {
      showEmptyState();
      return;
    }

    var ids = loadFavoriteIds();

    /* Resolve ids to dish objects, skipping any that no longer exist */
    var dishes = [];
    ids.forEach(function (id) {
      var dish = findDishById(id);
      if (dish) { dishes.push(dish); }
    });

    if (dishes.length === 0) {
      showEmptyState();
      return;
    }

    empty.classList.add("d-none");
    grid.classList.remove("d-none");

    dishes.forEach(function (dish) {
      grid.appendChild(buildFavCard(dish));
    });
  }

  /* -------------------------------------------------------------------------
     7. Initialisation
     ------------------------------------------------------------------------- */

  /**
   * Entry point: runs once the DOM is fully loaded.
   */
  function init() {
    renderFavorites();

    /* Re-render if another tab changes cc_favorites */
    window.addEventListener("storage", function (event) {
      if (event.key === FAVORITES_KEY) {
        renderFavorites();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", init);

})();
