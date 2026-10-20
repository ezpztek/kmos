export const products = {
  "market-day-tote": {
    category: "KMOS EDIT", name: "Market Day Tote", price: 850,
    description: "A roomy everyday carry made for market mornings, quick errands, and everything in between.",
    ordersUntil: "2026-10-31",
    sizes: ["One Size"], views: ["tote", "cap", "pouch"],
    colors: [["Orange", "art-orange", "#df8333"], ["Forest", "art-green", "#347362"], ["Natural", "art-cream", "#e9d6b9"]]
  },
  "daily-glow-pair": {
    category: "BEAUTY", name: "Daily Glow Pair", price: 690,
    description: "A simple two-step skin-care pairing designed for an easy, fresh-looking daily routine.",
    ordersUntil: "2026-11-05",
    sizes: ["30 ml", "50 ml"], views: ["glow", "home", "bottle"],
    colors: [["Forest", "art-green", "#347362"], ["Teal", "art-teal", "#67aaa3"], ["Peach", "art-peach", "#e7a776"]]
  },
  "pantry-starter-set": {
    category: "K-PANTRY", name: "Pantry Starter Set", price: 520,
    description: "Everyday pantry favorites grouped into one practical starter set for the home.",
    ordersUntil: "2026-11-15",
    sizes: ["Regular", "Family"], views: ["pantry", "cup", "tote"],
    colors: [["Natural", "art-cream", "#e9d6b9"], ["Orange", "art-orange", "#df8333"], ["Forest", "art-green", "#347362"]]
  },
  "weekend-cap": {
    category: "STYLE", name: "Weekend Cap", price: 450,
    description: "An easy everyday cap with a clean shape and relaxed fit for sunny market runs.",
    ordersUntil: "2026-11-30",
    sizes: ["S/M", "L/XL"], views: ["cap", "bottle", "tote"],
    colors: [["Teal", "art-teal", "#67aaa3"], ["Forest", "art-green", "#347362"], ["Orange", "art-orange", "#df8333"]]
  },
  "little-home-reset": {
    category: "HOME", name: "Little Home Reset", price: 720,
    description: "A calm little pairing for refreshing a shelf, desk, or favorite corner at home.",
    sizes: ["Small", "Large"], views: ["home", "pantry", "candle"],
    colors: [["Peach", "art-peach", "#e7a776"], ["Natural", "art-cream", "#e9d6b9"], ["Forest", "art-green", "#347362"]]
  },
  "soft-carry-pouch": {
    category: "ACCESSORIES", name: "Soft Carry Pouch", price: 480,
    description: "A compact soft pouch for daily basics, small finds, and on-the-go essentials.",
    sizes: ["Mini", "Regular"], views: ["pouch", "cap", "tote"],
    colors: [["Teal", "art-teal", "#67aaa3"], ["Orange", "art-orange", "#df8333"], ["Natural", "art-cream", "#e9d6b9"]]
  },
  "morning-cup-set": {
    category: "K-PANTRY", name: "Morning Cup Set", price: 390,
    description: "A cheerful cup set for slow mornings, quick coffee breaks, and shared snacks.",
    sizes: ["Set of 2", "Set of 4"], views: ["cup", "pantry", "home"],
    colors: [["Natural", "art-cream", "#e9d6b9"], ["Peach", "art-peach", "#e7a776"], ["Teal", "art-teal", "#67aaa3"]]
  },
  "everyday-tee": {
    category: "STYLE", name: "Everyday Tee", price: 650,
    description: "A comfortable staple tee with an unfussy shape made for repeat wear.",
    sizes: ["S", "M", "L", "XL"], views: ["tee", "tote", "cap"],
    colors: [["Orange", "art-orange", "#df8333"], ["Forest", "art-green", "#347362"], ["Natural", "art-cream", "#e9d6b9"]]
  },
  "easy-market-bag": {
    category: "KMOS EDIT · SALE", name: "Easy Market Bag", price: 699,
    description: "A lightweight market bag with space for spontaneous finds and everyday carry.",
    sizes: ["One Size"], views: ["tote", "cap", "pouch"],
    colors: [["Orange", "art-orange", "#df8333"], ["Teal", "art-teal", "#67aaa3"]]
  },
  "home-pair": {
    category: "HOME · SALE", name: "Home Pair", price: 599,
    description: "Two small home accents selected to bring warmth and balance to compact spaces.",
    sizes: ["Small", "Large"], views: ["home", "bottle", "candle"],
    colors: [["Forest", "art-green", "#347362"], ["Peach", "art-peach", "#e7a776"]]
  },
  "pantry-pack": {
    category: "K-PANTRY · SALE", name: "Pantry Pack", price: 449,
    description: "A value pack of pantry basics ready for easy weekday meals and shared moments.",
    sizes: ["Regular", "Family"], views: ["pantry", "cup", "tote"],
    colors: [["Natural", "art-cream", "#e9d6b9"], ["Orange", "art-orange", "#df8333"]]
  },
  "glow-duo": {
    category: "BEAUTY · SALE", name: "Glow Duo", price: 549,
    description: "A paired beauty edit for a quick, uncomplicated boost to the daily routine.",
    sizes: ["30 ml", "50 ml"], views: ["glow", "pouch", "bottle"],
    colors: [["Teal", "art-teal", "#67aaa3"], ["Peach", "art-peach", "#e7a776"]]
  }
};

export const productGroups = {
  limited: ["market-day-tote", "daily-glow-pair", "pantry-starter-set", "weekend-cap"],
  popular: ["little-home-reset", "soft-carry-pouch", "morning-cup-set", "everyday-tee"],
  sale: ["easy-market-bag", "home-pair", "pantry-pack", "glow-duo"]
};

export const money = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
