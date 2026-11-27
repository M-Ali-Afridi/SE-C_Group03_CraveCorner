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
   * Escapes special HTML characters before inserting user-supplied strings.
   */
  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /**
   * Reads the cart item count from localStorage key "cc_cart".
   * Supports an array of cart items (summing qty/quantity) or a plain number.
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
   * Reads the signed-in user from localStorage key "cc_user".
   * Returns the display name if logged in, or null if no user is logged in.
   */
  function getUserName() {
    try {
      var rawUser = localStorage.getItem("cc_user");
      if (!rawUser || rawUser === "null" || rawUser === "undefined") {
        return null;
      }

      var parsedUser = JSON.parse(rawUser);
      if (typeof parsedUser === "string" && parsedUser.trim() !== "") {
        return parsedUser.trim();
      }

      if (parsedUser && typeof parsedUser === "object") {
        var name =
          parsedUser.name ||
          parsedUser.firstName ||
          parsedUser.fullName ||
          parsedUser.username ||
          "Guest";
        return String(name).trim() || "Guest";
      }
    } catch (error) {
      // Fallback if cc_user was saved as plain text instead of JSON
      var plainName = localStorage.getItem("cc_user");
      if (plainName && plainName.trim() !== "") {
        return plainName.trim();
      }
    }

    return null;
  }

  /**
   * Builds the HTML string for the Login button or the "Hi, Name" user dropdown.
   */
  function buildAccountControlHtml(paths) {
    var userName = getUserName();

    if (!userName) {
      var loginActive = isCurrentPage("login.html", paths.currentFile) ? " active" : "";
      var loginAria = loginActive ? ' aria-current="page"' : "";

      return (
        '<a class="btn cc-login-btn' + loginActive + '" href="' + paths.toPages + 'login.html"' + loginAria + ">" +
          '<span class="d-none d-lg-inline">Login</span>' +
          '<span class="d-lg-none">Login / Sign Up</span>' +
        "</a>"
      );
    }

    var accountActive = isCurrentPage("account.html", paths.currentFile) ? " active" : "";
    var favActive = isCurrentPage("favorites.html", paths.currentFile) ? " active" : "";

    return (
      '<div class="dropdown">' +
        '<button class="btn cc-login-btn dropdown-toggle" type="button" id="ccUserDropdown" ' +
          'data-bs-toggle="dropdown" aria-expanded="false">' +
          "Hi, " + escapeHtml(userName) +
        "</button>" +
        '<ul class="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="ccUserDropdown">' +
          '<li><a class="dropdown-item' + accountActive + '" href="' + paths.toPages + 'account.html">My Account &amp; Orders</a></li>' +
          '<li><a class="dropdown-item' + favActive + '" href="' + paths.toPages + 'favorites.html">Favorites</a></li>' +
          '<li><hr class="dropdown-divider"></li>' +
          '<li><button type="button" class="dropdown-item text-danger" id="cc-logout-btn">Log out</button></li>' +
        "</ul>" +
      "</div>"
    );
  }

  /**
   * Builds the complete shared navigation bar HTML string.
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

    return (
      '<nav class="navbar navbar-expand-lg cc-navbar py-2" aria-label="Main navigation">' +
        '<div class="container">' +
          '<a class="navbar-brand cc-brand" href="' + paths.toRoot + 'index.html">Crave Corner</a>' +
          '<button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#ccMainNavbar" ' +
            'aria-controls="ccMainNavbar" aria-expanded="false" aria-label="Toggle navigation">' +
            '<span class="navbar-toggler-icon"></span>' +
          "</button>" +
          '<div class="collapse navbar-collapse" id="ccMainNavbar">' +
            '<ul class="navbar-nav mx-auto mb-3 mb-lg-0 gap-lg-1 text-center">' +
              navLinksHtml +
            "</ul>" +
            '<div class="d-flex flex-column flex-lg-row align-items-center gap-2">' +
              '<a class="cc-heart-link' + (favActive ? " active" : "") + '" ' +
                'href="' + paths.toPages + 'favorites.html" ' +
                'aria-label="Favorites"' + (favActive ? ' aria-current="page"' : "") + ">" +
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
                  'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                  '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>' +
                "</svg>" +
                '<span class="d-lg-none ms-2">Favorites</span>' +
              "</a>" +
              '<a class="btn cc-cart-pill rounded-pill px-3' + (cartActive ? " active" : "") + '" ' +
                'href="' + paths.toPages + 'cart.html"' + (cartActive ? ' aria-current="page"' : "") + ">" +
                'Cart (<span id="cc-cart-count">' + cartCount + "</span>)" +
              "</a>" +
              buildAccountControlHtml(paths) +
            "</div>" +
          "</div>" +
        "</div>" +
      "</nav>"
    );
  }

  /**
   * Builds the complete shared footer HTML string (3 columns on desktop, 1 centered on mobile).
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
   * Renders the shared header into #site-header and wires up the Log out button.
   */
  function renderHeader() {
    var headerEl = document.getElementById("site-header");
    if (!headerEl) {
      return;
    }

    var paths = getPathInfo();
    headerEl.innerHTML = buildHeaderHtml(paths);

    var logoutBtn = document.getElementById("cc-logout-btn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function () {
        localStorage.removeItem("cc_user");
        renderHeader();
      });
    }
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
   * Updates only the cart count number in the header (useful for menu/cart pages).
   */
  function updateCartCount() {
    var cartCountEl = document.getElementById("cc-cart-count");
    if (cartCountEl) {
      cartCountEl.textContent = String(getCartCount());
    }
  }

  // Expose helper functions so individual pages can refresh the header after cart/login changes
  window.ccLayout = {
    renderHeader: renderHeader,
    renderFooter: renderFooter,
    updateCartCount: updateCartCount
  };

  // Build shared header and footer once the HTML document is ready
  document.addEventListener("DOMContentLoaded", function () {
    renderHeader();
    renderFooter();
  });

  // Sync header cart/user display if localStorage changes in another tab
  window.addEventListener("storage", function (event) {
    if (event.key === "cc_cart") {
      updateCartCount();
    } else if (event.key === "cc_user") {
      renderHeader();
    }
  });
})();
