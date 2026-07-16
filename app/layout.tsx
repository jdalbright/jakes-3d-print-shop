import type { Metadata } from "next";
import { DM_Mono, Manrope } from "next/font/google";
import { StoreShell } from "./components/StoreShell";
import { getCatalog } from "./lib/catalog";
import { getStripeRuntimeConfiguration, isLiveLaunchEnabled } from "./lib/stripe";
import "./globals.css";

const sans = Manrope({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = DM_Mono({ subsets: ["latin"], variable: "--font-mono", weight: ["400", "500"], display: "swap" });
const siteUrl = new URL(process.env.SITE_URL || "http://localhost:3000");
const siteDescription = "Small-batch 3D-printed home and desk goods, made to order in Raleigh, NC.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  applicationName: "Jake’s 3D Print Shop",
  title: { default: "Jake’s 3D Print Shop", template: "%s · Jake’s 3D Print Shop" },
  description: siteDescription,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Jake’s 3D Print Shop",
    description: siteDescription,
    type: "website",
    url: siteUrl,
    siteName: "Jake’s 3D Print Shop",
    locale: "en_US",
    images: [{ url: "/og.png", alt: "Jake’s 3D Print Shop collection" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Jake’s 3D Print Shop",
    description: siteDescription,
    images: ["/og.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const catalog = await getCatalog("public");
  const stripeConfiguration = getStripeRuntimeConfiguration();
  const supportEmail = process.env.CONTACT_EMAIL?.trim() || "hello@jalbright.dev";

  return (
    <html lang="en">
      <body className={`${sans.variable} ${mono.variable}`}>
        <StoreShell
          checkoutEnabled={catalog.checkoutEnabled}
          testMode={!isLiveLaunchEnabled()}
          orderingUnavailable={stripeConfiguration.liveModeRequested && !catalog.checkoutEnabled}
          supportEmail={supportEmail}
        >
          {children}
        </StoreShell>
      </body>
    </html>
  );
}
