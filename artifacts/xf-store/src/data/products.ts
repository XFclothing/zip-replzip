// ─── HELPER: color galleries ────────────────────────────────
const teeGallery = {
  black: [
    "/images/product-tee-black.png",
    "/images/product-tee-black-back.png",
  ],
  grey: [
    "/images/product-tee-grey.png",
    "/images/product-tee-grey-back.png",
  ],
  white: [
    "/images/product-tee-white.png",
    "/images/product-tee-white-back.png",
  ],
};

const hoodieGallery = {
  black: [
    "/images/product-hoodie-black.png",
    "/images/product-hoodie-black-back.png",
    "/images/product-hoodie-black-flat.png",
  ],
  grey: [
    "/images/product-hoodie-grey.png",
    "/images/product-hoodie-grey-flat.png",
  ],
  white: [
    "/images/product-hoodie-white.png",
    "/images/product-hoodie-white-back.png",
    "/images/product-hoodie-white-flat.png",
  ],
};

const joggerGallery = {
  black: [
    "/images/product-jogger-black.png",
    "/images/product-jogger-black-flat.png",
  ],
  grey: [
    "/images/product-jogger-grey.png",
    "/images/product-jogger-grey-flat.png",
  ],
  white: [
    "/images/product-jogger-white.png",
  ],
};

const baggyJoggerGallery = {
  black: [
    "/images/product-jogger-baggy.avif",
    "/images/product-jogger-black.png",
    "/images/product-jogger-black-flat.png",
  ],
  grey: [
    "/images/product-jogger-grey.png",
    "/images/product-jogger-grey-flat.png",
  ],
  white: [
    "/images/product-jogger-white.png",
  ],
};

const slimJoggerGallery = {
  black: [
    "/images/product-jogger-slim.avif",
    "/images/product-jogger-black.png",
    "/images/product-jogger-black-flat.png",
  ],
  grey: [
    "/images/product-jogger-grey.png",
    "/images/product-jogger-grey-flat.png",
  ],
  white: [
    "/images/product-jogger-white.png",
  ],
};

const openHemGallery = {
  black: [
    "/images/product-jogger-openhemm-black.png",
    "/images/product-jogger-openhem-black-flat.png",
  ],
  grey: [
    "/images/product-jogger-openhem-grey.png",
    "/images/product-jogger-openhem-grey-flat.png",
  ],
  white: [
    "/images/product-jogger-openhem-white.png",
    "/images/product-jogger-openhem-white-flat.png",
  ],
};

// ─── SHARED COLOR DEFINITIONS ───────────────────────────────
function teeColors(defaultColor: "black" | "white") {
  return [
    { name: "Black", value: "#1a1a1a", image: "/images/product-tee-black.png", gallery: teeGallery.black },
    { name: "Grey",  value: "#888888", image: "/images/product-tee-grey.png",  gallery: teeGallery.grey  },
    { name: "White", value: "#f5f5f5", image: "/images/product-tee-white.png", gallery: teeGallery.white },
  ];
}

function hoodieColors() {
  return [
    { name: "Black", value: "#1a1a1a", image: "/images/product-hoodie-black.png", gallery: hoodieGallery.black },
    { name: "Grey",  value: "#888888", image: "/images/product-hoodie-grey.png",  gallery: hoodieGallery.grey  },
    { name: "White", value: "#f5f5f5", image: "/images/product-hoodie-white.png", gallery: hoodieGallery.white },
  ];
}

function joggerColors() {
  return [
    { name: "Black", value: "#1a1a1a", image: "/images/product-jogger-black.png", gallery: joggerGallery.black },
    { name: "Grey",  value: "#888888", image: "/images/product-jogger-grey.png",  gallery: joggerGallery.grey  },
    { name: "White", value: "#f5f5f5", image: "/images/product-jogger-white.png", gallery: joggerGallery.white },
  ];
}

function openHemColors() {
  return [
    { name: "Black", value: "#1a1a1a", image: "/images/product-jogger-openhemm-black.png", gallery: openHemGallery.black },
    { name: "Grey",  value: "#888888", image: "/images/product-jogger-openhem-grey.png",   gallery: openHemGallery.grey  },
    { name: "White", value: "#f5f5f5", image: "/images/product-jogger-openhem-white.png",  gallery: openHemGallery.white },
  ];
}

// ─── FEATURED ───────────────────────────────────────────────
export const featured = [
  {
    id: "xf-tee-essential",
    name: "XF Essential Tee",
    category: "tshirt",
    price: 35,
    description: "Regular Fit. Classic cut for everyday wear. 100% Heavyweight Cotton. Unisex.",
    image: "/images/product-tee-white.png",
    sizes: ["S", "M", "L", "XL"],
    colors: teeColors("white"),
  },
  {
    id: "xf-jogger-baggy",
    name: "XF JOGGER Baggy Fit",
    category: "jogger",
    price: 50,
    description: "Baggy Fit. Very wide cut — pure streetwear style. Soft Fleece Interior. Unisex.",
    image: "/images/product-jogger-baggy.avif",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Black", value: "#1a1a1a", image: "/images/product-jogger-baggy.avif", gallery: baggyJoggerGallery.black },
      { name: "Grey",  value: "#888888", image: "/images/product-jogger-grey.png",   gallery: baggyJoggerGallery.grey  },
      { name: "White", value: "#f5f5f5", image: "/images/product-jogger-white.png",  gallery: baggyJoggerGallery.white },
    ],
  },
];

export const products = [
  ...featured,

  // ─── T-SHIRTS ───────────────────────────────────────────────
  {
    id: "xf-tee-slim",
    name: "XF Slim Fit Tee",
    category: "tshirt",
    price: 33,
    description: "Slim Fit. Close to the body — athletic look. 100% Heavyweight Cotton.",
    image: "/images/product-tee-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: teeColors("black"),
  },
  {
    id: "xf-tee-relaxed",
    name: "XF Relaxed Fit Tee",
    category: "tshirt",
    price: 35,
    description: "Relaxed Fit. Slightly wider than regular — comfortable and easy-going. 100% Heavyweight Cotton.",
    image: "/images/product-tee-white.png",
    sizes: ["S", "M", "L", "XL"],
    colors: teeColors("white"),
  },
  {
    id: "xf-tee-oversized",
    name: "XF Oversize Tee",
    category: "tshirt",
    price: 38,
    description: "Oversized Fit. Very wide cut — pure streetwear style. 100% Heavyweight Cotton.",
    image: "/images/product-tee-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: teeColors("black"),
  },
  {
    id: "xf-tee-boxy",
    name: "XF Boxy Fit Tee",
    category: "tshirt",
    price: 38,
    description: "Boxy Fit. Wide and cropped — modern fashion look. 100% Heavyweight Cotton.",
    image: "/images/product-tee-white.png",
    sizes: ["S", "M", "L", "XL"],
    colors: teeColors("white"),
  },
  {
    id: "xf-tee-longline",
    name: "XF Longline Tee",
    category: "tshirt",
    price: 40,
    description: "Longline Cut. Longer than usual — urban and bold. 100% Heavyweight Cotton.",
    image: "/images/product-tee-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: teeColors("black"),
  },

  // ─── HOODIES ────────────────────────────────────────────────
  {
    id: "xf-hoodie-oversized",
    name: "XF Oversize Hoodie",
    category: "hoodie",
    price: 60,
    description: "Oversized Fit. Big and roomy — streetwear statement. Heavy Cotton. Premium Quality.",
    image: "/images/product-hoodie-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: hoodieColors(),
  },
  {
    id: "xf-hoodie-slim",
    name: "XF Slim Fit Hoodie",
    category: "hoodie",
    price: 55,
    description: "Slim Fit. Close to the body — athletic look. Heavy Cotton. Premium Quality.",
    image: "/images/product-hoodie-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: hoodieColors(),
  },
  {
    id: "xf-hoodie-boxy",
    name: "XF Boxy Hoodie",
    category: "hoodie",
    price: 58,
    description: "Boxy Fit. Wide and cropped — modern look. Heavy Cotton. Premium Quality.",
    image: "/images/product-hoodie-grey.png",
    sizes: ["S", "M", "L", "XL"],
    colors: hoodieColors(),
  },
  {
    id: "xf-hoodie-cropped",
    name: "XF Cropped Hoodie",
    category: "hoodie",
    price: 52,
    description: "Cropped Fit. Short cut — trendy fashion piece. Heavy Cotton. Premium Quality.",
    image: "/images/product-hoodie-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: hoodieColors(),
  },

  // ─── JOGGER ─────────────────────────────────────────────────
  {
    id: "xf-jogger-openhem",
    name: "XF JOGGER Open Hem",
    category: "jogger",
    price: 45,
    description: "Open Hem. No elastic at the bottom — loose and wide. Soft Fleece Interior. Streetwear Style.",
    image: "/images/product-jogger-openhemm-black.png",
    sizes: ["S", "M", "L", "XL"],
    colors: openHemColors(),
  },
  {
    id: "xf-jogger-slim",
    name: "XF JOGGER Slim Fit",
    category: "jogger",
    price: 35,
    description: "Slim Fit. Close to the leg — athletic and modern. Soft Fleece Interior.",
    image: "/images/product-jogger-slim.avif",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Black", value: "#1a1a1a", image: "/images/product-jogger-slim.avif", gallery: slimJoggerGallery.black },
      { name: "Grey",  value: "#888888", image: "/images/product-jogger-grey.png",  gallery: slimJoggerGallery.grey  },
      { name: "White", value: "#f5f5f5", image: "/images/product-jogger-white.png", gallery: slimJoggerGallery.white },
    ],
  },
];
