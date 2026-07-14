import type { Metadata } from "next";
import { getCatalog } from "../lib/catalog";
import { OfficePilot } from "./OfficePilot";

export const metadata: Metadata = {
  title: "Office rack",
  description: "Private office rack checkout and desk-product pilot.",
  robots: { index: false, follow: false },
  openGraph: {
    title: "Office rack",
    description: "Private office rack checkout and desk-product pilot.",
    images: [],
  },
  twitter: {
    card: "summary",
    title: "Office rack",
    description: "Private office rack checkout and desk-product pilot.",
    images: [],
  },
};

export default async function OfficePage() {
  const { products, checkoutEnabled } = await getCatalog("office");
  const keychain = products.find((product) => product.slug === "office-keychain-rack");
  const organizer = products.find((product) => product.slug === "modular-desk-organizer-set");

  return (
    <OfficePilot
      checkoutEnabled={checkoutEnabled}
      keychain={keychain}
      organizer={organizer}
    />
  );
}
