import axios from "axios";
import type { CartDto, CreateOrderDto, NftDto, NftListResponse, OrderDto, ProfileDto, QuoteItemDto, QuoteDto, SessionDto, WalletDto } from "./contracts";

export const api = axios.create({ baseURL: "/api", timeout: 8_000 });
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const session = window.localStorage.getItem("kurio-session");
    const user = session ? JSON.parse(session) as { email?: string } : null;
    if (user?.email) config.headers.set("X-Kurio-User", user.email);
    const scenario = window.localStorage.getItem("kurio-scenario") ?? window.sessionStorage.getItem("kurio-scenario");
    if (scenario) config.headers.set("X-Kurio-Scenario", scenario);
  }
  return config;
});
api.interceptors.response.use((response) => response, (error) => {
  if (typeof window !== "undefined" && error.response?.status === 401) {
    if (window.location.pathname === "/pagamento") window.sessionStorage.setItem("kurio-return-to", "/pagamento");
    window.dispatchEvent(new Event("kurio:session-expired"));
  }
  return Promise.reject(error);
});

export type CatalogFilters = { term: string; min: string; max: string; sort: string; page: number; };
export const getNfts = async ({ term, min, max, sort, page }: CatalogFilters) => {
  const response = await api.get<NftListResponse>("/nfts", { params: { search: term, min: min || "0", max: max || "99", sort, page } });
  return response.data;
};
export const getNft = async (id: string) => (await api.get<NftDto>(`/nfts/${id}`)).data;

export const getFavorites = async () => (await api.get<{ data: string[] }>("/favorites")).data.data;
export const createFavorite = async (id: string) => api.post("/favorites/" + id);
export const deleteFavorite = async (id: string) => api.delete("/favorites/" + id);

export const createSession = async (mode: "login" | "register", payload: { name?: string; email: string; password: string }) => (await api.post<SessionDto>("/session", { mode, ...payload })).data;
export const getSession = async () => (await api.get<Pick<SessionDto, "user">>("/session")).data;
export const closeSession = async () => api.delete("/session");
export const changePassword = async (currentPassword: string, newPassword: string) => api.patch("/session", { currentPassword, newPassword });
export const getQuote = async (items: QuoteItemDto[], coupon?: string) => (await api.post<QuoteDto>("/quote", { items, coupon })).data;
export const createOrder = async (payload: CreateOrderDto) => (await api.post<OrderDto>("/orders", payload, { headers: { "Idempotency-Key": payload.idempotencyKey } })).data;
export const getOrder = async (id: string) => (await api.get<OrderDto>(`/orders/${id}`)).data;
export const getProfile = async () => (await api.get<{ data: ProfileDto }>("/profile")).data.data;
export const saveProfile = async (payload: Pick<ProfileDto, "name" | "avatar">) => (await api.patch<{ data: ProfileDto }>("/profile", payload)).data.data;
export const getWallets = async () => (await api.get<{ data: WalletDto[] }>("/wallets")).data.data;
export const createWallet = async (payload: Omit<WalletDto, "id">) => (await api.post<{ data: WalletDto }>("/wallets", payload)).data.data;
export const updateWallet = async (id: string, payload: Omit<WalletDto, "id">) => (await api.patch<{ data: WalletDto }>(`/wallets/${id}`, payload)).data.data;
export const getCart = async () => (await api.get<{ data: CartDto[] }>("/cart")).data.data;
export const saveCart = async (items: CartDto[]) => (await api.put<{ data: CartDto[] }>("/cart", { items })).data.data;
export const resetMockScenario = async () => api.post("/scenario/reset");
