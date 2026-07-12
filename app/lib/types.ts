export type Fulfillment = "shipping" | "pickup";

export type ProductVariant = {
  priceId: string;
  sizeLabel: string;
  unitAmount: number;
  currency: "usd";
  sku: string;
};

export type StoreProduct = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  colors: string[];
  featured: boolean;
  pickup: boolean;
  ship: boolean;
  stockStatus: "in_stock" | "made_to_order" | "sold_out";
  image: string | null;
  accent: string;
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
  sizeLabel: string;
  quantity: number;
  unitAmount: number;
  image: string | null;
  accent: string;
  pickup: boolean;
  ship: boolean;
};
