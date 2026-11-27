/* ==========================================================================
   Crave Corner - Shared Layout Script (js/layout.js)
   Builds the shared header and footer as HTML strings and inserts them into
   #site-header and #site-footer on every page (no fetch() required).
   ========================================================================== */

(function () {
  "use strict";

  /**
   * Detects whether the current page lives inside the "pages/" folder.
   * Returns relative prefixes so navigation links work from both root and pages/.
   */
  function getPathInfo() {
    var normalizedPath = window.location.pathname.replace(/\\/g, "/");
    var inPagesFolder = normalizedPath.indexOf("/pages/") !== -1;
    var currentFile = normalizedPath.split("/").pop() || "index.html";

    return {
      toRoot: inPagesFolder ? "../" : "",
      toPages: inPagesFolder ? "" : "pages/",
      currentFile: currentFile.toLowerCase()
    };
  }

  /**
   * Checks if a link's target filename matches the page currently open.
   */
  function isCurrentPage(targetFile, currentFile) {
    return targetFile.toLowerCase() === currentFile;
  }

  /**
   * Reads the cart item count from localStorage key "cc_cart".
   */
  function getCartCount() {
    try {
      var rawCart = localStorage.getItem("cc_cart");
      if (!rawCart) {
        return 0;
      }

      var parsedCart = JSON.parse(rawCart);
      if (Array.isArray(parsedCart)) {
        return parsedCart.reduce(function (total, item) {
          if (item && typeof item === "object") {
            var rawQty = item.qty !== undefined ? item.qty : item.quantity;
            var itemQty = rawQty !== undefined ? Number(rawQty) : 1;
            return total + (isNaN(itemQty) ? 1 : Math.max(0, itemQty));
          }
          return total + 1;
        }, 0);
      }

      if (typeof parsedCart === "number" && !isNaN(parsedCart)) {
        return Math.max(0, parsedCart);
      }
    } catch (error) {
      return 0;
    }

    return 0;
  }

  /**
   * Builds the Account icon Bootstrap dropdown with exactly two options:
   * "Login / Sign Up" and "My Account & Order History".
   */
  function buildAccountDropdownHtml(paths) {
    var accountSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
        '<circle cx="12" cy="7" r="4"></circle>' +
      "</svg>";

    var loginActive = isCurrentPage("login.html", paths.currentFile);
    var accountActive = isCurrentPage("account.html", paths.currentFile);
    var isAccountSection = loginActive || accountActive;

    return (
      '<div class="dropdown">' +
        '<button class="cc-icon-btn' + (isAccountSection ? " active" : "") + '" type="button" id="ccAccountDropdown" ' +
          'data-bs-toggle="dropdown" aria-expanded="false" aria-label="Account" title="Account">' +
          accountSvg +
        "</button>" +
        '<ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="ccAccountDropdown">' +
          '<li>' +
            '<a class="dropdown-item' + (loginActive ? " active" : "") + '" href="' + paths.toPages + 'login.html"' +
              (loginActive ? ' aria-current="page"' : "") + ">" +
              "Login / Sign Up" +
            "</a>" +
          "</li>" +
          '<li>' +
            '<a class="dropdown-item' + (accountActive ? " active" : "") + '" href="' + paths.toPages + 'account.html"' +
              (accountActive ? ' aria-current="page"' : "") + ">" +
              "My Account &amp; Order History" +
            "</a>" +
          "</li>" +
        "</ul>" +
      "</div>"
    );
  }

  /**
   * Builds the complete shared navigation bar HTML string.
   * Logo on top-left; Home, Menu, Deals, Reserve, Catering in nav;
   * Heart, Account dropdown, and Cart icons stay visible on the right.
   */
  function buildHeaderHtml(paths) {
    var navItems = [
      { label: "Home", file: "index.html", href: paths.toRoot + "index.html" },
      { label: "Menu", file: "menu.html", href: paths.toPages + "menu.html" },
      { label: "Deals", file: "deals.html", href: paths.toPages + "deals.html" },
      { label: "Reserve", file: "reservation.html", href: paths.toPages + "reservation.html" },
      { label: "Catering", file: "catering.html", href: paths.toPages + "catering.html" }
    ];

    var navLinksHtml = navItems
      .map(function (item) {
        var active = isCurrentPage(item.file, paths.currentFile);
        var activeClass = active ? " active" : "";
        var ariaCurrent = active ? ' aria-current="page"' : "";

        return (
          '<li class="nav-item">' +
            '<a class="nav-link' + activeClass + '" href="' + item.href + '"' + ariaCurrent + ">" +
              item.label +
            "</a>" +
          "</li>"
        );
      })
      .join("");

    var favActive = isCurrentPage("favorites.html", paths.currentFile);
    var cartActive = isCurrentPage("cart.html", paths.currentFile);
    var cartCount = getCartCount();

    var heartSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' +
      "</svg>";

    var cartSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<circle cx="9" cy="21" r="1"></circle>' +
        '<circle cx="20" cy="21" r="1"></circle>' +
        '<path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>' +
      "</svg>";

    return (
      '<nav class="navbar navbar-expand-lg cc-navbar py-2" aria-label="Main navigation">' +
        '<div class="container">' +
          '<a class="navbar-brand cc-brand" href="' + paths.toRoot + 'index.html">Crave Corner</a>' +
          '<div class="d-flex align-items-center gap-1 order-lg-3">' +
            '<a class="cc-icon-btn cc-heart-btn' + (favActive ? " active" : "") + '" ' +
              'href="' + paths.toPages + 'favorites.html" aria-label="Favourites" title="Favourites"' +
              (favActive ? ' aria-current="page"' : "") + ">" +
              heartSvg +
            "</a>" +
            buildAccountDropdownHtml(paths) +
            '<a class="cc-icon-btn' + (cartActive ? " active" : "") + '" ' +
              'href="' + paths.toPages + 'cart.html" aria-label="Cart" title="Cart"' +
              (cartActive ? ' aria-current="page"' : "") + ">" +
              cartSvg +
              '<span class="cc-cart-badge" id="cc-cart-count">' + cartCount + "</span>" +
            "</a>" +
            '<button class="navbar-toggler ms-1" type="button" data-bs-toggle="collapse" data-bs-target="#ccMainNavbar" ' +
              'aria-controls="ccMainNavbar" aria-expanded="false" aria-label="Toggle navigation">' +
              '<span class="navbar-toggler-icon"></span>' +
            "</button>" +
          "</div>" +
          '<div class="collapse navbar-collapse order-lg-2" id="ccMainNavbar">' +
            '<ul class="navbar-nav mx-auto mt-3 mt-lg-0 gap-lg-1 text-center">' +
              navLinksHtml +
            "</ul>" +
          "</div>" +
        "</div>" +
      "</nav>"
    );
  }

  /**
   * Builds the shared 3-column footer HTML string.
   */
  function buildFooterHtml(paths) {
    var quickLinks = [
      { label: "About Us &amp; Gallery", file: "about.html", href: paths.toPages + "about.html" },
      { label: "Contact &amp; Location", file: "contact.html", href: paths.toPages + "contact.html" },
      { label: "Reviews &amp; FAQ", file: "reviews.html", href: paths.toPages + "reviews.html" }
    ];

    var quickLinksHtml = quickLinks
      .map(function (item) {
        var active = isCurrentPage(item.file, paths.currentFile);
        var activeClass = active ? " active" : "";
        var ariaCurrent = active ? ' aria-current="page"' : "";

        return (
          '<li class="mb-2">' +
            '<a class="cc-footer-link' + activeClass + '" href="' + item.href + '"' + ariaCurrent + ">" +
              item.label +
            "</a>" +
          "</li>"
        );
      })
      .join("");

    return (
      '<div class="container py-5">' +
        '<div class="row gy-4 text-center text-md-start">' +
          '<div class="col-12 col-md-4">' +
            '<h5 class="cc-footer-brand mb-2">Crave Corner</h5>' +
            '<p class="cc-footer-text mb-0">Fresh food, fast</p>' +
          "</div>" +
          '<div class="col-12 col-md-4">' +
            '<h6 class="cc-footer-heading mb-3">Quick links</h6>' +
            '<ul class="list-unstyled mb-0">' +
              quickLinksHtml +
            "</ul>" +
          "</div>" +
          '<div class="col-12 col-md-4">' +
            '<h6 class="cc-footer-heading mb-3">Visit us</h6>' +
            '<ul class="list-unstyled mb-0 cc-footer-text">' +
              '<li class="mb-1">Islamabad, Pakistan</li>' +
              '<li class="mb-1">Open daily 11 am - 12 am</li>' +
              "<li>+92 300 1234567</li>" +
            "</ul>" +
          "</div>" +
        "</div>" +
        '<hr class="cc-footer-divider my-4">' +
        '<p class="text-center cc-footer-copy mb-0">&copy; 2026 Crave Corner</p>' +
      "</div>"
    );
  }

  /**
   * Renders the shared header into #site-header.
   */
  function renderHeader() {
    var headerEl = document.getElementById("site-header");
    if (!headerEl) {
      return;
    }

    var paths = getPathInfo();
    headerEl.innerHTML = buildHeaderHtml(paths);
  }

  /**
   * Renders the shared footer into #site-footer.
   */
  function renderFooter() {
    var footerEl = document.getElementById("site-footer");
    if (!footerEl) {
      return;
    }

    var paths = getPathInfo();
    footerEl.innerHTML = buildFooterHtml(paths);
  }

  /**
   * Updates only the cart count badge in the header.
   */
  function updateCartCount() {
    var cartCountEl = document.getElementById("cc-cart-count");
    if (cartCountEl) {
      cartCountEl.textContent = String(getCartCount());
    }
  }

  window.ccLayout = {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    updateCartCount: updateCartCount
  };

  window.ccUpdateCartBadge = updateCartCount;

  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
    window.ccUpdateCartBadge();
  });

  window.addEventListener("storage", function (event) {
    if (event.key === "cc_cart") {
      updateCartCount();
    }
  });
})();
