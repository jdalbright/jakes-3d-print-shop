import Link from "next/link";
import { CatalogGrid } from "./components/CatalogGrid";
import { ProductVisual } from "./components/ProductVisual";
import { getCatalog } from "./lib/catalog";
import { storefrontProductStatus } from "./lib/commercial-license";
import { PICKUP_AREA, STANDARD_US_SHIPPING_CENTS } from "./lib/store-config";
import type { StoreProduct } from "./lib/types";

const heroProductSlugs = [
  "japandi-tray",
  "sculptural-phone-stand",
  "japandi-mushroom-container",
];

const selectedMatteColors = [
  { name: "Charcoal", code: "11101", hex: "#000000" },
  { name: "Ash Gray", code: "11102", hex: "#9b9ea0" },
  { name: "Ivory White", code: "11100", hex: "#ffffff" },
  { name: "Dark Green", code: "11501", hex: "#68724d" },
  { name: "Dark Blue", code: "11602", hex: "#042f56" },
  { name: "Mandarin Orange", code: "11300", hex: "#f99963" },
];

function money(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount / 100);
}

function selectProducts(products: StoreProduct[], slugs: string[]) {
  return slugs
    .map((slug) => products.find((product) => product.slug === slug))
    .filter((product): product is StoreProduct => Boolean(product));
}

export default async function Home() {
  const { products } = await getCatalog();
  const heroProducts = selectProducts(products, heroProductSlugs);
  const heroSlugs = new Set(heroProducts.map((product) => product.slug));
  const collectionProducts = products
    .filter((product) => !heroSlugs.has(product.slug))
    .slice(0, 3);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-copy">
          <p className="eyebrow">Small-batch shop · Raleigh, NC</p>
          <h1>3D-printed goods for home and desk.</h1>
          <p className="home-hero-deck">
            Shop trays, stands, containers, and organizers made to order in Jake’s Raleigh studio. Each product comes in a short list of stocked colors.
          </p>
          <div className="home-hero-actions">
            <Link className="primary-button" href="/products">Browse all products</Link>
            <Link className="text-link" href="/#studio">How orders are made <span aria-hidden="true">↓</span></Link>
          </div>
        </div>

        <section className="home-object-index" aria-labelledby="featured-products-heading">
          <div className="home-object-index-label">
            <h2 id="featured-products-heading">Featured products</h2>
          </div>
          <div className={`home-object-grid home-object-count-${heroProducts.length}`}>
            {heroProducts.map((product, index) => (
              <Link
                className={`home-object-tile home-object-tile--${index + 1}`}
                href={`/products/${product.slug}`}
                key={product.id}
              >
                <ProductVisual product={product} imageAlt={`${product.name} from the current collection`} />
                <span className="home-object-tile-copy">
                  <small>{product.category} / {storefrontProductStatus(product)}</small>
                  <strong>{product.name}</strong>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="shop-rail" aria-label="Shop details">
        <dl>
          <div><dt>Products</dt><dd>Trays, stands + containers</dd></div>
          <div><dt>Production</dt><dd>Usually 3–5 business days</dd></div>
          <div><dt>Material</dt><dd>Bambu PLA Matte</dd></div>
          <div><dt>Finish</dt><dd>Checked by hand</dd></div>
        </dl>
      </section>

      {collectionProducts.length ? (
        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div><p className="eyebrow">Current collection</p><h2>More from the shop</h2></div>
            <div className="section-heading-side">
              <p>Open a product to see its sizes, available colors, and current price.</p>
            </div>
          </div>
          <CatalogGrid products={collectionProducts} showFilters={false} />
        </section>
      ) : null}

      <section className="making-section" id="studio" aria-labelledby="making-heading">
        <div className="making-copy">
          <p className="eyebrow">Materials and production</p>
          <h2 id="making-heading">How each order is made</h2>
          <p>
            Before a product goes on sale, Jake confirms the design rights and tests it on the workbench. Your order is then printed in the size and color selected on the product page.
          </p>
          <ol className="process-list">
            <li><b>1</b><span><strong>Test the design</strong><small>Confirm the size, strength, fit, and print setup.</small></span></li>
            <li><b>2</b><span><strong>Print your order</strong><small>Use the size and stocked color selected on the product page.</small></span></li>
            <li><b>3</b><span><strong>Inspect the finished piece</strong><small>Clean the edges and check the print before pickup or shipping.</small></span></li>
          </ol>
        </div>

        <div className="material-library" aria-labelledby="stocked-colors-heading">
          <div className="material-library-heading">
            <div>
              <h3 id="stocked-colors-heading">Stocked matte colors</h3>
              <p>A sample of the Bambu PLA Matte spools currently on hand. Each product offers only the colors selected for that design.</p>
            </div>
            <small>Bambu PLA Matte</small>
          </div>
          <ul>
            {selectedMatteColors.map((color) => (
              <li key={color.code}>
                <i style={{ backgroundColor: color.hex }} aria-hidden="true" />
                <span><strong>Matte {color.name}</strong><small>Bambu / {color.code}</small></span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="fulfillment-section" aria-labelledby="fulfillment-heading">
        <div className="fulfillment-heading">
          <h2 id="fulfillment-heading">Pickup in Raleigh or ship across the U.S.</h2>
          <p>Choose pickup or shipping after adding a product to your cart.</p>
          <Link className="text-link" href="/products">Shop all products <span aria-hidden="true">→</span></Link>
        </div>
        <dl className="fulfillment-list">
          <div><dt>Raleigh pickup</dt><dd>Pay online, then Jake will email you to arrange a private handoff in {PICKUP_AREA}.</dd><span>Free</span></div>
          <div><dt>U.S. shipping</dt><dd>One flat {money(STANDARD_US_SHIPPING_CENTS)} shipping charge per order.</dd><span>3–7 days</span></div>
          <div><dt>Payment</dt><dd>Stripe securely handles card payment and sends the receipt.</dd><span>Stripe</span></div>
        </dl>
      </section>
    </>
  );
}
