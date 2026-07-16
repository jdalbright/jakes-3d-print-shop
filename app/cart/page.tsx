import type { Metadata } from "next";
import { Suspense } from "react";
import { CartPage } from "./CartPage";

export const metadata: Metadata = {
  title: "Cart",
  description: "Review items saved in your Jake’s 3D Print Shop cart.",
  alternates: { canonical: "/cart" },
  robots: { index: false, follow: false },
  openGraph: {
    title: "Cart",
    description: "Review items saved in your Jake’s 3D Print Shop cart.",
    url: "/cart",
  },
};

export default function Page() {
  return <Suspense fallback={<div className="empty-cart" role="status"><p>Loading your cart…</p></div>}><CartPage /></Suspense>;
}
