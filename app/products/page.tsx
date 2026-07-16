import type { Metadata } from "next";
import { CatalogGrid } from "../components/CatalogGrid";
import { getCatalog } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Modern objects",
  description: "Shop design-led desk and home objects made in small batches in Raleigh, NC.",
};

export default async function ProductsPage() {
  const { products } = await getCatalog();

  return (
    <section className="products-page">
      <div className="products-intro">
        <h1>Modern objects.</h1>
        <p>Shop a focused first run of SabreDesign objects, printed to order in Jake’s Raleigh studio.</p>
      </div>
      <CatalogGrid products={products} showFilters={products.length > 1} />
    </section>
  );
}
