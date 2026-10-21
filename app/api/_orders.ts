import type { OrderDto } from "../services/contracts";

export type StoredOrder = { signature: string; order: OrderDto; };

export const orders = new Map<string, StoredOrder>();

export const resetOrders = () => orders.clear();

export const findOrder = (id: string, email: string) => [...orders.entries()].find(([key, entry]) => key.startsWith(`${email}:`) && entry.order.id === id)?.[1].order;
