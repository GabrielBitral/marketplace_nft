"use client";

import type { ReactNode } from "react";
import { OrderProvider } from "./OrderContext";

const OrderRouteProvider = ({ children }: { children: ReactNode }) => <OrderProvider>{children}</OrderProvider>;

export default OrderRouteProvider;
