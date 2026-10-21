import type { NftDto } from "../services/contracts";
import { resetAccounts } from "./_accounts";
import { resetOrders } from "./_orders";
import { resetNftFixtures } from "../mocks/fixtures";

export type StoredUser = { name: string; email: string; avatar?: string; };
export type StoredWallet = { id: string; name: string; address: string; network: "Ethereum" | "Polygon"; primary: boolean; };
export type StoredCartItem = Pick<NftDto, "id" | "name" | "price" | "edition" | "color" | "accessory" | "available" | "version"> & { quantity: number; };

const profiles = new Map<string, StoredUser>();
const carts = new Map<string, StoredCartItem[]>();
const wallets = new Map<string, StoredWallet[]>();
const favorites = new Map<string, Set<string>>();

export const getRequestUser = (request: Request) => request.headers.get("x-kurio-user")?.toLowerCase() ?? "";
export const isAuthorized = (user: string) => Boolean(user) && user !== "expirada@kurio.io";
export const getProfile = (email: string) => {
  const existing = profiles.get(email);
  if (existing) return existing;
  const profile = { name: email.split("@")[0] || "colecionador", email };
  profiles.set(email, profile);
  return profile;
};
export const setProfile = (email: string, profile: StoredUser) => profiles.set(email, profile);
export const getCart = (email: string) => carts.get(email) ?? [];
export const setCart = (email: string, items: StoredCartItem[]) => carts.set(email, items);
export const getWallets = (email: string) => wallets.get(email) ?? [{ id: "primary", name: "MetaMask", address: "0x7D2F...8A91", network: "Ethereum", primary: true }];
export const setWallets = (email: string, entries: StoredWallet[]) => wallets.set(email, entries);
export const getFavorites = (email: string) => [...(favorites.get(email) ?? new Set<string>())];
export const addFavorite = (email: string, id: string) => {
  const entries = favorites.get(email) ?? new Set<string>();
  entries.add(id);
  favorites.set(email, entries);
};
export const removeFavorite = (email: string, id: string) => favorites.get(email)?.delete(id);
export const resetScenario = () => {
  profiles.clear();
  carts.clear();
  wallets.clear();
  favorites.clear();
  resetOrders();
  resetAccounts();
  resetNftFixtures();
};
