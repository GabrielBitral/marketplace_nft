"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Nft } from "../Components/NftCard";
import type { NftUpdatedEvent } from "../services/contracts";
import { getCart, saveCart } from "../services/api";
import { useAuth } from "./AuthContext";

export type CartItem = Nft & { quantity: number };
type CartContextValue = {
  items: CartItem[];
  addItem: (nft: Nft, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number, edition?: string) => void;
  removeItem: (id: string, edition?: string) => void;
  clearCart: () => void;
  removePurchasedItems: (purchased: Array<{ id: string; edition: string; quantity: number }>) => void;
  applyNftUpdate: (update: NftUpdatedEvent) => void;
  quoteRevision: number;
  updatedItemIds: string[];
  acknowledgeQuote: () => void;
  totalItems: number;
  coupon: string;
  setCoupon: (coupon: string) => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = (email?: string) => `kurio-cart:${email ?? "guest"}`;
const mergeItems = (...collections: CartItem[][]) => collections.flat().reduce<CartItem[]>((current, item) => {
  const existing = current.find((entry) => entry.id === item.id && entry.edition === item.edition);
  return existing ? current.map((entry) => entry.id === item.id && entry.edition === item.edition ? { ...entry, ...item, quantity: Math.min(existing.quantity + item.quantity, item.available ?? existing.available ?? 10) } : entry) : [...current, item];
}, []);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSessionReady } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => {
    return [];
  });
  const [isCartReady, setIsCartReady] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [quoteRevision, setQuoteRevision] = useState(0);
  const [updatedItemIds, setUpdatedItemIds] = useState<string[]>([]);
  const [coupon, setCoupon] = useState("");
  const itemsRef = useRef(items);
  const hydratedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!isSessionReady) return;
    let active = true;
    const readLocal = (key: string) => JSON.parse(window.localStorage.getItem(key) ?? (key === storageKey() ? window.localStorage.getItem("kurio-cart") : null) ?? "[]") as CartItem[];
    if (!user) {
      hydratedFor.current = null;
      void Promise.resolve().then(() => { if (active) { setItems(readLocal(storageKey())); setLoadedFor(null); setIsCartReady(true); } });
      return () => { active = false; };
    }
    if (hydratedFor.current === user.email) return () => { active = false; };
    hydratedFor.current = user.email;
    void getCart().then((remoteItems) => {
      if (!active) return;
      const mergedItems = mergeItems(readLocal(storageKey(user.email)), remoteItems as CartItem[], readLocal(storageKey()));
      setItems(mergedItems);
      setLoadedFor(user.email);
      window.localStorage.setItem(storageKey(user.email), JSON.stringify(mergedItems));
      window.localStorage.removeItem(storageKey());
      setIsCartReady(true);
    }).catch(() => {
      if (active) { setItems(readLocal(storageKey(user.email))); setLoadedFor(user.email); setIsCartReady(true); }
    });
    return () => { active = false; };
  }, [isSessionReady, user]);
  useEffect(() => {
    if (!isCartReady) return;
    if (loadedFor !== (user?.email ?? null)) return;
    window.localStorage.setItem(storageKey(user?.email), JSON.stringify(items));
    if (isSessionReady && user) void saveCart(items.map((item) => ({ ...item, available: item.available ?? 10, version: item.version ?? 1 }))).catch(() => undefined);
  }, [isCartReady, isSessionReady, items, loadedFor, user]);
  useEffect(() => { itemsRef.current = items; }, [items]);

  const value = useMemo(() => ({
    items,
    totalItems: items.reduce((total, item) => total + item.quantity, 0),
    addItem: (nft: Nft, quantity = 1) => setItems((current) => {
      const requestedQuantity = Math.min(Math.max(quantity, 1), nft.available ?? 10);
      const existing = current.find((item) => item.id === nft.id && item.edition === nft.edition);
      return existing
        ? current.map((item) => item.id === nft.id && item.edition === nft.edition ? { ...item, ...nft, quantity: Math.min(item.quantity + requestedQuantity, nft.available ?? 10) } : item)
        : [...current, { ...nft, quantity: requestedQuantity }];
    }),
    updateQuantity: (id: string, quantity: number, edition?: string) => setItems((current) => quantity < 1 ? current.filter((item) => item.id !== id || (edition !== undefined && item.edition !== edition)) : current.map((item) => item.id === id && (edition === undefined || item.edition === edition) ? { ...item, quantity: Math.min(quantity, item.available ?? 10) } : item)),
    removeItem: (id: string, edition?: string) => setItems((current) => current.filter((item) => item.id !== id || (edition !== undefined && item.edition !== edition))),
    clearCart: () => setItems([]),
    removePurchasedItems: (purchased: Array<{ id: string; edition: string; quantity: number }>) => setItems((current) => {
      const nextItems = current.flatMap((item) => {
        const purchasedItem = purchased.find((entry) => entry.id === item.id && entry.edition === item.edition);
        if (!purchasedItem) return [item];
        const quantity = item.quantity - purchasedItem.quantity;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      });
      window.localStorage.setItem(storageKey(user?.email), JSON.stringify(nextItems));
      if (user) void saveCart(nextItems.map((item) => ({ ...item, available: item.available ?? 10, version: item.version ?? 1 }))).catch(() => undefined);
      return nextItems;
    }),
    applyNftUpdate: (update: NftUpdatedEvent) => {
      const affected = itemsRef.current.some((item) => item.id === update.id && (item.version === undefined || update.version > item.version));
      if (!affected) return;
      setItems((current) => current.map((item) => item.id === update.id && (item.version === undefined || update.version > item.version) ? { ...item, price: update.price, available: update.available, version: update.version, quantity: Math.min(item.quantity, update.available) } : item));
      setQuoteRevision((currentRevision) => currentRevision + 1);
      setUpdatedItemIds((ids) => [...new Set([...ids, update.id])]);
    },
    quoteRevision,
    updatedItemIds,
    acknowledgeQuote: () => setUpdatedItemIds([]),
    coupon,
    setCoupon,
  }), [coupon, items, quoteRevision, updatedItemIds, user]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart deve ser usado dentro de CartProvider");
  return context;
};
