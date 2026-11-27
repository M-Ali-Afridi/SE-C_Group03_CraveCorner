/* ==========================================================================
   Crave Corner - Menu Page Script (js/menu.js)
   Renders menu cards from MENU_ITEMS and handles live search & category filter.
   ========================================================================== */

(function () {
  "use strict";

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

    var categoryTag = document.createElement("small");
    categoryTag.className = "cc-menu-category";
    categoryTag.textContent = item.category;

    var title = document.createElement("h2");
    title.className = "cc-menu-title";
    title.textContent = item.name;

    headerBlock.appendChild(categoryTag);
    headerBlock.appendChild(title);

    card.appendChild(headerBlock);
    card.appendChild(createPriceElement(item));
    col.appendChild(card);

    return col;
  }

  /**
   * Renders matching menu items or the friendly empty state into #menu-results.
   */
  function renderMenu() {
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
