export type Fulfillment = "shipping" | "pickup";
export type ProductLicenseStatus = "pending" | "active" | "expired" | "not_required";
export type CatalogVisibility = "public" | "office";
export type OfficeFulfillment = "take_now" | "work_delivery";

export type ProductVariant = {
  priceId: string;
  sizeLabel: string;
  unitAmount: number;
  currency: "usd";
  sku: string;
  dimensions?: string;
  minQuantity?: number;
  maxQuantity?: number;
};

export type ProductColorway = {
  label: string;
  baseColor: string;
  baseHex: string;
  capColor: string;
  capHex: string;
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  colors: string[];
  colorways?: ProductColorway[];
  featured: boolean;
  pickup: boolean;
  ship: boolean;
  stockStatus: "in_stock" | "made_to_order" | "sold_out";
  visibility: CatalogVisibility;
  officeFulfillment?: OfficeFulfillment;
  photoReady: boolean;
  image: string | null;
  images: string[];
  accent: string;
  colorHexes: string[];
  detailCopy: string;
  highlights: string[];
  fitNote?: string;
  material: string;
  finish: string;
  care: string;
  leadTime: string;
  designerName?: string;
  designerUrl?: string;
  sourceModelUrl?: string;
  requiresCommercialLicense?: boolean;
  licenseStatus: ProductLicenseStatus;
  previewOnly?: boolean;
  pricingPending?: boolean;
  previewMessage?: string;
  variants: ProductVariant[];
  demo?: boolean;
};

export type CatalogResult = {
  products: StoreProduct[];
  source: "stripe" | "demo";
  checkoutEnabled: boolean;
};

export type CartItem = {
  priceId: string;
  productId: string;
  slug: string;
  name: string;
  color: string;
  colorDetail?: string;
  sizeLabel: string;
  quantity: number;
  unitAmount: number;
  image: string | null;
  accent: string;
  pickup: boolean;
  ship: boolean;
  minQuantity?: number;
  maxQuantity?: number;
};
