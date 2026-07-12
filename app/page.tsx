import Link from "next/link";
import { CatalogGrid } from "./components/CatalogGrid";
import { getCatalog } from "./lib/catalog";

export default async function Home() {
  const { products, source } = await getCatalog();
  const featured = products.filter((product) => product.featured).slice(0, 3);

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow hero-kicker"><span /> Made small. Made useful.</p>
          <h1>Good ideas,<br /><em>printed.</em></h1>
          <p className="hero-deck">
            Thoughtful 3D prints for desks, shelves, gifts, and everyday little problems—made one layer at a time in Jake’s studio.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="#shop">Shop the prints</Link>
            <Link className="text-link" href="#studio">Meet the maker <span aria-hidden="true">↘</span></Link>
          </div>
          <dl className="hero-facts">
            <div><dt>3–5 days</dt><dd>Typical make time</dd></div>
            <div><dt>$50+</dt><dd>Ships free</dd></div>
            <div><dt>Local</dt><dd>Pickup available</dd></div>
          </dl>
        </div>
        <div className="hero-art" aria-label="Abstract stack inspired by 3D-printed layers" role="img">
          <span className="art-grid" />
          <div className="print-stack">
            <i /><i /><i /><i /><i /><i /><i />
            <b>01</b>
          </div>
          <div className="art-note top">LAYER BY LAYER<br /><span>0.20 mm</span></div>
          <div className="art-note bottom">SMALL BATCH<br /><span>Made by Jake</span></div>
        </div>
      </section>

      <section className="marquee" aria-label="Shop values">
        <div>Small batch <span>✦</span> Useful by design <span>✦</span> Made locally <span>✦</span> Pick your color <span>✦</span> Small batch <span>✦</span> Useful by design</div>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading">
          <div><p className="eyebrow">The print shelf</p><h2>Pick something <em>good.</em></h2></div>
          <p>{source === "demo" ? "Six sample listings show how your real Stripe catalog will look." : `${products.length} small-batch prints, managed through Stripe.`}</p>
        </div>
        <CatalogGrid products={products} />
      </section>

      <section className="featured-strip">
        <p className="eyebrow">Studio favorites</p>
        <div>
          {featured.map((product, index) => (
            <Link href={`/products/${product.slug}`} key={product.id}>
              <span>0{index + 1}</span>
              <b>{product.name}</b>
              <i aria-hidden="true">↗</i>
            </Link>
          ))}
        </div>
      </section>

      <section className="studio-section" id="studio">
        <div className="studio-portrait" aria-label="Jake's maker mark placeholder" role="img">
          <span>J</span><i>PRINT / TEST / REFINE</i>
        </div>
        <div className="studio-copy">
          <p className="eyebrow">Behind the layers</p>
          <h2>A little workshop with a lot of <em>curiosity.</em></h2>
          <p>I’m Jake. I design and print objects that earn their spot on your desk or shelf. Every piece is tested, tuned, and made in small batches—so it feels considered, not churned out.</p>
          <div className="process-list">
            <span><b>01</b>Design for real use</span>
            <span><b>02</b>Print in small batches</span>
            <span><b>03</b>Finish by hand</span>
          </div>
        </div>
      </section>

      <section className="fulfillment-section">
        <div><p className="eyebrow">Two ways to get it</p><h2>Across town or<br />across the country.</h2></div>
        <article><span aria-hidden="true">⌂</span><h3>Free local pickup</h3><p>Pay securely online, then Jake will email you to coordinate a private handoff.</p></article>
        <article><span aria-hidden="true">→</span><h3>Simple U.S. shipping</h3><p>Flat $6 shipping below $50. Orders of $50 or more ship free.</p></article>
      </section>
    </>
  );
}
