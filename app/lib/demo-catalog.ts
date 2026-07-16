import type { StoreProduct } from "./types";
import { sabreDesignPaperTowelHolderImages } from "./sabredesign-media";

const baseDemoProducts: StoreProduct[] = [
  {
    id: "demo-japandi-paper-towel-holder",
    slug: "japandi-paper-towel-holder",
    name: "Japandi Paper Towel Holder",
    description:
      "A sculptural countertop holder that keeps a paper towel roll contained while leaving the next sheet easy to reach.",
    category: "Home",
    colors: [
      "Matte Ivory White (11100)",
      "Matte Desert Tan (11401)",
      "Matte Dark Brown (11801)",
      "Matte Charcoal (11101)",
    ],
    featured: true,
    pickup: true,
    ship: true,
    stockStatus: "made_to_order",
    visibility: "public",
    photoReady: true,
    image: sabreDesignPaperTowelHolderImages[0],
    images: [...sabreDesignPaperTowelHolderImages],
    accent: "clay",
    colorHexes: ["#ffffff", "#e8dbb7", "#7d6556", "#000000"],
    detailCopy:
      "The Japandi holder turns an everyday kitchen roll into a calmer countertop object. Its ribbed outer sleeve adds grip and texture, while the open front keeps the working edge visible and accessible.",
    highlights: [
      "Open front keeps the next sheet within reach",
      "Ribbed sleeve gives the roll a finished silhouette",
      "Standard and jumbo options for different roll sizes",
      "Optional foam feet can add countertop grip",
    ],
    fitNote:
      "Measure your unopened roll at its widest point. Standard Roll fits up to 4.4 in (113 mm); Jumbo / Warehouse Roll fits up to 5.9 in (150 mm).",
    material: "Bambu PLA Matte",
    finish: "Fine vertical ribbing with hand-checked edges and surfaces",
    care: "Wipe with a soft, damp cloth. Do not place in a dishwasher or near sustained heat.",
    leadTime: "Printed to order in 3–5 business days",
    designerName: "SabreDesign",
    designerUrl: "https://makerworld.com/en/@SabreDesign",
    sourceModelUrl:
      "https://makerworld.com/en/models/1455387-paper-towel-holder-stand-japandi#profileId-1516726",
    requiresCommercialLicense: true,
    licenseStatus: "active",
    demo: false,
    variants: [
      {
        priceId: "demo_japandi_paper_towel_standard",
        sizeLabel: "Standard Roll",
        unitAmount: 3900,
        currency: "usd",
        sku: "JPT-STANDARD",
        dimensions: "Fits rolls up to 4.4 in (113 mm) diameter · 7 in tall",
      },
      {
        priceId: "demo_japandi_paper_towel_xl",
        sizeLabel: "Jumbo / Warehouse Roll",
        unitAmount: 5200,
        currency: "usd",
        sku: "JPT-XL",
        dimensions: "Fits rolls up to 5.9 in (150 mm) diameter · 7.6 in tall",
      },
    ],
  },
];

export const officeDemoProducts: StoreProduct[] = [
  {
    id: "demo-office-keychain-rack",
    slug: "office-keychain-rack",
    name: "Keychain from the Rack",
    description: "Pay online, then take any one keychain that is physically available on the rack.",
    category: "Office rack",
    colors: ["Any available"],
    featured: false,
    pickup: true,
    ship: false,
    stockStatus: "in_stock",
    visibility: "office",
    officeFulfillment: "take_now",
    photoReady: false,
    image: "/products/office-keychain-assortment-illustration-v1.png",
    images: ["/products/office-keychain-assortment-illustration-v1.png"],
    accent: "yellow",
    colorHexes: ["#e5bd4d"],
    detailCopy: "Choose from what is on the rack, pay here, and take it with you. No confirmation screen needs to be shown.",
    highlights: [
      "Any physically available rack design",
      "Immediate honor-system pickup",
      "Designed and printed by Jake",
    ],
    material: "PLA",
    finish: "Small-batch print, checked before it reaches the rack",
    care: "Keep away from sustained heat.",
    leadTime: "Available immediately while rack stock lasts",
    licenseStatus: "not_required",
    demo: true,
    variants: [
      {
        priceId: "demo_office_keychain",
        sizeLabel: "One keychain",
        unitAmount: 500,
        currency: "usd",
        sku: "OFFICE-KEYCHAIN",
        minQuantity: 1,
        maxQuantity: 1,
      },
      {
        priceId: "demo_office_keychain_multi",
        sizeLabel: "Two or more keychains",
        unitAmount: 400,
        currency: "usd",
        sku: "OFFICE-KEYCHAIN-MULTI",
        minQuantity: 2,
        maxQuantity: 10,
      },
    ],
  },
];

export const demoProducts = baseDemoProducts;
