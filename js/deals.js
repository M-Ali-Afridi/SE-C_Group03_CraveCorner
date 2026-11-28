/**
 * Crave Corner — Deals & Offers Page Logic
 * Handles mobile menu toggle, live countdown timer,
 * synchronized search/category filtering, and claim-to-cart state.
 */
document.addEventListener('DOMContentLoaded', () => {
  // ---------------------------------------------------------
  // 1. Mobile Hamburger Navigation
  // ---------------------------------------------------------
  const hamburgerBtn = document.getElementById('hamburger-btn');
  const primaryNav = document.getElementById('primary-nav');

  function setMenuOpen(isOpen) {
    primaryNav.classList.toggle('is-open', isOpen);
    hamburgerBtn.classList.toggle('is-open', isOpen);
    hamburgerBtn.setAttribute('aria-expanded', String(isOpen));
  }

  hamburgerBtn.addEventListener('click', () => {
    const isCurrentlyOpen = primaryNav.classList.contains('is-open');
    setMenuOpen(!isCurrentlyOpen);
  });

  // Close menu when pressing Escape or clicking a nav link on mobile
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && primaryNav.classList.contains('is-open')) {
      setMenuOpen(false);
    }
  });

  primaryNav.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (primaryNav.classList.contains('is-open')) {
        setMenuOpen(false);
      }
    });
  });

  // ---------------------------------------------------------
  // 2. Live Countdown Timer (starts at 02:14:09 -> 8,049s)
  // ---------------------------------------------------------
  const countdownBox = document.querySelector('.countdown-box');
  const countdownLabel = document.getElementById('countdown-label');
  const countdownTimerEl = document.getElementById('countdown-timer');

  let remainingSeconds = 2 * 3600 + 14 * 60 + 9; // 02:14:09

  function formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map((unit) => String(unit).padStart(2, '0'))
      .join(':');
  }

  function renderCountdown() {
    if (remainingSeconds <= 0) {
      countdownLabel.classList.add('hidden');
      countdownTimerEl.textContent = 'Offer expired';
      countdownBox.classList.add('expired');
      return false;
    }

    countdownTimerEl.textContent = formatTime(remainingSeconds);
    return true;
  }

  // Initial render and 1-second interval tick
  renderCountdown();
  const timerInterval = setInterval(() => {
    remainingSeconds -= 1;
    const stillActive = renderCountdown();
    if (!stillActive) {
      clearInterval(timerInterval);
    }
  }, 1000);

  // ---------------------------------------------------------
  // 3. Synchronized Search, Dropdown & Category Chip Filters
  // ---------------------------------------------------------
  const searchInput = document.getElementById('deal-search');
  const categorySelect = document.getElementById('category-select');
  const categoryChips = document.querySelectorAll('.chip');
  const dealCards = document.querySelectorAll('.deal-card');
  const noDealsMessage = document.getElementById('no-deals-message');

  let activeCategory = 'All';

  function applyFilters() {
    const query = searchInput.value.trim().toLowerCase();
    let visibleCount = 0;

    dealCards.forEach((card) => {
      const cardCategory = card.dataset.category;
      const cardText = card.textContent.toLowerCase();

      const matchesCategory = activeCategory === 'All' || cardCategory === activeCategory;
      const matchesSearch = query === '' || cardText.includes(query);
      const isVisible = matchesCategory && matchesSearch;

      card.classList.toggle('hidden', !isVisible);
      if (isVisible) {
        visibleCount += 1;
      }
    });

    noDealsMessage.classList.toggle('hidden', visibleCount > 0);
  }

  function setCategory(newCategory) {
    activeCategory = newCategory;

    // Keep dropdown in sync
    categorySelect.value = newCategory;

    // Keep category chips in sync
    categoryChips.forEach((chip) => {
      const isSelected = chip.dataset.category === newCategory;
      chip.classList.toggle('active', isSelected);
      chip.setAttribute('aria-pressed', String(isSelected));
    });

    applyFilters();
  }

  searchInput.addEventListener('input', applyFilters);

  categorySelect.addEventListener('change', (event) => {
    setCategory(event.target.value);
  });

  categoryChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      setCategory(chip.dataset.category);
    });
  });

  // ---------------------------------------------------------
  // 4. Claim Deal Button, Cart Count Badge & Toast Message
  // ---------------------------------------------------------
  const claimButtons = document.querySelectorAll('.claim-btn');
  const cartCountEl = document.getElementById('cart-count');
  const cartButton = document.getElementById('cart-button');
  const toastEl = document.getElementById('toast');

  let cartCount = 0;
  let toastTimeoutId = null;

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    toastEl.setAttribute('aria-hidden', 'false');

    if (toastTimeoutId) {
      clearTimeout(toastTimeoutId);
    }

    toastTimeoutId = setTimeout(() => {
      toastEl.classList.remove('show');
      toastEl.setAttribute('aria-hidden', 'true');
    }, 2600);
  }

  claimButtons.forEach((button) => {
    button.addEventListener('click', () => {
      // Prevent claiming the same deal multiple times
      if (button.classList.contains('btn-claimed')) {
        return;
      }

      button.textContent = 'Claimed \u2713';
      button.classList.remove('btn-primary');
      button.classList.add('btn-claimed');
      button.disabled = true;

      cartCount += 1;
      cartCountEl.textContent = String(cartCount);
      cartButton.setAttribute('aria-label', `Shopping cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`);

      // Brief scale animation on cart badge
      cartCountEl.classList.remove('bump');
      void cartCountEl.offsetWidth;
      cartCountEl.classList.add('bump');

      showToast('Deal added to your cart');
    });
  });
});
