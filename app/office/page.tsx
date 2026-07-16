import type { Metadata } from "next";
import { getCatalog } from "../lib/catalog";
import { OfficePilot } from "./OfficePilot";

export const metadata: Metadata = {
  title: "Office keychain rack",
  description: "Private keychain-rack checkout for the office pilot.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Office keychain rack",
    description: "Private keychain-rack checkout for the office pilot.",
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
  const { products, checkoutEnabled } = await getCatalog("office");
  const keychain = products.find((product) => product.slug === "office-keychain-rack");

  return (
    <OfficePilot
      checkoutEnabled={checkoutEnabled}
      keychain={keychain}
    />
  );
}
