import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PUBLIC_PICKUP_NOTICE, STANDARD_US_SHIPPING_CENTS } from "../../lib/store-config";

const EFFECTIVE_DATE = "July 16, 2026";
const SUPPORT_EMAIL = process.env.CONTACT_EMAIL?.trim() || "hello@jalbright.dev";
const shippingPrice = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format(STANDARD_US_SHIPPING_CENTS / 100);

const policies = {
  shipping: {
    title: "Shipping & pickup",
    description: "Production timing, U.S. shipping, and Raleigh pickup details for Jake’s 3D Print Shop.",
    intro: "Each item is prepared in Raleigh, North Carolina, then shipped in the U.S. or handed off through prepaid off-site local pickup.",
    sections: [
      ["Production time", "Most orders are printed and prepared within 3–5 business days. This is production time, not carrier transit time. If an order needs longer, the shop will email you with an updated estimate."],
      ["U.S. shipping", `Standard U.S. shipping is a flat ${shippingPrice} per order. A delivery estimate begins after the carrier accepts the package. Carrier delays are outside the shop’s direct control, but the shop will help investigate a delayed or missing package.`],
      ["Raleigh pickup", `Prepaid pickup is free. ${PUBLIC_PICKUP_NOTICE} The exact handoff location is not published on the site. The shop will email you when the order is ready and coordinate the location and time.`],
      ["Addresses and delivery issues", "Please enter a complete, accurate shipping address at checkout. Email the shop immediately if it needs to be corrected. Once a package has shipped, an address change may not be possible. If tracking shows a problem, contact the shop so it can work with the carrier."],
    ],
  },
  returns: {
    title: "Returns & order issues",
    description: "Cancellation, final-sale, damage, and defect terms for made-to-order purchases.",
    intro: "Made-to-order prints are produced in the size and color selected at checkout. The policy below keeps cancellations flexible before production and provides a clear remedy for damaged or defective items.",
    sections: [
      ["Cancel before printing", "You may cancel for a full refund any time before printing begins. Email the shop as soon as possible with the order email address so production can be checked and stopped."],
      ["After printing begins", "Once printing begins, the item is final sale and cannot be returned or canceled for a change of mind, color preference, or an incorrect option selected by the customer. This does not limit the damage and defect protection below."],
      ["Damage, defects, or the wrong item", "Contact the shop within 7 days of delivery or pickup if an item arrives damaged, has a material defect, or is not what you ordered. Include the order email address and clear photos of the item and packaging. After review, the shop will provide an appropriate replacement or a refund to the original payment method."],
      ["Natural print variation", "Layer lines, seams, and small surface variations are normal characteristics of 3D printing and are not defects by themselves. A substantial flaw that affects the item’s appearance or intended use is covered by the damage and defect process."],
    ],
  },
  privacy: {
    title: "Privacy",
    description: "How Jake’s 3D Print Shop handles checkout, fulfillment, cart, and storefront activity data.",
    intro: "The shop collects only the information needed to process orders, provide support, understand basic storefront use, and meet business obligations.",
    sections: [
      ["Information used for orders", "Stripe provides the shop with the contact, order, payment-status, shipping, and pickup details needed to prepare and fulfill a purchase. The shop uses that information for fulfillment, customer service, fraud prevention, refunds, disputes, and required business records."],
      ["Payment information", "Payment details are entered on Stripe’s hosted checkout. Jake’s 3D Print Shop does not receive or store full card or bank account numbers. Stripe processes payment information under its own privacy terms."],
      ["Cart storage", "The cart is stored locally in your browser so it remains available between visits. The shop does not create customer accounts. You can clear the cart through the site or remove the site’s stored data in your browser settings."],
      ["Storefront activity", "The site records limited events such as product views, cart additions, and checkout starts. These events may include product, variant, fulfillment, item-count, and sales-channel details, but the event payload does not include a customer name, email address, phone number, payment credential, or shipping address."],
      ["Sharing and retention", "Information is shared with service providers only as needed to operate the storefront, process payments, deliver orders, prevent abuse, or comply with law. Order and support records are kept only as long as reasonably needed for those purposes and legal or accounting requirements."],
    ],
  },
  terms: {
    title: "Terms",
    description: "Purchase and website terms for Jake’s 3D Print Shop.",
    intro: "By using this site or placing an order, you agree to these terms. They are intended to set clear expectations for a small made-to-order shop.",
    sections: [
      ["Orders and payment", "Prices are shown in U.S. dollars. Available shipping, pickup, taxes, and the order total are shown before payment. An order enters the production queue only after Stripe confirms payment. The shop may cancel and refund an order that cannot be produced or fulfilled as offered."],
      ["Product appearance", "3D-printed objects naturally show layer lines, seams, and small variations. Screen colors, lighting, and filament batches can also make a physical item look slightly different from its photographs."],
      ["Care and intended use", "Follow the care information on the product page. Unless a listing expressly says otherwise, printed items are not toys, food-contact products, dishwasher safe, microwave safe, or intended for high-heat environments. Customers are responsible for using each item only for its stated purpose."],
      ["Design and content rights", "Products are sold as physical objects for personal use. A purchase does not transfer design, reproduction, resale, photography, trademark, or other intellectual-property rights. Site text, branding, and images may not be reused without permission or another valid legal basis."],
      ["Availability and site accuracy", "Small-batch availability, colors, and production timing can change. The shop may correct an obvious listing or pricing error before fulfillment and will offer a refund if the corrected terms are not accepted. The shop does not guarantee uninterrupted site availability."],
      ["Governing terms", "These terms are governed by North Carolina law, without limiting consumer rights that cannot legally be waived. If part of these terms is unenforceable, the remaining terms continue to apply."],
    ],
  },
} as const;

type Props = { params: Promise<{ policy: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { policy } = await params;
  const entry = policies[policy as keyof typeof policies];
  if (!entry) return { title: "Policy", robots: { index: false, follow: false } };

  const canonical = `/policies/${policy}`;
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical },
    openGraph: {
      title: entry.title,
      description: entry.description,
      type: "website",
      url: canonical,
    },
  };
}

export default async function PolicyPage({ params }: Props) {
  const { policy } = await params;
  const entry = policies[policy as keyof typeof policies];
  if (!entry) notFound();

  return (
    <section className="policy-page">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Policies</span></div>
      <p className="eyebrow">Shop policy</p>
      <h1>{entry.title}</h1>
      <p className="policy-effective">Effective {EFFECTIVE_DATE}</p>
      <p className="policy-intro">{entry.intro}</p>
      <div className="policy-sections">
        {entry.sections.map(([title, content]) => (
          <article key={title}><div><h2>{title}</h2><p>{content}</p></div></article>
        ))}
      </div>
      <aside className="policy-contact" aria-labelledby="policy-contact-title">
        <div>
          <p className="eyebrow">Questions or order help</p>
          <h2 id="policy-contact-title">Contact the shop.</h2>
        </div>
        <a className="text-link" href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL} <span aria-hidden="true">↗</span></a>
      </aside>
      <Link className="text-link" href="/">Back to the shop <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
