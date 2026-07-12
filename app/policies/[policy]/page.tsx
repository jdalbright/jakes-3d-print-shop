import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const policies = {
  shipping: {
    title: "Shipping & pickup",
    intro: "A plain-language draft for test-shop review. Confirm these details before public launch.",
    sections: [
      ["U.S. shipping", "Standard U.S. shipping is $6 for orders below $50 and free for orders of $50 or more. Delivery estimates begin after the print is ready."],
      ["Make time", "Most items are made or prepared within 3–5 business days. Larger batches or unusual colors may take longer; Jake will email if timing changes."],
      ["Local pickup", "Local pickup is free and prepaid through Stripe. The pickup address is kept private. Jake will email after payment to coordinate the handoff."],
      ["Address problems", "Customers are responsible for entering a complete shipping address. Contact the shop as soon as possible if an address needs correction."],
    ],
  },
  returns: {
    title: "Returns & damaged orders",
    intro: "A draft policy for the test shop. Review and approve it before accepting live orders.",
    sections: [
      ["Damaged orders", "Photograph the item and packaging and contact the shop within 7 days of delivery so Jake can evaluate a replacement or refund."],
      ["Made-to-order items", "Color and size selections are made for each buyer. Returns for preference changes are not automatically accepted, but the shop will always try to find a fair solution."],
      ["Cancellations", "Ask to cancel as soon as possible. An order can be refunded if printing has not begun; Stripe processing fees may be handled according to the final approved policy."],
      ["Test-store notice", "No live orders should be placed while the site displays the test-store banner."],
    ],
  },
  privacy: {
    title: "Privacy",
    intro: "A minimal draft describing the intended data flow. It is not a substitute for an approved privacy policy.",
    sections: [
      ["What the shop receives", "Stripe provides the contact, order, payment status, and fulfillment details needed to prepare and deliver an order."],
      ["Payment details", "Card and bank details are collected by Stripe on its hosted checkout. Jake’s 3D Print Shop does not receive or store full payment credentials."],
      ["Device storage", "The cart is stored locally in the customer’s browser so it remains available between visits. The test shop does not create customer accounts."],
      ["Use of information", "Order information is used only for fulfillment, customer service, fraud prevention, and required business records."],
    ],
  },
  terms: {
    title: "Terms",
    intro: "Draft terms for product and checkout testing. Merchant approval is required before public launch.",
    sections: [
      ["Product appearance", "3D-printed objects naturally show layer lines and small variations. Screen colors can also differ from physical filament colors."],
      ["Personal use", "Products are sold as physical objects for their described purpose. Unless explicitly stated, purchasing an item does not transfer design or reproduction rights."],
      ["Availability", "Small-batch and made-to-order availability can change. A completed Stripe payment is required before an order enters the production queue."],
      ["Test environment", "Demo listings are illustrative and must not be treated as real products while the test-store banner is visible."],
    ],
  },
} as const;

type Props = { params: Promise<{ policy: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { policy } = await params;
  const entry = policies[policy as keyof typeof policies];
  return { title: entry?.title || "Policy" };
}

export default async function PolicyPage({ params }: Props) {
  const { policy } = await params;
  const entry = policies[policy as keyof typeof policies];
  if (!entry) notFound();
  return (
    <section className="policy-page">
      <div className="breadcrumbs"><Link href="/">Home</Link><span>/</span><span>Policies</span></div>
      <p className="eyebrow">Draft for review</p>
      <h1>{entry.title}</h1>
      <p className="policy-intro">{entry.intro}</p>
      <div className="policy-sections">
        {entry.sections.map(([title, content]) => (
          <article key={title}><div><h2>{title}</h2><p>{content}</p></div></article>
        ))}
      </div>
      <Link className="text-link" href="/">Back to the shop <span aria-hidden="true">↗</span></Link>
    </section>
  );
}
