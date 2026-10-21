"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getWallets } from "../services/api";
import { useAuth } from "./AuthContext";

export type Wallet = { id: string; name: string; address: string; network: "Ethereum" | "Polygon"; primary: boolean; };
type WalletContextValue = { wallets: Wallet[]; saveWallet: (wallet: Omit<Wallet, "id"> & { id?: string }) => void; };
const WalletContext = createContext<WalletContextValue | null>(null);
const storageKey = (email: string) => `kurio-wallets:${email}`;

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { user, isSessionReady } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  useEffect(() => {
    if (!isSessionReady) return;
    if (!user) { void Promise.resolve().then(() => { setWallets([]); setLoadedFor(null); }); return; }
    let active = true;
    void getWallets().then((entries) => {
      if (!active) return;
      const savedWallets = JSON.parse(window.localStorage.getItem(storageKey(user.email)) ?? "[]") as Wallet[];
      const mergedWallets = [...savedWallets, ...entries.filter((wallet) => !savedWallets.some((savedWallet) => savedWallet.id === wallet.id))];
      setWallets(mergedWallets);
      setLoadedFor(user.email);
      window.localStorage.setItem(storageKey(user.email), JSON.stringify(mergedWallets));
    }).catch(() => {
      if (!active) return;
      const savedWallets = window.localStorage.getItem(storageKey(user.email));
      setWallets(savedWallets ? JSON.parse(savedWallets) as Wallet[] : []);
      setLoadedFor(user.email);
    });
    return () => { active = false; };
  }, [isSessionReady, user]);
  useEffect(() => { if (user && loadedFor === user.email) window.localStorage.setItem(storageKey(user.email), JSON.stringify(wallets)); }, [loadedFor, user, wallets]);
  const value = useMemo(() => ({ wallets, saveWallet: (wallet: Omit<Wallet, "id"> & { id?: string }) => {
    setWallets((current) => {
      const entry = { ...wallet, id: wallet.id ?? crypto.randomUUID() } as Wallet;
      const normalized = entry.primary ? current.map((item) => ({ ...item, primary: false })) : current;
      const nextWallets = normalized.some((item) => item.id === entry.id) ? normalized.map((item) => item.id === entry.id ? entry : item) : [...normalized, entry];
      if (user) window.localStorage.setItem(storageKey(user.email), JSON.stringify(nextWallets));
      return nextWallets;
    });
  } }), [user, wallets]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
export const useWallets = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error("useWallets deve ser usado dentro de WalletProvider");
  return context;
};
