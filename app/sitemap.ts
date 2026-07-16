import type { MetadataRoute } from "next";
import { commercialPrintOrderReady } from "./lib/commercial-license";
import { getCatalog } from "./lib/catalog";

function siteUrl() {
  return new URL(process.env.SITE_URL || "http://localhost:3000");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteUrl();
  const toUrl = (pathname: string) => new URL(pathname, baseUrl).toString();
  const entries: MetadataRoute.Sitemap = [
    { url: toUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: toUrl("/products"), changeFrequency: "weekly", priority: 0.9 },
    { url: toUrl("/policies/shipping"), changeFrequency: "yearly", priority: 0.3 },
    { url: toUrl("/policies/returns"), changeFrequency: "yearly", priority: 0.3 },
    { url: toUrl("/policies/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: toUrl("/policies/terms"), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const { products } = await getCatalog("public");
    const productEntries: MetadataRoute.Sitemap = products
      .filter((product) => (
        !product.demo
        && product.licenseStatus === "active"
        && commercialPrintOrderReady(product)
      ))
      .map((product) => ({
        url: toUrl(`/products/${product.slug}`),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    return [...entries, ...productEntries];
  } catch {
    // Static storefront and policy routes remain discoverable during a catalog outage.
    return entries;
  }
}
