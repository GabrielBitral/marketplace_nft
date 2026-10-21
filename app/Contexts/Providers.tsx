"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { CartProvider } from "./CartContext";
import { AuthProvider } from "./AuthContext";

let mockWorkerStart: Promise<void> | undefined;

const startMockWorker = () => {
  const workerStart = mockWorkerStart ??= import("../mocks/browser").then(({ worker }) => worker.start({ onUnhandledRequest: "bypass" })).then(() => undefined);
  return workerStart;
};

const Providers = ({ children }: { children: ReactNode }) => {
  const [mocksReady, setMocksReady] = useState(process.env.NEXT_PUBLIC_USE_MSW !== "true");
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
  }));
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_USE_MSW === "true") {
      void startMockWorker().then(() => setMocksReady(true));
    }
  }, []);
  useEffect(() => {
    const clearPrivateCache = () => queryClient.clear();
    window.addEventListener("kurio:session-ended", clearPrivateCache);
    return () => window.removeEventListener("kurio:session-ended", clearPrivateCache);
  }, [queryClient]);

  if (typeof window !== "undefined" && !mocksReady) return null;
  return <QueryClientProvider client={queryClient}><AuthProvider><CartProvider>{children}</CartProvider></AuthProvider></QueryClientProvider>;
};

export default Providers;
