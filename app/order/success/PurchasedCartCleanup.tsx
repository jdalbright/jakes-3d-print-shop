"use client";

import { useEffect } from "react";
import { useStore } from "../../components/StoreShell";

type PurchasedCartItem = {
  priceId: string;
  color: string;
};

export function PurchasedCartCleanup({ items }: { items: PurchasedCartItem[] }) {
  const { removeItem } = useStore();

  useEffect(() => {
    items.forEach((item) => removeItem(item.priceId, item.color));
  }, [items, removeItem]);

  return null;
}
