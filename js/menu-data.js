/* ==========================================================================
   Crave Corner - Menu Data (js/menu-data.js)
   Global array of 48 menu items with prices in PKR.
   ========================================================================== */

const MENU_ITEMS = [
  // Burgers (10)
  { id: "crave-zinger-burger", name: "Crave Zinger Burger", category: "Burgers", price: 749 },
  { id: "double-zinger-stacker", name: "Double Zinger Stacker", category: "Burgers", price: 1099 },
  { id: "crunch-chicken-burger", name: "Crunch Chicken Burger", category: "Burgers", price: 649 },
  { id: "smoky-bbq-beef-burger", name: "Smoky BBQ Beef Burger", category: "Burgers", price: 949 },
  { id: "cheesy-lava-burger", name: "Cheesy Lava Burger", category: "Burgers", price: 899 },
  { id: "fiery-inferno-burger", name: "Fiery Inferno Burger", category: "Burgers", price: 849 },
  { id: "mushroom-swiss-beef-burger", name: "Mushroom Swiss Beef Burger", category: "Burgers", price: 1049 },
  { id: "crispy-fish-fillet-burger", name: "Crispy Fish Fillet Burger", category: "Burgers", price: 799 },
  { id: "garden-veggie-burger", name: "Garden Veggie Burger", category: "Burgers", price: 599 },
  { id: "crave-tower-burger", name: "Crave Tower Burger", category: "Burgers", price: 1399 },

  // Pizza (10)
  { id: "chicken-tikka-pizza", name: "Chicken Tikka Pizza", category: "Pizza", sizes: { small: 850, medium: 1450, large: 1950 } },
  { id: "chicken-fajita-pizza", name: "Chicken Fajita Pizza", category: "Pizza", sizes: { small: 850, medium: 1450, large: 1950 } },
  { id: "crown-crust-pizza", name: "Crown Crust Pizza", category: "Pizza", sizes: { small: 1050, medium: 1750, large: 2350 } },
  { id: "behari-kebab-pizza", name: "Behari Kebab Pizza", category: "Pizza", sizes: { small: 900, medium: 1550, large: 2050 } },
  { id: "pepperoni-feast-pizza", name: "Pepperoni Feast Pizza", category: "Pizza", sizes: { small: 950, medium: 1600, large: 2150 } },
  { id: "bbq-chicken-ranch-pizza", name: "BBQ Chicken Ranch Pizza", category: "Pizza", sizes: { small: 900, medium: 1550, large: 2050 } },
  { id: "malai-boti-pizza", name: "Malai Boti Pizza", category: "Pizza", sizes: { small: 950, medium: 1600, large: 2150 } },
  { id: "four-cheese-pizza", name: "Four Cheese Pizza", category: "Pizza", sizes: { small: 1000, medium: 1700, large: 2250 } },
  { id: "classic-margherita-pizza", name: "Classic Margherita Pizza", category: "Pizza", sizes: { small: 650, medium: 1100, large: 1500 } },
  { id: "veggie-supreme-pizza", name: "Veggie Supreme Pizza", category: "Pizza", sizes: { small: 750, medium: 1250, large: 1700 } },

  // Pasta (8)
  { id: "creamy-chicken-alfredo", name: "Creamy Chicken Alfredo", category: "Pasta", price: 899 },
  { id: "chicken-tikka-pasta", name: "Chicken Tikka Pasta", category: "Pasta", price: 849 },
  { id: "penne-arrabbiata", name: "Penne Arrabbiata", category: "Pasta", price: 749 },
  { id: "baked-lasagna", name: "Baked Lasagna", category: "Pasta", price: 999 },
  { id: "baked-mac-and-cheese", name: "Baked Mac and Cheese", category: "Pasta", price: 799 },
  { id: "spaghetti-bolognese", name: "Spaghetti Bolognese", category: "Pasta", price: 949 },
  { id: "mushroom-fettuccine", name: "Mushroom Fettuccine", category: "Pasta", price: 899 },
  { id: "crunchy-chicken-pasta-bowl", name: "Crunchy Chicken Pasta Bowl", category: "Pasta", price: 999 },

  // Sides (10)
  { id: "regular-fries", name: "Regular Fries", category: "Sides", price: 249 },
  { id: "peri-peri-fries", name: "Peri Peri Fries", category: "Sides", price: 329 },
  { id: "loaded-cheese-fries", name: "Loaded Cheese Fries", category: "Sides", price: 499 },
  { id: "crispy-wings-6-pcs", name: "Crispy Wings (6 pcs)", category: "Sides", price: 649 },
  { id: "chicken-nuggets-6-pcs", name: "Chicken Nuggets (6 pcs)", category: "Sides", price: 449 },
  { id: "onion-rings", name: "Onion Rings", category: "Sides", price: 349 },
  { id: "garlic-bread-with-cheese", name: "Garlic Bread with Cheese", category: "Sides", price: 399 },
  { id: "mozzarella-sticks-5-pcs", name: "Mozzarella Sticks (5 pcs)", category: "Sides", price: 549 },
  { id: "dynamite-chicken-bites", name: "Dynamite Chicken Bites", category: "Sides", price: 599 },
  { id: "creamy-coleslaw", name: "Creamy Coleslaw", category: "Sides", price: 179 },

  // Drinks (10)
  { id: "pepsi-345-ml", name: "Pepsi (345 ml)", category: "Drinks", price: 150 },
  { id: "7up-345-ml", name: "7UP (345 ml)", category: "Drinks", price: 150 },
  { id: "mirinda-345-ml", name: "Mirinda (345 ml)", category: "Drinks", price: 150 },
  { id: "pepsi-family-bottle-15-l", name: "Pepsi Family Bottle (1.5 L)", category: "Drinks", price: 290 },
  { id: "mineral-water-500-ml", name: "Mineral Water (500 ml)", category: "Drinks", price: 100 },
  { id: "mint-margarita", name: "Mint Margarita", category: "Drinks", price: 349 },
  { id: "strawberry-lemonade", name: "Strawberry Lemonade", category: "Drinks", price: 379 },
  { id: "mango-shake", name: "Mango Shake", category: "Drinks", price: 449 },
  { id: "oreo-milkshake", name: "Oreo Milkshake", category: "Drinks", price: 499 },
  { id: "cold-coffee", name: "Cold Coffee", category: "Drinks", price: 449 }
];
