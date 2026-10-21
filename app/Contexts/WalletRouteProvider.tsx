"use client";

import type { ReactNode } from "react";
import { WalletProvider } from "./WalletContext";

const WalletRouteProvider = ({ children }: { children: ReactNode }) => <WalletProvider>{children}</WalletProvider>;

export default WalletRouteProvider;
