"use client";

import { useEffect } from "react";
import { useStore } from "../../components/StoreShell";

type PurchasedCartItem = {
  priceId: string;
  color: string;
};

export function PurchasedCartCleanup({ items }: { items: PurchasedCartItem[] }) {
  const { cartHydrated, removeItem } = useStore();

  useEffect(() => {
    if (!cartHydrated) return;
    items.forEach((item) => removeItem(item.priceId, item.color));
  }, [cartHydrated, items, removeItem]);

  return null;
}
