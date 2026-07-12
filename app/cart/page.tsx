import type { Metadata } from "next";
import { Suspense } from "react";
import { CartPage } from "./CartPage";

export const metadata: Metadata = { title: "Cart" };

export default function Page() {
  return <Suspense fallback={<div className="empty-cart"><p>Loading your cart…</p></div>}><CartPage /></Suspense>;
}
