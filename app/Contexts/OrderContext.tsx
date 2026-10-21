"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "./CartContext";
import { subscribeToOrderUpdates } from "../services/realtime";
import { useAuth } from "./AuthContext";
import { getOrder } from "../services/api";

export type OrderStatus = "pending" | "confirmed" | "refused";
export type Order = { id: string; status: OrderStatus; items: CartItem[]; subtotal?: string; discount?: string; networkFee?: string; total: string; network: string; transaction?: string; version: number; };
type OrderContextValue = { orders: Order[]; saveOrder: (order: Order) => void; };
const OrderContext = createContext<OrderContextValue | null>(null);
const storageKey = (email?: string) => `kurio-orders:${email ?? "guest"}`;

export const OrderProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSessionReady } = useAuth();
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(() => {
    if (typeof window === "undefined") return [];
    const savedOrders = window.localStorage.getItem(storageKey());
    return savedOrders ? JSON.parse(savedOrders) as Order[] : [];
  });
  useEffect(() => {
    if (!isSessionReady) return;
    void Promise.resolve().then(() => {
      const savedOrders = window.localStorage.getItem(storageKey(user?.email));
      setOrders(savedOrders ? JSON.parse(savedOrders) as Order[] : []);
      setLoadedFor(user?.email ?? null);
    });
  }, [isSessionReady, user?.email]);
  useEffect(() => {
    if (!isSessionReady || !user || loadedFor !== user.email) return;
    window.localStorage.setItem(storageKey(user.email), JSON.stringify(orders));
  }, [isSessionReady, loadedFor, orders, user]);
  useEffect(() => {
    if (!user) return;
    const applyUpdate = (id: string, status: OrderStatus, transaction: string | undefined, version: number) => {
      setOrders((current) => current.map((order) => order.id === id && order.status === "pending" && version > (order.version ?? 0)
        ? { ...order, status, transaction, version }
        : order));
    };
    return subscribeToOrderUpdates((event) => {
      if (event.user === user.email) applyUpdate(event.id, event.status, event.transaction, event.version);
    }, {
      onReconnect: () => {
        const pendingOrders = orders.filter((order) => order.status === "pending");
        void Promise.all(pendingOrders.map((order) => getOrder(order.id).then((remoteOrder) => applyUpdate(remoteOrder.id, remoteOrder.status, remoteOrder.transaction, remoteOrder.version)).catch(() => undefined)));
      },
    });
  }, [orders, user]);
  useEffect(() => {
    if (!user || !orders.some((order) => order.status === "pending")) return;
    let active = true;
    const reconcilePendingOrders = () => {
      const pendingOrders = orders.filter((order) => order.status === "pending");
      void Promise.all(pendingOrders.map((order) => getOrder(order.id).then((remoteOrder) => {
        if (!active) return;
        setOrders((current) => current.map((entry) => entry.id === remoteOrder.id && entry.status === "pending" && remoteOrder.version > (entry.version ?? 0)
          ? { ...entry, status: remoteOrder.status, transaction: remoteOrder.transaction, version: remoteOrder.version }
          : entry));
      }).catch(() => undefined)));
    };
    reconcilePendingOrders();
    const interval = window.setInterval(reconcilePendingOrders, 1_000);
    return () => { active = false; window.clearInterval(interval); };
  }, [orders, user]);

  const value = useMemo(() => ({
    orders,
    saveOrder: (order: Order) => setOrders((current) => {
      const nextOrders = current.some((item) => item.id === order.id) ? current : [order, ...current];
      if (user?.email) window.localStorage.setItem(storageKey(user.email), JSON.stringify(nextOrders));
      return nextOrders;
    }),
  }), [orders, user]);
  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export const useOrders = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrders deve ser usado dentro de OrderProvider");
  return context;
};
