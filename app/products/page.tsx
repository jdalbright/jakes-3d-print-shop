import type { Metadata } from "next";
import { CatalogGrid } from "../components/CatalogGrid";
import { getCatalog } from "../lib/catalog";

export const metadata: Metadata = {
  title: "Current prints",
  description: "Shop the current small-batch 3D prints from Jake’s workbench.",
};

export default async function ProductsPage() {
  const { products } = await getCatalog();

  return (
    <section className="products-page">
      <div className="products-intro">
        <h1>Current prints.</h1>
        <p>Two useful forms for desk and home, selected for small-batch printing and careful finishing.</p>
      </div>
      <CatalogGrid products={products} showFilters={products.length > 1} />
    </section>
  );
}
