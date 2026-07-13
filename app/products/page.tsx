import type { Metadata } from "next";
import { CatalogGrid } from "../components/CatalogGrid";
import { getCatalog } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Current print",
  description: "Shop the current small-batch 3D print from Jake’s workbench.",
};

export default async function ProductsPage() {
  const { products } = await getCatalog();

  return (
    <section className="products-page">
      <div className="products-intro">
        <h1>Current print.</h1>
        <p>Jake is starting with one carefully tested design and adding more only when they are ready.</p>
      </div>
      <CatalogGrid products={products} showFilters={products.length > 1} />
    </section>
  );
}
