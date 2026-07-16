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
import { BrandLogo } from "./BrandLogo";

const STORAGE_KEY = "jakes-3d-print-shop-cart-v2";

function clampCartQuantity(item: CartItem, quantity: number) {
  const minQuantity = Math.max(1, item.minQuantity ?? 1);
  const maxQuantity = Math.max(minQuantity, Math.min(10, item.maxQuantity ?? 10));
  return Math.max(minQuantity, Math.min(maxQuantity, Math.floor(quantity)));
}

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
  const isOfficeRoute = pathname === "/office";
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
      if (match < 0) return [...current, { ...item, quantity: clampCartQuantity(item, item.quantity) }];
      return current.map((existing, index) =>
        index === match
          ? { ...existing, quantity: clampCartQuantity(existing, existing.quantity + item.quantity) }
          : existing,
      );
    });
  }, []);

  const updateQuantity = useCallback((priceId: string, color: string, quantity: number) => {
    setItems((current) =>
      current.map((item) =>
        item.priceId === priceId && item.color === color
          ? { ...item, quantity: clampCartQuantity(item, quantity) }
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
          {checkoutEnabled
            ? "Stripe sandbox · test cards only · no live charges"
            : "Test shop · no live charges"}
        </div>
      ) : null}
      <header className={`site-header ${isOfficeRoute ? "site-header--office" : ""}`}>
        <Link className="brand" href="/" aria-label="Jake's 3D Print Shop home">
          <BrandLogo variant={isOfficeRoute ? "mark" : "full"} />
        </Link>
        {isOfficeRoute ? (
          <span className="office-shell-label">Office rack <small>Private pilot</small></span>
        ) : (
          <nav aria-label="Primary navigation">
            <Link className={pathname.startsWith("/products") ? "active" : ""} href="/products">Products</Link>
            <Link className="studio-nav-link" href="/#studio">How it’s made</Link>
            <Link className={pathname === "/cart" ? "active cart-link" : "cart-link"} href="/cart">
              Cart <span aria-label={`${itemCount} items`}>{hydrated ? itemCount : 0}</span>
            </Link>
          </nav>
        )}
      </header>
      <main id="main-content">{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="brand footer-brand" href="/">
            <BrandLogo />
          </Link>
          <p>Small-batch 3D-printed home and desk goods, made to order in Raleigh, NC.</p>
        </div>
        <div className="footer-links">
          <span>Shop details</span>
          <Link href="/products">Products</Link>
          <Link href="/policies/shipping">Shipping & pickup</Link>
          <Link href="/policies/returns">Returns</Link>
        </div>
        <div className="footer-links">
          <span>The fine print</span>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms</Link>
        </div>
      </footer>
    </StoreContext.Provider>
  );
}
