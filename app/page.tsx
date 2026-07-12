import Link from "next/link";
import { CatalogGrid } from "./components/CatalogGrid";
import { getCatalog } from "./lib/catalog";

export default async function Home() {
  const { products, source } = await getCatalog();

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow hero-kicker">Jake’s workbench / small-batch PLA</p>
          <h1>Useful things, made one layer at a time.</h1>
          <p className="hero-deck">
            Prints for desks, shelves, gifts, and the everyday fixes in between. Pick a size and color; Jake handles the making.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="#shop">Shop prints</Link>
          </div>
          <p className="hero-footnote">Made locally · usually ready in 3–5 business days</p>
        </div>
        <div className="hero-product">
          {/* Demo catalog photography is replaced by real Stripe product images at launch. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/controller-dock-demo.png" alt="Graphite 3D-printed controller dock" />
          <div className="hero-product-note">
            <span>On the bench</span>
            <strong>Controller Dock</strong>
            <small>Graphite PLA · $22</small>
          </div>
        </div>
      </section>

      <section className="shop-rail" aria-label="Shop details">
        <dl>
          <div><dt>Material</dt><dd>Plant-based PLA</dd></div>
          <div><dt>Make time</dt><dd>3–5 business days</dd></div>
          <div><dt>Pickup</dt><dd>Free, arranged by email</dd></div>
          <div><dt>Shipping</dt><dd>$6 · free over $50</dd></div>
        </dl>
      </section>

      <section className="shop-section" id="shop">
        <div className="section-heading">
          <div><p className="eyebrow">The print shelf</p><h2>Choose a print.</h2></div>
          <p>{source === "demo" ? "Six sample listings show how your real Stripe catalog will look." : `${products.length} small-batch prints, managed through Stripe.`}</p>
        </div>
        <CatalogGrid products={products} />
      </section>

      <section className="studio-section" id="studio">
        <div className="studio-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/wave-planter-demo.png" alt="Layer detail on a terracotta 3D-printed planter" />
        </div>
        <div className="studio-copy">
          <p className="eyebrow">How it gets made</p>
          <h2>One maker. One print queue.</h2>
          <p>I’m Jake. I test each design at the workbench, print in small batches, and check the fit and finish before it leaves the shop.</p>
          <ol className="process-list">
            <li><b>1</b><span><strong>Test the file</strong><small>Check scale, strength, and fit.</small></span></li>
            <li><b>2</b><span><strong>Run the print</strong><small>Make the selected size and color.</small></span></li>
            <li><b>3</b><span><strong>Clean and check</strong><small>Finish edges and inspect the part.</small></span></li>
          </ol>
        </div>
      </section>

      <section className="fulfillment-section">
        <div><p className="eyebrow">Fulfillment</p><h2>Pickup or shipping.</h2></div>
        <dl className="fulfillment-list">
          <div><dt>Local pickup</dt><dd>Pay online, then Jake will email you to arrange a private handoff.</dd><span>Free</span></div>
          <div><dt>U.S. shipping</dt><dd>Standard shipping is $6. Orders of $50 or more ship free.</dd><span>3–7 days</span></div>
          <div><dt>Payment</dt><dd>Card details are collected on Stripe’s secure checkout.</dd><span>Stripe</span></div>
        </dl>
      </section>
    </>
  );
}
