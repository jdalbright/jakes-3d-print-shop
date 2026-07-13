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
];
