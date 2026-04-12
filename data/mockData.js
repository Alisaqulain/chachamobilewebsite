/** Premium storefront mock catalogue (frontend demo). */

export const BRAND_MODELS = {
  Apple: ["iPhone 15 Pro", "iPhone 14", "iPhone 13", "iPhone 12"],
  Samsung: ["Galaxy S24 Ultra", "Galaxy A55", "Galaxy M34"],
  Vivo: ["V29 Pro", "V27", "Y200"],
  Oppo: ["Reno 11", "F25 Pro", "A79"],
  Xiaomi: ["14 Ultra", "Redmi Note 13", "POCO X6"],
};

export const MOCK_CATEGORIES = [
  "Display",
  "Battery",
  "Charging",
  "Camera",
  "Speaker",
  "Body",
];

const U = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1601784555128-393f09b9b0a5?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1583394837333-0879db6f85fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1556656793-08538906a9fa?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1609091839311-5367944d3491?auto=format&fit=crop&w=900&q=80",
];

const pick = (i) => [U[i % U.length]];

export const MOCK_PRODUCTS = [
  {
    _id: "mock-1",
    name: "AMOLED Display Assembly — iPhone 15 Pro",
    brand: "Apple",
    model: "iPhone 15 Pro",
    category: "Display",
    quality: "Original",
    price: 18999,
    featured: true,
    images: pick(0),
    description:
      "Premium OLED panel with True Tone support. Factory-grade adhesive frame included for professional fitment.",
  },
  {
    _id: "mock-2",
    name: "Li-Ion Battery — Galaxy S24 Ultra",
    brand: "Samsung",
    model: "Galaxy S24 Ultra",
    category: "Battery",
    quality: "Original",
    price: 3499,
    featured: true,
    images: pick(1),
    description: "OEM-class cell with BMS protection. Zero-cycle stock for technicians.",
  },
  {
    _id: "mock-3",
    name: "USB-C Charge Port Flex — V29 Pro",
    brand: "Vivo",
    model: "V29 Pro",
    category: "Charging",
    quality: "High",
    price: 890,
    featured: true,
    images: pick(2),
    description: "Fast-charge capable flex. Mic and secondary sensors routed.",
  },
  {
    _id: "mock-4",
    name: "Rear Camera Module — Reno 11",
    brand: "Oppo",
    model: "Reno 11",
    category: "Camera",
    quality: "Original",
    price: 6200,
    featured: true,
    images: pick(3),
    description: "50MP main + ultrawide assembly. AF calibration ready.",
  },
  {
    _id: "mock-5",
    name: "Earpiece + Proximity Flex — iPhone 14",
    brand: "Apple",
    model: "iPhone 14",
    category: "Speaker",
    quality: "High",
    price: 650,
    featured: false,
    images: pick(4),
    description: "Combined earpiece mesh and proximity sensor cable.",
  },
  {
    _id: "mock-6",
    name: "Back Glass Panel — iPhone 13",
    brand: "Apple",
    model: "iPhone 13",
    category: "Body",
    quality: "High",
    price: 1200,
    featured: false,
    images: pick(5),
    description: "Matte frosted finish with camera lens rings pre-installed.",
  },
  {
    _id: "mock-7",
    name: "Super AMOLED — Galaxy A55",
    brand: "Samsung",
    model: "Galaxy A55",
    category: "Display",
    quality: "High",
    price: 5200,
    featured: true,
    images: pick(0),
    description: "120Hz capable panel with digitizer bonded.",
  },
  {
    _id: "mock-8",
    name: "Battery — Redmi Note 13",
    brand: "Xiaomi",
    model: "Redmi Note 13",
    category: "Battery",
    quality: "Original",
    price: 1299,
    featured: false,
    images: pick(1),
    description: "5000mAh rated capacity. BIS compatible batch.",
  },
  {
    _id: "mock-9",
    name: "Main Flex + Power — POCO X6",
    brand: "Xiaomi",
    model: "POCO X6",
    category: "Charging",
    quality: "Low",
    price: 450,
    featured: false,
    images: pick(2),
    description: "Power volume combo flex with charge sub-board link.",
  },
  {
    _id: "mock-10",
    name: "Front Camera — iPhone 12",
    brand: "Apple",
    model: "iPhone 12",
    category: "Camera",
    quality: "Original",
    price: 2800,
    featured: false,
    images: pick(3),
    description: "TrueDepth compatible front module with ambient sensor.",
  },
  {
    _id: "mock-11",
    name: "Loudspeaker — Galaxy M34",
    brand: "Samsung",
    model: "Galaxy M34",
    category: "Speaker",
    quality: "High",
    price: 380,
    featured: false,
    images: pick(4),
    description: "Bottom firing buzzer with gasket seal.",
  },
  {
    _id: "mock-12",
    name: "Mid-Frame Chassis — Y200",
    brand: "Vivo",
    model: "Y200",
    category: "Body",
    quality: "Low",
    price: 890,
    featured: false,
    images: pick(5),
    description: "Side keys and SIM tray cutouts included.",
  },
];

export function getMockProduct(id) {
  return MOCK_PRODUCTS.find((p) => p._id === id) || null;
}

export function filterMockProducts({ brand, model, category, search }) {
  return MOCK_PRODUCTS.filter((p) => {
    if (brand && p.brand !== brand) return false;
    if (model && p.model !== model) return false;
    if (category && p.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !p.name.toLowerCase().includes(q) &&
        !p.model.toLowerCase().includes(q) &&
        !p.brand.toLowerCase().includes(q)
      ) {
        return false;
      }
    }
    return true;
  });
}
