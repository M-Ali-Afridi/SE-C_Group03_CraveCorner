/* ==========================================================================
   Crave Corner - Menu Page Script (js/menu.js)
   Renders menu cards from MENU_ITEMS and handles live search, category filter,
   favourite toggling (saved in localStorage key "cc_favorites"), and details links.
   ========================================================================== */

(function () {
  "use strict";

  var FAVORITES_KEY = "cc_favorites";

  var PIZZA_SIZES = [
    { key: "small", label: "Small (7 inch)" },
    { key: "medium", label: "Medium (10 inch)" },
    { key: "large", label: "Large (13 inch)" }
  ];

  var EMPTY_MESSAGE = "No dishes found. Try another word or choose All.";

  var activeCategory = "All";
  var searchQuery = "";

  var searchForm = document.getElementById("menu-search-form");
  var searchInput = document.getElementById("menu-search");
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".cc-filter-btn"));
  var resultsContainer = document.getElementById("menu-results");

  if (!resultsContainer || typeof MENU_ITEMS === "undefined") {
    return;
  }

  /**
   * Returns a deduplicated array of valid dish ID strings.
   */
  function cleanFavoriteIds(list) {
    if (!Array.isArray(list)) {
      return [];
    }

    var uniqueIds = [];
    list.forEach(function (entry) {
      if (typeof entry === "string" && entry.trim() !== "" && uniqueIds.indexOf(entry) === -1) {
        uniqueIds.push(entry);
      }
    });
    return uniqueIds;
  }

  /**
   * Safely loads favourite dish IDs from localStorage key "cc_favorites".
   * Falls back to [] if missing, empty, or corrupted, or keeps the in-memory
   * fallback list if localStorage itself is unavailable.
   */
  function loadFavorites(fallback) {
    try {
      var raw = localStorage.getItem(FAVORITES_KEY);
      if (!raw) {
        return [];
      }
      var parsed = JSON.parse(raw);
      return cleanFavoriteIds(parsed);
    } catch (error) {
      return Array.isArray(fallback) ? fallback.slice() : [];
    }
  }

  /**
   * Safely saves the deduplicated favourite dish IDs back to localStorage.
   * Silently continues if storage is unavailable.
   */
  function saveFavorites(ids) {
    var cleanIds = cleanFavoriteIds(ids);
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(cleanIds));
    } catch (error) {
      // Storage may be disabled or full; keep working in memory without errors
    }
    return cleanIds;
  }

  // Keep an in-memory copy synced with localStorage so UI works even if storage fails
  var favoriteIds = loadFavorites();

  /**
   * Normalizes text for case-insensitive, whitespace-tolerant matching.
   */
  function normalizeText(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  /**
   * Formats a numeric PKR amount as "Rs. 1,099".
   */
  function formatPrice(amount) {
    return "Rs. " + Number(amount).toLocaleString("en-US");
  }

  /**
   * Checks whether an item matches both the active category and search query.
   */
  function matchesFilters(item) {
    var categoryMatches = activeCategory === "All" || item.category === activeCategory;
    if (!categoryMatches) {
      return false;
    }

    if (!searchQuery) {
      return true;
    }

    var nameText = normalizeText(item.name);
    var categoryText = normalizeText(item.category);
    return nameText.indexOf(searchQuery) !== -1 || categoryText.indexOf(searchQuery) !== -1;
  }

  /**
   * Updates one heart button's visual class, aria-pressed, aria-label, and title.
   */
  function updateFavoriteButton(button, dishName, isFavorited) {
    var actionLabel = (isFavorited ? "Remove " : "Add ") + dishName + (isFavorited ? " from favourites" : " to favourites");
    button.classList.toggle("is-favorited", isFavorited);
    button.setAttribute("aria-pressed", isFavorited ? "true" : "false");
    button.setAttribute("aria-label", actionLabel);
    button.setAttribute("title", actionLabel);
  }

  /**
   * Builds the top-right heart toggle button with an inline SVG heart.
   */
  function createFavoriteButton(item) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "cc-fav-btn";
    button.setAttribute("data-dish-id", item.id);
    button.setAttribute("data-dish-name", item.name);

    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "20");
    svg.setAttribute("height", "20");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "2");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");

    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute(
      "d",
      "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
    );

    svg.appendChild(path);
    button.appendChild(svg);

    var isFavorited = favoriteIds.indexOf(item.id) !== -1;
    updateFavoriteButton(button, item.name, isFavorited);
    return button;
  }

  /**
   * Builds the price display element for either a pizza item or a standard item.
   */
  function createPriceElement(item) {
    if (item.sizes) {
      var list = document.createElement("ul");
      list.className = "cc-pizza-sizes";

      PIZZA_SIZES.forEach(function (sizeInfo) {
        var row = document.createElement("li");
        row.className = "cc-pizza-size-row";

        var labelSpan = document.createElement("span");
        labelSpan.className = "cc-pizza-size-label";
        labelSpan.textContent = sizeInfo.label;

        var priceSpan = document.createElement("span");
        priceSpan.className = "cc-price";
        priceSpan.textContent = formatPrice(item.sizes[sizeInfo.key]);

        row.appendChild(labelSpan);
        row.appendChild(priceSpan);
        list.appendChild(row);
      });

      return list;
    }

    var singlePrice = document.createElement("p");
    singlePrice.className = "cc-price cc-menu-single-price mb-0";
    singlePrice.textContent = formatPrice(item.price);
    return singlePrice;
  }

  /**
   * Builds one Bootstrap grid column containing an <article class="cc-card"> dish card.
   */
  function createDishCard(item) {
    var col = document.createElement("div");
    col.className = "col-12 col-md-6 col-lg-4";

    var card = document.createElement("article");
    card.className = "cc-card cc-menu-card h-100";

    var headerBlock = document.createElement("div");
    headerBlock.className = "cc-menu-card-header";

    var categoryTag = document.createElement("small");
    categoryTag.className = "cc-menu-category";
    categoryTag.textContent = item.category;

    var title = document.createElement("h2");
    title.className = "cc-menu-title";
    title.textContent = item.name;

    headerBlock.appendChild(categoryTag);
    headerBlock.appendChild(title);

    var footerBlock = document.createElement("div");
    footerBlock.className = "cc-menu-card-footer";

    var detailsLink = document.createElement("a");
    detailsLink.className = "btn btn-cc-secondary cc-view-details-btn";
    detailsLink.href = "dish-details.html?id=" + encodeURIComponent(item.id);
    detailsLink.textContent = "View Details";

    footerBlock.appendChild(createPriceElement(item));
    footerBlock.appendChild(detailsLink);

    card.appendChild(createFavoriteButton(item));
    card.appendChild(headerBlock);
    card.appendChild(footerBlock);
    col.appendChild(card);

    return col;
  }

  /**
   * Renders matching menu items or the friendly empty state into #menu-results.
   */
  function renderMenu() {
    // Re-read saved favourites so every re-render reflects the latest state
    favoriteIds = loadFavorites(favoriteIds);
    var filteredItems = MENU_ITEMS.filter(matchesFilters);
    resultsContainer.innerHTML = "";

    if (filteredItems.length === 0) {
      var emptyCol = document.createElement("div");
      emptyCol.className = "col-12";

      var emptyBox = document.createElement("p");
      emptyBox.className = "cc-menu-empty mb-0";
      emptyBox.textContent = EMPTY_MESSAGE;

      emptyCol.appendChild(emptyBox);
      resultsContainer.appendChild(emptyCol);
      return;
    }

    var fragment = document.createDocumentFragment();
    filteredItems.forEach(function (item) {
      fragment.appendChild(createDishCard(item));
    });
    resultsContainer.appendChild(fragment);
  }

  /**
   * Toggles a single dish in favourites without re-rendering the entire grid.
   */
  function handleFavoriteToggle(button) {
    var dishId = button.getAttribute("data-dish-id");
    var dishName = button.getAttribute("data-dish-name") || "dish";
    if (!dishId) {
      return;
    }

    favoriteIds = loadFavorites(favoriteIds);
    var existingIndex = favoriteIds.indexOf(dishId);
    var isNowFavorited;

    if (existingIndex === -1) {
      favoriteIds.push(dishId);
      isNowFavorited = true;
    } else {
      favoriteIds.splice(existingIndex, 1);
      isNowFavorited = false;
    }

    favoriteIds = saveFavorites(favoriteIds);
    updateFavoriteButton(button, dishName, isNowFavorited);
  }

  /**
   * Updates filter button visual classes and aria-pressed attributes.
   */
  function updateFilterButtons() {
    filterButtons.forEach(function (btn) {
      var isActive = btn.getAttribute("data-category") === activeCategory;
      btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      btn.classList.toggle("btn-cc-primary", isActive);
      btn.classList.toggle("btn-cc-secondary", !isActive);
    });
  }

  // Event delegation on #menu-results for favourite heart buttons
  resultsContainer.addEventListener("click", function (event) {
    var favButton = event.target.closest(".cc-fav-btn");
    if (!favButton || !resultsContainer.contains(favButton)) {
      return;
    }
    handleFavoriteToggle(favButton);
  });

  if (searchForm) {
    searchForm.addEventListener("submit", function (event) {
      event.preventDefault();
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchQuery = normalizeText(searchInput.value);
      renderMenu();
    });
  }

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      var selected = button.getAttribute("data-category") || "All";
      if (selected === activeCategory) {
        return;
      }
      activeCategory = selected;
      updateFilterButtons();
      renderMenu();
    });
  });

  updateFilterButtons();
  renderMenu();
})();
