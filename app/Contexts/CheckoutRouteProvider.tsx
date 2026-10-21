"use client";

import type { ReactNode } from "react";
import { OrderProvider } from "./OrderContext";
import { WalletProvider } from "./WalletContext";

const CheckoutRouteProvider = ({ children }: { children: ReactNode }) => <WalletProvider><OrderProvider>{children}</OrderProvider></WalletProvider>;

export default CheckoutRouteProvider;
