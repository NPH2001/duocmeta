export type ProductSummary = {
  slug: string;
  name: string;
  summary: string;
  brand: string;
  priceLabel: string;
  badge: string;
};

export type Category = {
  slug: string;
  name: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  productCount: number;
  filters: string[];
  products: ProductSummary[];
};

export const categories: Category[] = [
  {
    slug: "daily-essentials",
    name: "Daily Essentials",
    description:
      "Everyday health and wellness products organized for quick repeat purchases.",
    seoTitle: "Daily Essentials",
    seoDescription:
      "Browse daily essentials with SEO-friendly category structure, filters, sorting, and pagination shell.",
    productCount: 24,
    filters: ["In stock", "Vitamins", "Personal care", "Family use"],
    products: [
      {
        slug: "vitamin-c-family-pack",
        name: "Vitamin C Family Pack",
        summary: "Immune support placeholder card ready for backend catalog data.",
        brand: "Duocmeta Basics",
        priceLabel: "Backend priced",
        badge: "Daily",
      },
      {
        slug: "gentle-mineral-sunscreen",
        name: "Gentle Mineral Sunscreen",
        summary: "Product card keeps presentation separate from commerce authority.",
        brand: "Careline",
        priceLabel: "Backend priced",
        badge: "SPF",
      },
      {
        slug: "hydration-electrolyte-sachets",
        name: "Hydration Electrolyte Sachets",
        summary: "Static listing seed for responsive storefront validation.",
        brand: "MetaCare",
        priceLabel: "Backend priced",
        badge: "Hydration",
      },
    ],
  },
  {
    slug: "clinical-picks",
    name: "Clinical Picks",
    description:
      "Curated category surface for pharmacist-led merchandising and educational buying paths.",
    seoTitle: "Clinical Picks",
    seoDescription:
      "Explore clinical picks with SSR-ready category browsing and ecommerce-safe product cards.",
    productCount: 18,
    filters: ["Pharmacist pick", "Digestive care", "Sleep support", "Heart health"],
    products: [
      {
        slug: "digestive-balance-capsules",
        name: "Digestive Balance Capsules",
        summary: "Editorial product summary placeholder for catalog API integration.",
        brand: "Clinical House",
        priceLabel: "Backend priced",
        badge: "Digestive",
      },
      {
        slug: "magnesium-night-support",
        name: "Magnesium Night Support",
        summary: "Designed to expose product names and categories to crawlers.",
        brand: "RestLab",
        priceLabel: "Backend priced",
        badge: "Sleep",
      },
      {
        slug: "omega-3-softgels",
        name: "Omega-3 Softgels",
        summary: "Listing card with no frontend-owned stock or checkout rules.",
        brand: "NutriCore",
        priceLabel: "Backend priced",
        badge: "Heart",
      },
    ],
  },
  {
    slug: "seasonal-care",
    name: "Seasonal Care",
    description:
      "Campaign-ready category page for seasonal needs, landing content, and rotating assortment.",
    seoTitle: "Seasonal Care",
    seoDescription:
      "Shop seasonal care products through a responsive category page prepared for filters and pagination.",
    productCount: 15,
    filters: ["Cold season", "Travel", "Skin recovery", "Allergy care"],
    products: [
      {
        slug: "saline-nasal-spray",
        name: "Saline Nasal Spray",
        summary: "Seasonal product placeholder for future public products API data.",
        brand: "BreatheWell",
        priceLabel: "Backend priced",
        badge: "Cold",
      },
      {
        slug: "travel-first-aid-kit",
        name: "Travel First Aid Kit",
        summary: "Category card supports campaign browsing without checkout logic.",
        brand: "ReadyCare",
        priceLabel: "Backend priced",
        badge: "Travel",
      },
      {
        slug: "after-sun-repair-gel",
        name: "After Sun Repair Gel",
        summary: "Responsive listing item prepared for image and inventory fields.",
        brand: "SkinMeta",
        priceLabel: "Backend priced",
        badge: "Skin",
      },
    ],
  },
];

export function getCategoryBySlug(slug: string) {
  return categories.find((category) => category.slug === slug);
}
