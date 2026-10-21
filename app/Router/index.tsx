"use client";

import { createRootRoute, createRoute, createRouter, Navigate, Outlet, RouterProvider } from "@tanstack/react-router";
import dynamic from "next/dynamic";
import { useSyncExternalStore, type ReactNode } from "react";
import { useAuth } from "../Contexts/AuthContext";

const RouteLoading = () => <InitialMarketplace />;
const AccountForm = dynamic(() => import("../Components/AccountForm"), { loading: RouteLoading });
const Carteiras = dynamic(() => import("../Pages/Carteiras"), { loading: RouteLoading });
const Carrinho = dynamic(() => import("../Pages/Carrinho"), { loading: RouteLoading });
const DetalheNft = dynamic(() => import("../Pages/DetalheNft"), { loading: RouteLoading });
const Marketplace = dynamic(() => import("../Pages/Marketplace"), { loading: RouteLoading });
const Pagamento = dynamic(() => import("../Pages/Pagamento"), { loading: RouteLoading });
const Pedido = dynamic(() => import("../Pages/Pedido"), { loading: RouteLoading });
const Perfil = dynamic(() => import("../Pages/Perfil"), { loading: RouteLoading });
const WalletRouteProvider = dynamic(() => import("../Contexts/WalletRouteProvider"), { loading: RouteLoading });
const CheckoutRouteProvider = dynamic(() => import("../Contexts/CheckoutRouteProvider"), { loading: RouteLoading });
const OrderRouteProvider = dynamic(() => import("../Contexts/OrderRouteProvider"), { loading: RouteLoading });

export type CatalogSearch = {
  search?: string;
  min?: string;
  max?: string;
  sort?: "recent" | "price-asc" | "price-desc";
  page?: number;
};

const rootRoute = createRootRoute({ component: Outlet, notFoundComponent: () => <main className="route-message"><h1>Página não encontrada</h1></main> });
const InitialMarketplace = () => <main className="initialMarketplace" aria-label="Carregando marketplace">
  <header><span>KURIO</span><nav aria-label="Navegação principal"><span>Explorar</span><span>Coleções</span><span>Artistas</span></nav></header>
  <section><div><p>Bem-vindo à Kurio</p><h1>SEJA DONO DO FUTURO<br />DA ARTE DIGITAL</h1><span>Descubra NFTs selecionados de criadores do mundo todo.</span></div><i aria-hidden="true">⌁</i></section>
</main>;
const PrivatePage = ({ children }: { children: React.ReactNode }) => {
  const { user, isSessionReady } = useAuth();
  if (!isSessionReady) return <main className="route-message">Restaurando sua sessão...</main>;
  return user ? children : <Navigate to="/login" />;
};
const catalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): CatalogSearch => ({
    search: typeof search.search === "string" ? search.search : undefined,
    min: typeof search.min === "string" ? search.min : undefined,
    max: typeof search.max === "string" ? search.max : undefined,
    sort: search.sort === "price-asc" || search.sort === "price-desc" || search.sort === "recent" ? search.sort : undefined,
    page: typeof search.page === "number" && search.page > 0 ? search.page : typeof search.page === "string" && Number(search.page) > 0 ? Number(search.page) : undefined,
  }),
  component: () => <Marketplace />,
});
const nftRoute = createRoute({ getParentRoute: () => rootRoute, path: "/nft/$nftId", component: () => <DetalheNft /> });
const cartRoute = createRoute({ getParentRoute: () => rootRoute, path: "/carrinho", component: () => <Carrinho /> });
const checkoutRoute = createRoute({ getParentRoute: () => rootRoute, path: "/pagamento", component: () => <PrivatePage><CheckoutRouteProvider><Pagamento /></CheckoutRouteProvider></PrivatePage> });
const orderRoute = createRoute({ getParentRoute: () => rootRoute, path: "/pedido/$orderId", component: () => <PrivatePage><OrderRouteProvider><Pedido /></OrderRouteProvider></PrivatePage> });
const loginRoute = createRoute({ getParentRoute: () => rootRoute, path: "/login", component: () => <AccountForm mode="login" /> });
const registerRoute = createRoute({ getParentRoute: () => rootRoute, path: "/cadastro", component: () => <AccountForm mode="register" /> });
const profileRoute = createRoute({ getParentRoute: () => rootRoute, path: "/perfil", component: () => <PrivatePage><Perfil /></PrivatePage> });
const walletsRoute = createRoute({ getParentRoute: () => rootRoute, path: "/carteiras", component: () => <PrivatePage><WalletRouteProvider><Carteiras /></WalletRouteProvider></PrivatePage> });

const routeTree = rootRoute.addChildren([catalogRoute, nftRoute, cartRoute, checkoutRoute, orderRoute, loginRoute, registerRoute, profileRoute, walletsRoute]);
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  parseSearch: (search) => Object.fromEntries(new URLSearchParams(search)),
  stringifySearch: (search) => {
    const params = new URLSearchParams();
    Object.entries(search).forEach(([key, value]) => { if (value !== undefined) params.set(key, String(value)); });
    const query = params.toString();
    return query ? `?${query}` : "";
  },
});

declare module "@tanstack/react-router" {
  interface Register { router: typeof router; }
}

const MarketplaceRouter = ({ fallback }: { fallback?: ReactNode }) => {
  const isClientReady = useSyncExternalStore(() => () => undefined, () => true, () => false);
  if (!isClientReady) return fallback ?? <InitialMarketplace />;
  return <RouterProvider router={router} />;
};

export default MarketplaceRouter;
