"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartItem } from "../lib/types";

const STORAGE_KEY = "jakes-3d-print-shop-cart-v1";

type StoreContextValue = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  updateQuantity: (priceId: string, color: string, quantity: number) => void;
  removeItem: (priceId: string, color: string) => void;
  clearCart: () => void;
  checkoutEnabled: boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStore must be used inside StoreShell");
  return value;
}

function readCart(): CartItem[] {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function StoreShell({
  children,
  checkoutEnabled,
  testMode,
}: {
  children: React.ReactNode;
  checkoutEnabled: boolean;
  testMode: boolean;
}) {
  const pathname = usePathname();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Device-local cart data is intentionally hydrated only after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItems(readCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [hydrated, items]);

  const addItem = useCallback((item: CartItem) => {
    setItems((current) => {
      const match = current.findIndex(
        (existing) => existing.priceId === item.priceId && existing.color === item.color,
      );
      if (match < 0) return [...current, { ...item, quantity: Math.min(10, item.quantity) }];
      return current.map((existing, index) =>
        index === match
          ? { ...existing, quantity: Math.min(10, existing.quantity + item.quantity) }
          : existing,
      );
    });
  }, []);

  const updateQuantity = useCallback((priceId: string, color: string, quantity: number) => {
    const safeQuantity = Math.max(1, Math.min(10, Math.floor(quantity)));
    setItems((current) =>
      current.map((item) =>
        item.priceId === priceId && item.color === color
          ? { ...item, quantity: safeQuantity }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((priceId: string, color: string) => {
    setItems((current) =>
      current.filter((item) => !(item.priceId === priceId && item.color === color)),
    );
  }, []);

  const value = useMemo(
    () => ({
      items,
      addItem,
      updateQuantity,
      removeItem,
      clearCart: () => setItems([]),
      checkoutEnabled,
    }),
    [addItem, checkoutEnabled, items, removeItem, updateQuantity],
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <StoreContext.Provider value={value}>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {testMode ? (
        <div className="test-banner" role="status">
          <span className="status-dot" aria-hidden="true" />
          Test shop · demo products · no live charges
        </div>
      ) : null}
      <header className="site-header">
        <Link className="brand" href="/" aria-label="Jake's 3D Print Shop home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Jake’s <b>3D Print Shop</b></span>
        </Link>
        <nav aria-label="Primary navigation">
          <Link className={pathname === "/" ? "active" : ""} href="/#shop">Shop</Link>
          <Link href="/#studio">The studio</Link>
          <Link className={pathname === "/cart" ? "active cart-link" : "cart-link"} href="/cart">
            Cart <span aria-label={`${itemCount} items`}>{hydrated ? itemCount : 0}</span>
          </Link>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="brand footer-brand" href="/">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span>Jake’s <b>3D Print Shop</b></span>
          </Link>
          <p>Useful objects, playful details, and small-batch prints made one layer at a time.</p>
        </div>
        <div className="footer-links">
          <span>Shop details</span>
          <Link href="/policies/shipping">Shipping & pickup</Link>
          <Link href="/policies/returns">Returns</Link>
        </div>
        <div className="footer-links">
          <span>The fine print</span>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms</Link>
        </div>
        <div className="footer-note">
          <span>TEST STORE</span>
          <p>Real listings and approved policies are required before launch.</p>
        </div>
      </footer>
    </StoreContext.Provider>
  );
}
