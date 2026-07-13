import type { StoreProduct } from "./types";

export const demoProducts: StoreProduct[] = [
  {
    id: "demo-onami-2",
    slug: "onami-2-headphone-stand",
    name: "Onami 2 Headphone Stand",
    description:
      "A sculptural, wave-inspired stand with a broad curved cradle that keeps over-ear headphones supported and easy to reach.",
    category: "Desk",
    colors: ["Slate Blue", "Graphite", "Warm Sand"],
    featured: true,
    pickup: true,
    ship: true,
    stockStatus: "made_to_order",
    image: "/products/onami-2-headphone-stand-hero-v3.png",
    images: [
      "/products/onami-2-headphone-stand-hero-v3.png",
      "/products/onami-2-headphone-stand-rear-v3.png",
      "/products/onami-2-headphone-stand-detail-v3.png",
    ],
    accent: "ocean",
    colorHexes: ["#71839a", "#414844", "#cdbb97"],
    detailCopy:
      "The Onami 2 turns a functional desktop stand into a calm, wave-like form. Its widened top spreads pressure across the headband, while the open base keeps the footprint light and stable.",
    highlights: [
      "Wide rounded support for over-ear headbands",
      "Continuous wave channels from base to cradle",
      "Stable cantilevered footprint",
      "Optional silicone feet for added grip",
    ],
    material: "Matte PLA",
    finish: "Fine visible print layers with hand-checked support surfaces",
    care: "Wipe with a soft, damp cloth. Keep away from sustained heat and direct sunlight.",
    leadTime: "Printed to order in 3–5 business days",
    designerName: "Meyui",
    designerUrl: "https://makerworld.com/en/@Meyui",
    sourceModelUrl:
      "https://makerworld.com/en/models/2979027-onami-2-headphone-stand#profileId-3342100",
    licenseStatus: "pending",
    demo: true,
    variants: [
      {
        priceId: "demo_onami2_standard",
        sizeLabel: "Standard",
        unitAmount: 3400,
        currency: "usd",
        sku: "ONAMI2-STD",
      },
    ],
  },
  {
    id: "demo-japandi-paper-towel-holder",
    slug: "japandi-paper-towel-holder",
    name: "Japandi Paper Towel Holder",
    description:
      "A sculptural countertop holder that keeps a paper towel roll contained while leaving the next sheet easy to reach.",
    category: "Home",
    colors: ["Warm Sand", "Cocoa", "Matte White"],
    featured: true,
    pickup: true,
    ship: true,
    stockStatus: "made_to_order",
    image: "/products/japandi-paper-towel-holder-hero-v1.png",
    images: [
      "/products/japandi-paper-towel-holder-hero-v1.png",
      "/products/japandi-paper-towel-holder-empty-v1.png",
      "/products/japandi-paper-towel-holder-detail-v1.png",
    ],
    accent: "clay",
    colorHexes: ["#cbb89d", "#705546", "#ece8df"],
    detailCopy:
      "The Japandi holder turns an everyday kitchen roll into a calmer countertop object. Its ribbed outer sleeve adds grip and texture, while the open front keeps the working edge visible and accessible.",
    highlights: [
      "Open front keeps the next sheet within reach",
      "Ribbed sleeve gives the roll a finished silhouette",
      "Standard and XL options for different roll sizes",
      "Optional foam feet can add countertop grip",
    ],
    material: "Matte PLA",
    finish: "Fine vertical ribbing with hand-checked edges and surfaces",
    care: "Wipe with a soft, damp cloth. Do not place in a dishwasher or near sustained heat.",
    leadTime: "Printed to order in 3–5 business days",
    designerName: "SabreDesign",
    designerUrl: "https://makerworld.com/en/@SabreDesign",
    sourceModelUrl:
      "https://makerworld.com/en/models/1455387-paper-towel-holder-stand-japandi#profileId-1516726",
    licenseStatus: "pending",
    demo: true,
    variants: [
      {
        priceId: "demo_japandi_paper_towel_standard",
        sizeLabel: "Standard",
        unitAmount: 3500,
        currency: "usd",
        sku: "JPT-STANDARD",
        dimensions: "Fits rolls up to 4.4 in diameter · 7 in tall",
      },
      {
        priceId: "demo_japandi_paper_towel_xl",
        sizeLabel: "XL",
        unitAmount: 4500,
        currency: "usd",
        sku: "JPT-XL",
        dimensions: "Fits rolls up to 5.9 in diameter · 7.6 in tall",
      },
    ],
  },
];
