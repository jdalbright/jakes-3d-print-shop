import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import { StoreShell } from "./components/StoreShell";
import { isLiveLaunchEnabled } from "./lib/stripe";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "http://localhost:3000"),
  title: { default: "Jake’s 3D Print Shop", template: "%s · Jake’s 3D Print Shop" },
  description: "Design-led desk and home objects, made in small batches in Raleigh, NC.",
  openGraph: {
    title: "Jake’s 3D Print Shop",
    description: "Design-led desk and home objects, made in small batches in Raleigh, NC.",
    type: "website",
    images: [{ url: "/products/onami-2-headphone-stand-hero-v3.png", alt: "Onami 2 Headphone Stand in slate blue" }],
  },
  twitter: {
    card: "summary_large_image",
    description: "Design-led desk and home objects, made in small batches in Raleigh, NC.",
    images: ["/products/onami-2-headphone-stand-hero-v3.png"],
  },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <StoreShell
          checkoutEnabled={Boolean(process.env.STRIPE_SECRET_KEY) && (process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_") || process.env.STORE_LIVE_MODE === "true")}
          testMode={!isLiveLaunchEnabled()}
        >
          {children}
        </StoreShell>
      </body>
    </html>
  );
}
