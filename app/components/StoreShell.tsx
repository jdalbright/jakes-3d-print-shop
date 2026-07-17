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
  cartHydrated: boolean;
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
  orderingUnavailable = false,
  supportEmail,
}: {
  children: React.ReactNode;
  checkoutEnabled: boolean;
  testMode: boolean;
  orderingUnavailable?: boolean;
  supportEmail: string;
}) {
  const pathname = usePathname();
  const isOfficeRoute = pathname === "/office";
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [cartAnnouncement, setCartAnnouncement] = useState({ id: 0, text: "" });

  const announceCartChange = useCallback((text: string) => {
    setCartAnnouncement((current) => ({ id: current.id + 1, text }));
  }, []);

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
    announceCartChange(`${item.name} added to your cart.`);
    setItems((current) => {
      if (item.salesChannel === "office_nfc") {
        return [
          ...current.filter((existing) => existing.salesChannel !== "office_nfc"),
          { ...item, quantity: clampCartQuantity(item, item.quantity) },
        ];
      }
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
  }, [announceCartChange]);

  const updateQuantity = useCallback((priceId: string, color: string, quantity: number) => {
    announceCartChange(`Cart quantity updated to ${Math.max(1, Math.floor(quantity))}.`);
    setItems((current) =>
      current.map((item) =>
        item.priceId === priceId && item.color === color
          ? { ...item, quantity: clampCartQuantity(item, quantity) }
          : item,
      ),
    );
  }, [announceCartChange]);

  const removeItem = useCallback((priceId: string, color: string) => {
    announceCartChange("Item removed from your cart.");
    setItems((current) =>
      current.filter((item) => !(item.priceId === priceId && item.color === color)),
    );
  }, [announceCartChange]);

  const clearCart = useCallback(() => {
    setItems([]);
    announceCartChange("Cart cleared.");
  }, [announceCartChange]);

  const value = useMemo(
    () => ({
      items,
      cartHydrated: hydrated,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      checkoutEnabled,
    }),
    [addItem, checkoutEnabled, clearCart, hydrated, items, removeItem, updateQuantity],
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const visibleItemCount = hydrated ? itemCount : 0;
  const cartLabel = `Cart, ${visibleItemCount} item${visibleItemCount === 1 ? "" : "s"}`;

  return (
    <StoreContext.Provider value={value}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        <span key={cartAnnouncement.id}>{cartAnnouncement.text}</span>
      </div>
      <a className="skip-link" href="#main-content">Skip to content</a>
      {orderingUnavailable ? (
        <div className="test-banner" role="status">
          <span className="status-dot" aria-hidden="true" />
          Ordering is temporarily unavailable
        </div>
      ) : testMode ? (
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
          <div className="office-shell-actions">
            <span className="office-shell-label">Office rack <small>Private pilot</small></span>
            <Link className="office-cart-link" href="/cart" aria-label={cartLabel}>
              Cart <span className="cart-count" key={cartAnnouncement.id} aria-hidden="true">{visibleItemCount}</span>
            </Link>
          </div>
        ) : (
          <nav aria-label="Primary navigation">
            <Link
              className={pathname.startsWith("/products") ? "active" : ""}
              href="/products"
              aria-current={pathname.startsWith("/products") ? "page" : undefined}
            >
              Products
            </Link>
            <Link className="studio-nav-link" href="/#studio">How it’s made</Link>
            <Link
              className={pathname === "/cart" ? "active cart-link" : "cart-link"}
              href="/cart"
              aria-current={pathname === "/cart" ? "page" : undefined}
              aria-label={cartLabel}
            >
              Cart <span className="cart-count" key={cartAnnouncement.id} aria-hidden="true">{visibleItemCount}</span>
            </Link>
          </nav>
        )}
      </header>
      <main id="main-content" tabIndex={-1}>{children}</main>
      <footer className="site-footer">
        <div>
          <Link className="brand footer-brand" href="/" aria-label="Jake's 3D Print Shop home">
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
          <span>Help & the fine print</span>
          <a href={`mailto:${supportEmail}`}>{supportEmail}</a>
          <Link href="/policies/privacy">Privacy</Link>
          <Link href="/policies/terms">Terms</Link>
        </div>
      </footer>
    </StoreContext.Provider>
  );
}
