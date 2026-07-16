import type { StoreProduct } from "./types";

type CommercialLicenseGate = Pick<
  StoreProduct,
  "requiresCommercialLicense" | "licenseStatus" | "photoReady" | "previewOnly" | "previewMessage"
>;

type StorefrontStatusProduct = CommercialLicenseGate & Pick<StoreProduct, "stockStatus">;

export function commercialPrintOrderReady(product: CommercialLicenseGate) {
  if (product.previewOnly) return false;
  if (!product.requiresCommercialLicense) return true;
  return product.licenseStatus === "active" && product.photoReady;
}

export function commercialPrintPreviewMessage(product: CommercialLicenseGate) {
  if (product.previewOnly) {
    return product.previewMessage || "Preview only—this product is still being finalized.";
  }
  if (!product.requiresCommercialLicense || commercialPrintOrderReady(product)) return "";
  if (product.licenseStatus !== "active") {
    return "Preview only—commercial licensing is being completed before ordering opens.";
  }
  if (!product.photoReady) {
    return "Preview only—original product photography is in progress.";
  }
  return "Preview only—commercial listing details are still being finalized.";
}

export function storefrontProductStatus(product: StorefrontStatusProduct) {
  if (commercialPrintPreviewMessage(product)) return "Preview only";
  if (product.stockStatus === "sold_out") return "Sold out";
  if (product.stockStatus === "in_stock") return "Ready soon";
  return "Made to order";
}

export function commercialMetadataOrderReady(metadata: Record<string, string | undefined>) {
  return commercialPrintOrderReady({
    requiresCommercialLicense: Boolean(metadata.license_provider),
    licenseStatus:
      metadata.license_status === "active" ||
      metadata.license_status === "expired" ||
      metadata.license_status === "not_required"
        ? metadata.license_status
        : "pending",
    photoReady: metadata.photo_status === "ready",
    previewOnly: metadata.preview_only === "true",
  });
}
