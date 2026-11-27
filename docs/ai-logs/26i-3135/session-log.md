# AI Session Log — Crave Corner (Shared Foundation)

- **Student / Branch:** `26i-3135` (`i263135`)
- **Project:** Crave Corner (`SE-C_Group03_CraveCorner`)
- **Date:** 2026-11-27
- **Tech Stack:** HTML5, CSS3, Bootstrap 5.3.3 (Official CDN), Vanilla JavaScript, Google Fonts (`Playfair Display`, `Poppins`)

---

## Turn 1 — Initial Shared Foundation

### User Prompt
> I am building "Crave Corner", a multi-page restaurant ordering website for a university project, using only HTML5, CSS3, Bootstrap and vanilla JavaScript (no other frameworks or libraries, no jQuery). Load Bootstrap 5 from its official CDN (CSS link in the head, JS bundle before the closing body tag) on every page. Build the shared foundation only, not the individual pages yet. (1) Create the folders pages/, css/, js/, images/, docs/prototype-photos/, docs/feedback-photos/ and docs/ai-logs/26i-3135/, with a .gitkeep file in each empty one. (2) Create index.html as a simple placeholder home page that uses the shared header and footer. (3) Shared header: logo "Crave Corner" linking to index.html; nav links Home, Menu, Deals, Reserve, Catering (pointing to index.html, pages/menu.html, pages/deals.html, pages/reservation.html, pages/catering.html); a heart icon linking to pages/favorites.html; a "Cart (0)" pill linking to pages/cart.html; and a Login button linking to pages/login.html. On mobile, collapse it into a hamburger menu with the same links plus Login / Sign Up. If localStorage key cc_user exists, the Login button becomes "Hi, Name" with a dropdown: My Account & Orders (pages/account.html), Favorites, Log out. The cart count comes from localStorage key cc_cart. (4) Shared footer: three columns, Crave Corner (Fresh food, fast), Quick links (About Us & Gallery -> pages/about.html, Contact & Location -> pages/contact.html, Reviews & FAQ -> pages/reviews.html), and Visit us (Islamabad, Pakistan; Open daily 11 am - 12 am; +92 300 1234567), with a bottom line "© 2026 Crave Corner". On mobile, stack everything in one centred column. (5) css/style.css with colour variables (red primary, amber accent, charcoal footer, cream background). (6) js/layout.js that builds the header and footer as HTML strings and inserts them into placeholders on every page, so no page repeats the code. Do not use fetch to load partial files. It must work for pages in the root folder and in pages/, using relative paths only, and highlight the current page's link. Use semantic HTML (header, nav, main, footer). Keep the code simple and well commented, so a student can explain every part.

### Actions & Output
- Created empty folders tracked with `.gitkeep`:
  - `pages/.gitkeep`
  - `images/.gitkeep`
  - `docs/prototype-photos/.gitkeep`
  - `docs/feedback-photos/.gitkeep`
  - `docs/ai-logs/26i-3135/.gitkeep`
- Created `css/style.css` with initial CSS colour variables, flexbox sticky footer, and navbar/footer styles.
- Created `js/layout.js` to inject the shared `<nav>` and footer HTML strings into `#site-header` and `#site-footer`, handle relative paths for root vs `pages/`, highlight the active page link, and read `cc_cart` and `cc_user` from `localStorage`.
- Created `index.html` using semantic `<header>`, `<main>`, and `<footer>`, loading Bootstrap 5.3.3 CDN CSS/JS, `css/style.css`, and `js/layout.js`.
- Verified folder structure with `Get-ChildItem` and `git status`.

---

## Turn 2 — Design System Update (Colours, Fonts, Buttons, Forms)

### User Prompt
> Colour Theme
> We will use the following colours throughout the website:
> - Dark Brown: #743D2B (main colour, headings, navigation)
> - Terracotta Orange: #C66B45 (buttons, highlights, prices)
> - Cream: #F8F1E7 (main background)
> - White: #FFFFFF (cards and forms)
> - Dark Text: #49352B (paragraphs and labels)
> - Sage Green: #6D8963 (success messages)
> Do not introduce random colours.
>
> 2. Fonts
> We will use ONLY two fonts:
> - Playfair Display: All headings and titles.
> - Poppins: All normal text, buttons, labels and navigation.
>
> 3. Header / Navigation Bar
> Every page must have the same header:
> - Crave Corner logo on the top-left.
> - Navigation links: Home, Menu, Deals, About, Contact.
> - Search, Cart and Account icons on the right.
> - Same colours, font and layout on every page.
> - Highlight the currently selected page/section.
>
> Buttons
> - Primary buttons: Dark brown background with white text.
> - Secondary buttons: White/cream background with brown border and text.
> - All buttons should have slightly rounded corners.
> - Keep button sizes and styles consistent.
>
> 6. Input Fields and Forms
> - White background.
> - Thin beige/brown border.
> - Slightly rounded corners.
> - Same style for text fields, dropdowns and other inputs.
> - Error messages should be red.
> - Success messages should be green.
> Your task is to update the existing index.html using these requirements

### Actions & Output
- Updated `css/style.css` to define the new colour palette (`--cc-brown: #743D2B`, `--cc-terracotta: #C66B45`, `--cc-cream: #F8F1E7`, `--cc-white: #FFFFFF`, `--cc-dark-text: #49352B`, `--cc-sage: #6D8963`, `--cc-error: #C0392B`), font variables (`Playfair Display` and `Poppins`), `.btn-cc-primary`, `.btn-cc-secondary`, `.cc-card`, `.cc-input`, `.cc-alert-success`, and `.cc-alert-error`.
- Updated `js/layout.js` with the updated palette/navigation and inline search bar toggle.
- Updated `index.html` to load `Playfair Display` and `Poppins` from Google Fonts and showcase the theme, cards, buttons, and form validation.
- Verified colour hex tokens with `Select-String` across `index.html`, `css/style.css`, and `js/layout.js`.

---

## Turn 3 — Shared Foundation Cleanup

### User Prompt
> Read index.html, css/style.css and js/layout.js first. This is a cleanup of the shared foundation, so make only the changes listed below and do not add any new features, sections, pages, libraries or fonts. Keep the current colours, fonts and icon style. (1) index.html: replace everything inside `<main>` with a very simple placeholder (one heading "Crave Corner" and one line "Home page coming soon"). Remove the hero section, the Chef's Highlights cards, the weekly deals and updates form and the inline validation script. Nothing about deals, combos or discounts should be on this page. Keep the header and footer placeholders and the script tags. (2) Header, built in js/layout.js: on the left the logo "Crave Corner" linking to index.html; nav links Home, Menu, Deals, Reserve, Catering (pointing to index.html, pages/menu.html, pages/deals.html, pages/reservation.html, pages/catering.html); on the right exactly three icon buttons and no search bar: a heart icon linking to pages/favorites.html, an account icon that opens a dropdown, and a cart icon linking to pages/cart.html with its count badge from localStorage key cc_cart (keep the cart icon and badge working as they do now). Remove the search bar completely, along with its styles and script. The heart should be an outline in its normal state and turn filled primary red with a slight scale-up on hover and on keyboard focus, with a smooth transition. Give every icon an aria-label and a title tooltip (Favourites, Account, Cart). (3) Account dropdown: use a Bootstrap dropdown (data-bs-toggle="dropdown", right-aligned) so that clicking the account icon shows exactly two options: "Login / Sign Up" linking to pages/login.html and "My Account & Order History" linking to pages/account.html. No other items, no Log out, no username. It must close when clicking outside and work with the keyboard. (4) Mobile: below the Bootstrap lg breakpoint, the nav links collapse into the hamburger menu, while the heart, account and cart icons stay visible in the top bar. (5) Footer, built in js/layout.js: replace it with exactly three columns and a bottom line, and remove anything else. Column 1: Crave Corner (Fresh food, fast). Column 2: Quick links (About Us & Gallery -> pages/about.html, Contact & Location -> pages/contact.html, Reviews & FAQ -> pages/reviews.html). Column 3: Visit us (Islamabad, Pakistan; Open daily 11 am - 12 am; +92 300 1234567). Bottom line: "© 2026 Crave Corner". On mobile the columns stack in one centred column. (6) All links must be relative paths that work from both the root folder and the pages/ folder, and the current page's nav link must stay highlighted. Do not change anything else in css/style.css beyond what these changes need.

### Actions & Output
- Read `index.html`, `css/style.css`, and `js/layout.js`.
- **`index.html`:** Replaced `<main>` contents with `<h1>Crave Corner</h1>` and `<p class="mb-0">Home page coming soon</p>`, removing the hero section, Chef's Highlights cards, weekly updates form, and inline script.
- **`css/style.css`:** Removed `.cc-search-bar` and added `.cc-heart-btn` hover/focus rules so the outline heart SVG fills with `var(--cc-error)` and scales smoothly (`scale(1.15)`) on hover and keyboard focus. Left all other palette, font, button, input, and footer rules untouched.
- **`js/layout.js`:**
  - Restored nav links: `Home`, `Menu`, `Deals`, `Reserve`, `Catering`.
  - Removed the search bar and `cc_user`/logout logic.
  - Placed the three right-side icon buttons (`Favourites` heart -> `pages/favorites.html`, `Account` Bootstrap dropdown, `Cart` -> `pages/cart.html` with `cc_cart` badge) in a `d-flex align-items-center gap-1 order-lg-3` container alongside the hamburger toggler so they remain visible on mobile while `#ccMainNavbar` (`order-lg-2`) collapses below `lg`.
  - Configured the right-aligned Bootstrap dropdown (`data-bs-toggle="dropdown"`, `dropdown-menu-end`) with exactly two items: `Login / Sign Up` (`pages/login.html`) and `My Account & Order History` (`pages/account.html`).
  - Kept the 3-column centered-on-mobile footer (`Crave Corner`, `Quick links`, `Visit us`, and `© 2026 Crave Corner`) and relative path resolution for root and `pages/`.
- Verified cleanup with `Select-String` and `git status -s`.

---

## Turn 4 — Session Export

### User Prompt
> can u export our current session into a .md file

### Actions & Output
- Exported the full session log to `docs/ai-logs/26i-3135/session-log.md`.

---

## Final Workspace Files

- `index.html`
- `css/style.css`
- `js/layout.js`
- `pages/.gitkeep`
- `images/.gitkeep`
- `docs/prototype-photos/.gitkeep`
- `docs/feedback-photos/.gitkeep`
- `docs/ai-logs/26i-3135/.gitkeep`
- `docs/ai-logs/26i-3135/session-log.md`
