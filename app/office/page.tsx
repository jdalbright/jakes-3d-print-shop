import type { Metadata } from "next";
import { getCatalog } from "../lib/catalog";
import { OfficePilot } from "./OfficePilot";

export const metadata: Metadata = {
  title: "Office keychain rack",
  description: "Private keychain-rack checkout for the office pilot.",
  alternates: { canonical: "/office" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Office keychain rack",
    description: "Private keychain-rack checkout for the office pilot.",
    url: "/office",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Office keychain rack",
    description: "Private keychain-rack checkout for the office pilot.",
    images: [],
  },
};

export default async function OfficePage() {
  const [officeCatalog, publicCatalog] = await Promise.all([
    getCatalog("office"),
    getCatalog("public"),
  ]);
  const keychain = officeCatalog.products.find((product) => product.slug === "office-keychain-rack");
  const recommendations = ["sculptural-phone-stand", "japandi-tray"].flatMap((slug) => {
    const product = publicCatalog.products.find((item) => item.slug === slug);
    return product ? [product] : [];
  });

  return (
    <OfficePilot
      checkoutEnabled={officeCatalog.checkoutEnabled}
      keychain={keychain}
      recommendations={recommendations}
    />
  );
}
