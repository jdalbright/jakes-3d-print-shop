import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductConfigurator } from "../../components/ProductConfigurator";
import { ProductGallery } from "../../components/ProductGallery";
import { ProductVisual } from "../../components/ProductVisual";
import { getCatalogProduct } from "../../lib/catalog";
import type { StoreProduct } from "../../lib/types";

type Props = { params: Promise<{ slug: string }> };

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

function relatedProducts(current: StoreProduct, products: StoreProduct[]) {
  const available = products.filter((item) => item.id !== current.id && item.stockStatus !== "sold_out");
  return [
    ...available.filter((item) => item.category === current.category),
    ...available.filter((item) => item.category !== current.category && item.featured),
  ].slice(0, 3);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { product } = await getCatalogProduct(slug);
  if (!product) return { title: "Print not found" };
  const socialImage = product.images[0] || product.image;

  return {
    title: product.name,
    description: product.description,
    robots: product.demo ? { index: false, follow: false } : undefined,
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      images: socialImage ? [{ url: socialImage, alt: product.name }] : undefined,
    },
    twitter: {
      card: socialImage ? "summary_large_image" : "summary",
      title: product.name,
      description: product.description,
      images: socialImage ? [socialImage] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const catalog = await getCatalogProduct(slug);
  const { product } = catalog;
  if (!product) notFound();

  const related = relatedProducts(product, catalog.products);
  const productUrl = new URL(`/products/${product.slug}`, process.env.SITE_URL || "http://localhost:3000").toString();
  const availability = product.stockStatus === "sold_out"
    ? "https://schema.org/OutOfStock"
    : product.stockStatus === "made_to_order"
      ? "https://schema.org/PreOrder"
      : "https://schema.org/InStock";
  const structuredData = product.demo ? null : {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    ...(product.images.length ? { image: product.images } : {}),
    brand: { "@type": "Brand", name: "Jake’s 3D Print Shop" },
    offers: product.variants.map((variant) => ({
      "@type": "Offer",
      url: productUrl,
      sku: variant.sku,
      priceCurrency: "USD",
      price: (variant.unitAmount / 100).toFixed(2),
      availability,
    })),
  };
  const showStory = product.highlights.length > 0 || product.detailCopy !== product.description;

  return (
    <section className="product-page">
      {structuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
        />
      ) : null}

      <div className="breadcrumbs"><Link href="/#shop">Shop</Link><span>/</span><span>{product.category}</span><span>/</span><span>{product.name}</span></div>
      <div className="product-layout">
        <ProductGallery product={product} />
        <aside className="product-info">
          <p className="eyebrow">{product.category} · {product.demo ? "Demo listing" : "Small batch"}</p>
          <h1>{product.name}</h1>
          <p className="product-description">{product.description}</p>
          <ProductConfigurator product={product} />
        </aside>
      </div>

      {showStory ? (
        <section className="product-story" aria-labelledby="product-story-title">
          <div>
            <p className="eyebrow">Inside the print</p>
            <h2 id="product-story-title">Why this print works.</h2>
          </div>
          <div className="product-story-copy">
            <p>{product.detailCopy}</p>
            {product.highlights.length ? (
              <ul>
                {product.highlights.map((highlight) => <li key={highlight}>{highlight}</li>)}
              </ul>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="print-details" aria-labelledby="print-details-title">
        <div>
          <p className="eyebrow">Workshop notes</p>
          <h2 id="print-details-title">Print details</h2>
        </div>
        <dl>
          <div><dt>Material</dt><dd>{product.material}</dd></div>
          <div><dt>Finish</dt><dd>{product.finish}</dd></div>
          <div><dt>Care</dt><dd>{product.care}</dd></div>
          <div><dt>Lead time</dt><dd>{product.leadTime}</dd></div>
        </dl>
      </section>

      <section className="product-services" aria-label="Shipping, pickup, and returns">
        {product.ship ? (
          <article><span>Ships in the U.S.</span><h2>$6 below $50</h2><p>Standard shipping is free when the product subtotal reaches $50.</p><Link href="/policies/shipping">Shipping details</Link></article>
        ) : null}
        {product.pickup ? (
          <article><span>Local handoff</span><h2>Pickup is free</h2><p>Pay online, then Jake will email to coordinate the private pickup location.</p><Link href="/policies/shipping">Pickup details</Link></article>
        ) : null}
        <article><span>Made in small batches</span><h2>Returns stay simple</h2><p>Review the return window and what to do if a print arrives damaged.</p><Link href="/policies/returns">Return policy</Link></article>
      </section>

      {related.length ? (
        <section className="related-products" aria-labelledby="related-products-title">
          <div className="section-heading">
            <div><p className="eyebrow">Keep browsing</p><h2 id="related-products-title">More from the print shelf.</h2></div>
            <Link className="text-link" href="/#shop">View all prints <span aria-hidden="true">↗</span></Link>
          </div>
          <div className={`product-grid related-grid related-count-${related.length}`}>
            {related.map((item) => {
              const price = Math.min(...item.variants.map((variant) => variant.unitAmount));
              return (
                <article className="product-card" key={item.id}>
                  <Link href={`/products/${item.slug}`} aria-label={`View ${item.name}`}><ProductVisual product={item} /></Link>
                  <div className="product-card-copy">
                    <div><p className="eyebrow">{item.category}</p><h3><Link href={`/products/${item.slug}`}>{item.name}</Link></h3></div>
                    <p className="price">{item.variants.length > 1 ? "From " : ""}{money(price)}</p>
                  </div>
                  <div className="product-meta"><span>{item.stockStatus === "made_to_order" ? "Made to order" : "Ready soon"}</span><span>{item.colors.length} color{item.colors.length === 1 ? "" : "s"}</span></div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </section>
  );
}
