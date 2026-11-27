/* ==========================================================================
   Author: M. Rehan Sadiq
   Roll Number: 26i-3122
   Section: Section C
   Crave Corner - Simulated Authentication Script (js/auth.js)
   Handles live Sign Up validation, simulated Login states, Remember Me
   session persistence, password visibility toggles, and header updates.
   ========================================================================== */

(function () {
  "use strict";

  var USERS_KEY = "cc_users";
  var SESSION_KEY = "cc_current_user";
  var MIN_PASSWORD_LENGTH = 8;
  var EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Track which sign-up fields the user has interacted with for live validation
  var signupTouched = {
    name: false,
    email: false,
    password: false,
    confirm: false
  };

  /* ------------------------------------------------------------------------
     1. Storage Helpers (localStorage & sessionStorage)
     ------------------------------------------------------------------------ */

  /**
   * Safely parses JSON from a storage object and returns fallback on error.
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
   * Loads all registered users from localStorage key "cc_users".
   */
  function loadUsers() {
    var users = readJsonFromStorage(window.localStorage, USERS_KEY, []);
    return Array.isArray(users) ? users : [];
  }

  /**
   * Saves the registered users array to localStorage key "cc_users".
   */
  function saveUsers(users) {
    try {
      window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      // Ignore storage quota/access errors so UI remains responsive
    }
  }

  /**
   * Reads the active user session.
   * Checks localStorage first (Remember Me), then sessionStorage (browser session).
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
   * Saves the active session to localStorage when Remember Me is true,
   * or to sessionStorage when false (lasts only for the browser session).
   */
  function saveSession(user, rememberMe) {
    var sessionData = {
      id: user.id,
      fullName: user.fullName,
      firstName: user.firstName,
      email: user.email,
      rememberMe: Boolean(rememberMe),
      loggedInAt: new Date().toISOString()
    };

    clearSession();

    try {
      var targetStorage = rememberMe ? window.localStorage : window.sessionStorage;
      targetStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (error) {
      // Ignore storage write errors
    }

    return sessionData;
  }

  /**
   * Clears any active session from both localStorage and sessionStorage.
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
   * Normalizes an email address for case-insensitive lookup.
   */
  function normalizeEmail(email) {
    return String(email || "").trim().toLowerCase();
  }

  /**
   * Extracts a clean first name from a user's full name.
   */
  function extractFirstName(fullName) {
    var trimmed = String(fullName || "").trim();
    if (!trimmed) {
      return "Guest";
    }
    return trimmed.split(/\s+/)[0];
  }

  /**
   * Finds a user in cc_users by normalized email address.
   */
  function findUserByEmail(email) {
    var target = normalizeEmail(email);
    var users = loadUsers();

    for (var i = 0; i < users.length; i += 1) {
      if (users[i] && normalizeEmail(users[i].email) === target) {
        return users[i];
      }
    }
    return null;
  }

  /* ------------------------------------------------------------------------
     2. Validation Helpers
     ------------------------------------------------------------------------ */

  /**
   * Validates full name (required, at least 2 characters).
   */
  function validateFullName(value) {
    var trimmed = String(value || "").trim();
    if (!trimmed) {
      return "Full Name is required.";
    }
    if (trimmed.length < 2) {
      return "Full Name must be at least 2 characters.";
    }
    return "";
  }

  /**
   * Validates email format and optionally checks for duplicate accounts.
   */
  function validateEmail(value, checkDuplicate) {
    var normalized = normalizeEmail(value);
    if (!normalized) {
      return "Email Address is required.";
    }
    if (!EMAIL_PATTERN.test(normalized)) {
      return "Please enter a valid email address (e.g. name@example.com).";
    }
    if (checkDuplicate && findUserByEmail(normalized)) {
      return "An account with this email already exists.";
    }
    return "";
  }

  /**
   * Validates password against length, letter, and number rules.
   */
  function validatePassword(value, isSignup) {
    var raw = String(value || "");
    if (!raw) {
      return "Password is required.";
    }
    if (!isSignup) {
      return "";
    }
    if (raw.length < MIN_PASSWORD_LENGTH) {
      return "Password must be at least " + MIN_PASSWORD_LENGTH + " characters long.";
    }
    if (!/[A-Za-z]/.test(raw) || !/[0-9]/.test(raw)) {
      return "Password must include at least one letter and one number.";
    }
    return "";
  }

  /**
   * Validates confirm password matches the main sign-up password.
   */
  function validateConfirmPassword(passwordValue, confirmValue) {
    if (!confirmValue) {
      return "Please confirm your password.";
    }
    if (passwordValue !== confirmValue) {
      return "Passwords do not match.";
    }
    return "";
  }

  /**
   * Updates an input's inline error message, ARIA state, and valid/invalid class.
   */
  function setFieldFeedback(inputEl, errorEl, errorMessage, showValidState) {
    if (!inputEl || !errorEl) {
      return;
    }

    errorEl.textContent = errorMessage;

    if (errorMessage) {
      inputEl.classList.add("is-invalid");
      inputEl.classList.remove("is-valid");
      inputEl.setAttribute("aria-invalid", "true");
    } else {
      inputEl.classList.remove("is-invalid");
      inputEl.setAttribute("aria-invalid", "false");
      if (showValidState) {
        inputEl.classList.add("is-valid");
      } else {
        inputEl.classList.remove("is-valid");
      }
    }
  }

  /**
   * Clears validation classes and messages on all inputs within a form.
   */
  function resetFormValidation(formEl) {
    if (!formEl) {
      return;
    }

    var inputs = formEl.querySelectorAll(".cc-input");
    inputs.forEach(function (input) {
      input.classList.remove("is-invalid", "is-valid");
      input.removeAttribute("aria-invalid");
    });

    var errors = formEl.querySelectorAll(".cc-field-error");
    errors.forEach(function (err) {
      err.textContent = "";
    });
  }

  /* ------------------------------------------------------------------------
     3. UI State & View Rendering Helpers
     ------------------------------------------------------------------------ */

  /**
   * Shows one top-level page state: "forms", "success", or "loggedin".
   */
  function showPageView(viewName) {
    var formsView = document.getElementById("auth-forms-view");
    var successView = document.getElementById("auth-success-view");
    var loggedInView = document.getElementById("auth-loggedin-view");

    if (!formsView || !successView || !loggedInView) {
      return;
    }

    formsView.classList.toggle("d-none", viewName !== "forms");
    successView.classList.toggle("d-none", viewName !== "success");
    loggedInView.classList.toggle("d-none", viewName !== "loggedin");
  }

  /**
   * Switches the Login card between State 1 ("form") and State 2 ("error").
   */
  function setLoginCardMode(mode) {
    var loginForm = document.getElementById("login-form");
    var errorPanel = document.getElementById("login-error-panel");
    if (!loginForm || !errorPanel) {
      return;
    }

    var showError = mode === "error";
    loginForm.classList.toggle("d-none", showError);
    errorPanel.classList.toggle("d-none", !showError);

    if (showError) {
      errorPanel.focus();
    }
  }

  /**
   * Switches the active tab in mobile single-column view ("login" or "signup").
   */
  function switchMobileTab(tabName) {
    var loginCol = document.getElementById("login-card-panel");
    var signupCol = document.getElementById("signup-card-panel");
    var loginTab = document.getElementById("tab-btn-login");
    var signupTab = document.getElementById("tab-btn-signup");

    if (!loginCol || !signupCol || !loginTab || !signupTab) {
      return;
    }

    var isLogin = tabName === "login";
    loginCol.classList.toggle("is-mobile-active", isLogin);
    signupCol.classList.toggle("is-mobile-active", !isLogin);

    loginTab.classList.toggle("active", isLogin);
    signupTab.classList.toggle("active", !isLogin);
    loginTab.setAttribute("aria-selected", String(isLogin));
    signupTab.setAttribute("aria-selected", String(!isLogin));
  }

  /**
   * Toggles password field visibility and updates eye icons + ARIA attributes.
   */
  function togglePasswordVisibility(buttonEl) {
    var targetId = buttonEl.getAttribute("data-toggle-password");
    var inputEl = document.getElementById(targetId);
    if (!inputEl) {
      return;
    }

    var showingText = inputEl.type === "text";
    inputEl.type = showingText ? "password" : "text";

    var nowVisible = !showingText;
    buttonEl.setAttribute("aria-pressed", String(nowVisible));
    buttonEl.setAttribute("aria-label", nowVisible ? "Hide password" : "Show password");
    buttonEl.setAttribute("title", nowVisible ? "Hide password" : "Show password");

    var openEye = buttonEl.querySelector(".cc-eye-open");
    var closedEye = buttonEl.querySelector(".cc-eye-closed");
    if (openEye && closedEye) {
      openEye.classList.toggle("d-none", nowVisible);
      closedEye.classList.toggle("d-none", !nowVisible);
    }
  }

  /**
   * Updates State 4 in the shared header account dropdown without editing js/layout.js.
   * When logged in, displays the user's name with "My Account" and "Logout" options.
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

    var accountSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>' +
        '<circle cx="12" cy="7" r="4"></circle>' +
      "</svg>";

    accountBtn.innerHTML = accountSvg;
    menuEl.innerHTML = "";

    if (session) {
      var nameSpan = document.createElement("span");
      nameSpan.className = "cc-header-user-name";
      nameSpan.textContent = session.firstName;
      accountBtn.appendChild(nameSpan);
      accountBtn.setAttribute("aria-label", "Account: " + session.fullName);
      accountBtn.setAttribute("title", session.fullName);

      var userHeaderLi = document.createElement("li");
      var userHeaderSpan = document.createElement("span");
      userHeaderSpan.className = "dropdown-item-text fw-semibold cc-dropdown-user-label";
      userHeaderSpan.textContent = session.fullName;
      userHeaderLi.appendChild(userHeaderSpan);

      var dividerLi = document.createElement("li");
      dividerLi.innerHTML = '<hr class="dropdown-divider">';

      var myAccountLi = document.createElement("li");
      var myAccountLink = document.createElement("a");
      myAccountLink.className = "dropdown-item";
      myAccountLink.href = "account.html";
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
      return;
    }

    // Logged-out default dropdown matching js/layout.js
    accountBtn.setAttribute("aria-label", "Account");
    accountBtn.setAttribute("title", "Account");

    var loginLi = document.createElement("li");
    var loginLink = document.createElement("a");
    loginLink.className = "dropdown-item active";
    loginLink.href = "login.html";
    loginLink.setAttribute("aria-current", "page");
    loginLink.textContent = "Login / Sign Up";
    loginLi.appendChild(loginLink);

    var accountLi = document.createElement("li");
    var accountLink = document.createElement("a");
    accountLink.className = "dropdown-item";
    accountLink.href = "account.html";
    accountLink.textContent = "My Account & Order History";
    accountLi.appendChild(accountLink);

    menuEl.appendChild(loginLi);
    menuEl.appendChild(accountLi);
  }

  /**
   * Populates and displays State 3 (Login / Sign Up Success Screen).
   */
  function renderSuccessView(session, isNewAccount) {
    var titleEl = document.getElementById("auth-success-title");
    var subtitleEl = document.getElementById("auth-success-subtitle");
    var successView = document.getElementById("auth-success-view");

    if (titleEl) {
      titleEl.textContent = isNewAccount
        ? "Account Created! Welcome, " + session.firstName + "!"
        : "Login Successful! Welcome Back, " + session.firstName + "!";
    }
    if (subtitleEl) {
      subtitleEl.textContent =
        "You are signed in as " + session.email + ". Ready to explore Crave Corner?";
    }

    showPageView("success");
    if (successView) {
      successView.focus();
    }
  }

  /**
   * Populates and displays State 4 (Already Logged-In Screen).
   */
  function renderLoggedInView(session) {
    var titleEl = document.getElementById("loggedin-title");
    var detailsEl = document.getElementById("loggedin-details");
    var sessionNoteEl = document.getElementById("loggedin-session-note");
    var loggedInView = document.getElementById("auth-loggedin-view");

    if (titleEl) {
      titleEl.textContent = "Welcome Back, " + session.firstName + "!";
    }
    if (detailsEl) {
      detailsEl.textContent =
        "You are currently signed in as " + session.fullName + " (" + session.email + ").";
    }
    if (sessionNoteEl) {
      sessionNoteEl.textContent = session.rememberMe
        ? "Remember Me is active (saved across reloads)"
        : "Active for this browser session only";
    }

    showPageView("loggedin");
    if (loggedInView) {
      loggedInView.focus();
    }
  }

  /* ------------------------------------------------------------------------
     4. Form Validation & Action Handlers
     ------------------------------------------------------------------------ */

  /**
   * Validates one or all Sign Up fields and updates inline feedback.
   * Returns true when all Sign Up fields are valid.
   */
  function validateSignupFields(forceAll) {
    var nameInput = document.getElementById("signup-name");
    var emailInput = document.getElementById("signup-email");
    var passwordInput = document.getElementById("signup-password");
    var confirmInput = document.getElementById("signup-confirm-password");

    var nameErrorEl = document.getElementById("signup-name-error");
    var emailErrorEl = document.getElementById("signup-email-error");
    var passwordErrorEl = document.getElementById("signup-password-error");
    var confirmErrorEl = document.getElementById("signup-confirm-error");

    var nameErr = validateFullName(nameInput.value);
    var emailErr = validateEmail(emailInput.value, true);
    var passwordErr = validatePassword(passwordInput.value, true);
    var confirmErr = validateConfirmPassword(passwordInput.value, confirmInput.value);

    if (forceAll || signupTouched.name) {
      setFieldFeedback(nameInput, nameErrorEl, nameErr, !nameErr);
    }
    if (forceAll || signupTouched.email) {
      setFieldFeedback(emailInput, emailErrorEl, emailErr, !emailErr);
    }
    if (forceAll || signupTouched.password) {
      setFieldFeedback(passwordInput, passwordErrorEl, passwordErr, !passwordErr);
    }
    if (forceAll || signupTouched.confirm) {
      setFieldFeedback(confirmInput, confirmErrorEl, confirmErr, !confirmErr);
    }

    return !nameErr && !emailErr && !passwordErr && !confirmErr;
  }

  /**
   * Handles Sign Up submission: validates all fields, creates user, and logs in.
   */
  function handleSignupSubmit(event) {
    event.preventDefault();

    signupTouched.name = true;
    signupTouched.email = true;
    signupTouched.password = true;
    signupTouched.confirm = true;

    if (!validateSignupFields(true)) {
      var firstInvalid = document.querySelector("#signup-form .is-invalid");
      if (firstInvalid) {
        firstInvalid.focus();
      }
      return;
    }

    var fullName = document.getElementById("signup-name").value.trim();
    var email = normalizeEmail(document.getElementById("signup-email").value);
    var password = document.getElementById("signup-password").value;

    var newUser = {
      id: "usr_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
      fullName: fullName,
      firstName: extractFirstName(fullName),
      email: email,
      password: password,
      createdAt: new Date().toISOString()
    };

    var users = loadUsers();
    users.push(newUser);
    saveUsers(users);

    // Log in for the current browser session on sign up
    var session = saveSession(newUser, false);
    syncHeaderAccountState(session);
    renderSuccessView(session, true);
  }

  /**
   * Handles Login submission: checks empty fields, then verifies credentials.
   * Shows State 2 on wrong credentials or State 3 on success.
   */
  function handleLoginSubmit(event) {
    event.preventDefault();

    var emailInput = document.getElementById("login-email");
    var passwordInput = document.getElementById("login-password");
    var rememberCheckbox = document.getElementById("login-remember");

    var emailErrorEl = document.getElementById("login-email-error");
    var passwordErrorEl = document.getElementById("login-password-error");

    var emailErr = validateEmail(emailInput.value, false);
    var passwordErr = validatePassword(passwordInput.value, false);

    setFieldFeedback(emailInput, emailErrorEl, emailErr, false);
    setFieldFeedback(passwordInput, passwordErrorEl, passwordErr, false);

    if (emailErr || passwordErr) {
      var firstInvalid = emailErr ? emailInput : passwordInput;
      firstInvalid.focus();
      return;
    }

    var enteredEmail = normalizeEmail(emailInput.value);
    var enteredPassword = passwordInput.value;
    var matchedUser = findUserByEmail(enteredEmail);

    if (!matchedUser || matchedUser.password !== enteredPassword) {
      setLoginCardMode("error");
      return;
    }

    var rememberMe = rememberCheckbox ? rememberCheckbox.checked : false;
    var session = saveSession(matchedUser, rememberMe);
    syncHeaderAccountState(session);
    renderSuccessView(session, false);
  }

  /**
   * Logs the user out, resets forms/header, and returns to State 1.
   */
  function handleLogout() {
    var accountBtn = document.getElementById("ccAccountDropdown");
    if (accountBtn && window.bootstrap && window.bootstrap.Dropdown) {
      var dropdownInstance = window.bootstrap.Dropdown.getInstance(accountBtn);
      if (dropdownInstance) {
        dropdownInstance.hide();
      }
    }

    clearSession();
    syncHeaderAccountState(null);

    var loginForm = document.getElementById("login-form");
    var signupForm = document.getElementById("signup-form");
    if (loginForm) {
      loginForm.reset();
      resetFormValidation(loginForm);
    }
    if (signupForm) {
      signupForm.reset();
      resetFormValidation(signupForm);
    }

    signupTouched.name = false;
    signupTouched.email = false;
    signupTouched.password = false;
    signupTouched.confirm = false;

    setLoginCardMode("form");
    switchMobileTab("login");
    showPageView("forms");

    var loginEmail = document.getElementById("login-email");
    if (loginEmail) {
      loginEmail.focus();
    }
  }

  /* ------------------------------------------------------------------------
     5. Event Binding & Initialization
     ------------------------------------------------------------------------ */

  /**
   * Attaches live validation listeners to all four Sign Up inputs.
   */
  function bindLiveSignupValidation() {
    var fieldMap = [
      { id: "signup-name", key: "name" },
      { id: "signup-email", key: "email" },
      { id: "signup-password", key: "password" },
      { id: "signup-confirm-password", key: "confirm" }
    ];

    fieldMap.forEach(function (field) {
      var el = document.getElementById(field.id);
      if (!el) {
        return;
      }

      el.addEventListener("input", function () {
        signupTouched[field.key] = true;
        validateSignupFields(false);
      });

      el.addEventListener("blur", function () {
        signupTouched[field.key] = true;
        validateSignupFields(false);
      });
    });
  }

  /**
   * Attaches form, tab, toggle, and logout event listeners.
   */
  function bindEvents() {
    var loginForm = document.getElementById("login-form");
    var signupForm = document.getElementById("signup-form");
    var tryAgainBtn = document.getElementById("login-try-again-btn");
    var pageLogoutBtn = document.getElementById("page-logout-btn");
    var switchToSignupBtn = document.getElementById("switch-to-signup");
    var switchToLoginBtn = document.getElementById("switch-to-login");
    var tabButtons = document.querySelectorAll("[data-auth-tab]");
    var passwordToggles = document.querySelectorAll("[data-toggle-password]");

    if (loginForm) {
      loginForm.addEventListener("submit", handleLoginSubmit);
    }
    if (signupForm) {
      signupForm.addEventListener("submit", handleSignupSubmit);
    }

    if (tryAgainBtn) {
      tryAgainBtn.addEventListener("click", function () {
        setLoginCardMode("form");
        var emailInput = document.getElementById("login-email");
        if (emailInput) {
          emailInput.focus();
        }
      });
    }

    if (pageLogoutBtn) {
      pageLogoutBtn.addEventListener("click", handleLogout);
    }

    if (switchToSignupBtn) {
      switchToSignupBtn.addEventListener("click", function () {
        switchMobileTab("signup");
        var signupName = document.getElementById("signup-name");
        if (signupName) {
          signupName.focus();
        }
      });
    }

    if (switchToLoginBtn) {
      switchToLoginBtn.addEventListener("click", function () {
        switchMobileTab("login");
        setLoginCardMode("form");
        var loginEmail = document.getElementById("login-email");
        if (loginEmail) {
          loginEmail.focus();
        }
      });
    }

    tabButtons.forEach(function (tabBtn) {
      tabBtn.addEventListener("click", function () {
        var tabName = tabBtn.getAttribute("data-auth-tab");
        switchMobileTab(tabName);
      });
    });

    passwordToggles.forEach(function (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        togglePasswordVisibility(toggleBtn);
      });
    });

    // Clear inline errors on login fields as the user edits them
    var loginEmailEl = document.getElementById("login-email");
    var loginPassEl = document.getElementById("login-password");
    if (loginEmailEl) {
      loginEmailEl.addEventListener("input", function () {
        setFieldFeedback(loginEmailEl, document.getElementById("login-email-error"), "", false);
      });
    }
    if (loginPassEl) {
      loginPassEl.addEventListener("input", function () {
        setFieldFeedback(loginPassEl, document.getElementById("login-password-error"), "", false);
      });
    }

    bindLiveSignupValidation();
  }

  /**
   * Initializes page state on load: restores existing session if present.
   */
  function initAuthPage() {
    bindEvents();

    var activeSession = getCurrentSession();
    syncHeaderAccountState(activeSession);

    if (activeSession) {
      renderLoggedInView(activeSession);
    } else {
      setLoginCardMode("form");
      switchMobileTab("login");
      showPageView("forms");
    }
  }

  document.addEventListener("DOMContentLoaded", initAuthPage);

  // Sync auth UI if another tab logs in or out
  window.addEventListener("storage", function (event) {
    if (event.key === SESSION_KEY) {
      var session = getCurrentSession();
      syncHeaderAccountState(session);
      if (session) {
        renderLoggedInView(session);
      } else {
        setLoginCardMode("form");
        showPageView("forms");
      }
    }
  });
})();
