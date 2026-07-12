import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "../../components/ProductConfigurator";
import { ProductVisual } from "../../components/ProductVisual";
import { getCatalogProduct } from "../../lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getCatalogProduct(slug);
  return product ? { title: product.name, description: product.description } : { title: "Print not found" };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const { product } = await getCatalogProduct(slug);
  if (!product) notFound();

  return (
    <section className="product-page">
      <div className="breadcrumbs"><Link href="/">Shop</Link><span>/</span><span>{product.category}</span></div>
      <div className="product-layout">
        <ProductVisual product={product} detail />
        <div className="product-info">
          <p className="eyebrow">{product.category} · {product.demo ? "Demo listing" : "Small batch"}</p>
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <ProductConfigurator product={product} />
          <details>
            <summary>Materials & finish <span>+</span></summary>
            <p>Printed in durable plant-based PLA with visible layer lines—the honest texture of the process. Finished and checked by hand.</p>
          </details>
          <details>
            <summary>Lead time <span>+</span></summary>
            <p>Most prints are ready in 3–5 business days. Jake will email if a particularly large or colorful order needs longer.</p>
          </details>
        </div>
      </div>
    </section>
  );
}
