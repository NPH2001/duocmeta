export type ProductVariant = {
  id: string;
  label: string;
  sku: string;
  priceLabel: string;
  statusLabel: string;
};

export type ProductDetail = {
  slug: string;
  name: string;
  brand: string;
  categoryName: string;
  categorySlug: string;
  summary: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  badge: string;
  priceLabel: string;
  imageTone: string;
  highlights: string[];
  variants: ProductVariant[];
};

export const products: ProductDetail[] = [
  {
    slug: "vitamin-c-family-pack",
    name: "Vitamin C Family Pack",
    brand: "Duocmeta Basics",
    categoryName: "Daily Essentials",
    categorySlug: "daily-essentials",
    summary: "Immune support placeholder card ready for backend catalog data.",
    description:
      "A product detail shell for everyday wellness items. The page exposes crawler-friendly product content while backend APIs remain the future source for live pricing, stock, and cart decisions.",
    seoTitle: "Vitamin C Family Pack",
    seoDescription:
      "View Vitamin C Family Pack details with an SEO-friendly product page prepared for variants, gallery, and backend-owned commerce rules.",
    badge: "Daily",
    priceLabel: "Backend priced",
    imageTone: "from-amber-100 via-orange-50 to-white",
    highlights: ["Family routine", "Repeat purchase ready", "Catalog API compatible"],
    variants: [
      { id: "30-tablets", label: "30 tablets", sku: "VC-FAM-30", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "60-tablets", label: "60 tablets", sku: "VC-FAM-60", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "gentle-mineral-sunscreen",
    name: "Gentle Mineral Sunscreen",
    brand: "Careline",
    categoryName: "Daily Essentials",
    categorySlug: "daily-essentials",
    summary: "Product card keeps presentation separate from commerce authority.",
    description:
      "A product detail page designed for clear browsing, rich metadata, and future integration with backend product images, inventory, and variant availability.",
    seoTitle: "Gentle Mineral Sunscreen",
    seoDescription:
      "View Gentle Mineral Sunscreen details with a responsive gallery and variant selection shell.",
    badge: "SPF",
    priceLabel: "Backend priced",
    imageTone: "from-sky-100 via-cyan-50 to-white",
    highlights: ["Daily protection", "Sensitive care", "Variant-ready display"],
    variants: [
      { id: "50ml", label: "50 ml", sku: "SUN-MIN-50", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "100ml", label: "100 ml", sku: "SUN-MIN-100", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "hydration-electrolyte-sachets",
    name: "Hydration Electrolyte Sachets",
    brand: "MetaCare",
    categoryName: "Daily Essentials",
    categorySlug: "daily-essentials",
    summary: "Static listing seed for responsive storefront validation.",
    description:
      "A merchandising-ready product route for hydration products, keeping final totals and stock checks reserved for backend commerce services.",
    seoTitle: "Hydration Electrolyte Sachets",
    seoDescription:
      "View Hydration Electrolyte Sachets details on an SEO-friendly public product page.",
    badge: "Hydration",
    priceLabel: "Backend priced",
    imageTone: "from-emerald-100 via-teal-50 to-white",
    highlights: ["Travel ready", "Fast browsing", "Backend stock authority"],
    variants: [
      { id: "10-pack", label: "10 sachets", sku: "HYD-ELE-10", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "20-pack", label: "20 sachets", sku: "HYD-ELE-20", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "digestive-balance-capsules",
    name: "Digestive Balance Capsules",
    brand: "Clinical House",
    categoryName: "Clinical Picks",
    categorySlug: "clinical-picks",
    summary: "Editorial product summary placeholder for catalog API integration.",
    description:
      "A clinical merchandising detail page with structured sections for usage notes, variants, and future backend-provided attributes.",
    seoTitle: "Digestive Balance Capsules",
    seoDescription:
      "View Digestive Balance Capsules with product detail content prepared for catalog API integration.",
    badge: "Digestive",
    priceLabel: "Backend priced",
    imageTone: "from-lime-100 via-green-50 to-white",
    highlights: ["Clinical category", "Attribute-ready", "SSR product route"],
    variants: [
      { id: "30-capsules", label: "30 capsules", sku: "DIG-BAL-30", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "90-capsules", label: "90 capsules", sku: "DIG-BAL-90", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "magnesium-night-support",
    name: "Magnesium Night Support",
    brand: "RestLab",
    categoryName: "Clinical Picks",
    categorySlug: "clinical-picks",
    summary: "Designed to expose product names and categories to crawlers.",
    description:
      "A product route for sleep-support merchandising with a variant shell and SEO content ready for later live catalog responses.",
    seoTitle: "Magnesium Night Support",
    seoDescription:
      "View Magnesium Night Support details with SEO metadata and variant selection structure.",
    badge: "Sleep",
    priceLabel: "Backend priced",
    imageTone: "from-indigo-100 via-violet-50 to-white",
    highlights: ["Night routine", "Editorial detail", "Future cart compatible"],
    variants: [
      { id: "powder", label: "Powder", sku: "MAG-NIGHT-PWD", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "capsules", label: "Capsules", sku: "MAG-NIGHT-CAP", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "omega-3-softgels",
    name: "Omega-3 Softgels",
    brand: "NutriCore",
    categoryName: "Clinical Picks",
    categorySlug: "clinical-picks",
    summary: "Listing card with no frontend-owned stock or checkout rules.",
    description:
      "A product detail shell for supplement products where price, inventory, and eligibility remain owned by backend APIs.",
    seoTitle: "Omega-3 Softgels",
    seoDescription:
      "View Omega-3 Softgels details on an SEO-friendly product route.",
    badge: "Heart",
    priceLabel: "Backend priced",
    imageTone: "from-rose-100 via-pink-50 to-white",
    highlights: ["Supplement detail", "Backend pricing", "Responsive layout"],
    variants: [
      { id: "60-softgels", label: "60 softgels", sku: "OMG-3-60", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "120-softgels", label: "120 softgels", sku: "OMG-3-120", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "saline-nasal-spray",
    name: "Saline Nasal Spray",
    brand: "BreatheWell",
    categoryName: "Seasonal Care",
    categorySlug: "seasonal-care",
    summary: "Seasonal product placeholder for future public products API data.",
    description:
      "A seasonal product detail page prepared for campaign traffic, SEO indexing, and later catalog API hydration.",
    seoTitle: "Saline Nasal Spray",
    seoDescription:
      "View Saline Nasal Spray details with campaign-ready product content.",
    badge: "Cold",
    priceLabel: "Backend priced",
    imageTone: "from-blue-100 via-slate-50 to-white",
    highlights: ["Seasonal care", "Campaign ready", "API backed later"],
    variants: [
      { id: "single", label: "Single bottle", sku: "SAL-SPR-1", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "twin", label: "Twin pack", sku: "SAL-SPR-2", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "travel-first-aid-kit",
    name: "Travel First Aid Kit",
    brand: "ReadyCare",
    categoryName: "Seasonal Care",
    categorySlug: "seasonal-care",
    summary: "Category card supports campaign browsing without checkout logic.",
    description:
      "A detail page for bundled seasonal products that keeps bundle availability, totals, and ordering rules on backend services.",
    seoTitle: "Travel First Aid Kit",
    seoDescription:
      "View Travel First Aid Kit details with an SEO-friendly storefront product page.",
    badge: "Travel",
    priceLabel: "Backend priced",
    imageTone: "from-stone-200 via-neutral-50 to-white",
    highlights: ["Travel bundle", "Structured detail", "Checkout-safe shell"],
    variants: [
      { id: "compact", label: "Compact kit", sku: "KIT-TRV-CMP", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "family", label: "Family kit", sku: "KIT-TRV-FAM", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
  {
    slug: "after-sun-repair-gel",
    name: "After Sun Repair Gel",
    brand: "SkinMeta",
    categoryName: "Seasonal Care",
    categorySlug: "seasonal-care",
    summary: "Responsive listing item prepared for image and inventory fields.",
    description:
      "A product page with visual gallery placeholders and content blocks ready for image, inventory, and SEO API fields.",
    seoTitle: "After Sun Repair Gel",
    seoDescription:
      "View After Sun Repair Gel details with a responsive product detail shell.",
    badge: "Skin",
    priceLabel: "Backend priced",
    imageTone: "from-orange-100 via-amber-50 to-white",
    highlights: ["Skin recovery", "Gallery-ready", "SEO route"],
    variants: [
      { id: "75ml", label: "75 ml", sku: "SUN-GEL-75", priceLabel: "Backend priced", statusLabel: "API pending" },
      { id: "150ml", label: "150 ml", sku: "SUN-GEL-150", priceLabel: "Backend priced", statusLabel: "API pending" },
    ],
  },
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
