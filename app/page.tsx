import Link from "next/link";
import { CatalogGrid } from "./components/CatalogGrid";
import { getCatalog } from "./lib/catalog";

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

export default async function Home() {
  const { products } = await getCatalog();
  const featuredProducts = products.filter((product) => product.featured);
  const popularProducts = (featuredProducts.length ? featuredProducts : products).slice(0, 3);
  const primaryProduct = popularProducts[0];
  const primaryPrice = primaryProduct
    ? Math.min(...primaryProduct.variants.map((variant) => variant.unitAmount))
    : 0;

  return (
    <>
      <section className="hero-section">
        <div className="hero-copy">
          <p className="eyebrow hero-kicker">Jake’s workbench / licensed small-batch print</p>
          <h1>A cleaner desk, one layer at a time.</h1>
          <p className="hero-deck">
            Meet the Onami 2 Headphone Stand: a calm wave-inspired form, printed to order and finished by hand in Jake’s studio.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/products/onami-2-headphone-stand">View the Onami 2</Link>
          </div>
          <p className="hero-footnote">Made locally · usually ready in 3–5 business days</p>
        </div>
        <div className="hero-product">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/onami-2-headphone-stand-hero-v3.png" alt="Slate-blue Onami 2 Headphone Stand" />
          <div className="hero-product-note">
            <span>First off the bench</span>
            <strong>{primaryProduct?.name || "Onami 2 Headphone Stand"}</strong>
            <small>Design by Meyui · {money(primaryPrice || 3400)}</small>
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
          <div><p className="eyebrow">The print shelf</p><h2>First off the bench.</h2></div>
          <div className="section-heading-side">
            <p>One focused product while Jake finishes testing the next additions.</p>
            <Link className="text-link" href="/products/onami-2-headphone-stand">View product <span aria-hidden="true">→</span></Link>
          </div>
        </div>
        <CatalogGrid products={popularProducts} showFilters={false} />
      </section>

      <section className="studio-section" id="studio">
        <div className="studio-photo">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/products/onami-2-headphone-stand-detail-v3.png" alt="Close view of the Onami 2 headband cradle and print layers" />
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
