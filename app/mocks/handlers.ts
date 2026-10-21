import { http, HttpResponse, ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { nftFixtures, resetNftFixtures, updateNftFixture } from "./fixtures";
import type { OrderDto } from "../services/contracts";
import { clearMockState, readMockState, saveMockState } from "./storage";
import { calculateEthQuote, compareEth, formatEth, multiplyEth } from "../services/eth";
import { hashPassword, passwordMatches } from "../services/password";
import { getScenario, isUnavailableScenario, waitForScenario } from "../services/scenario";

const socket = ws.link("wss://api.kurio.local/socket.io");
const realtimeConnections = new Set<ReturnType<typeof toSocketIo>>();
const favorites = new Map<string, Set<string>>();
type MockAccount = { name: string; email: string; avatar?: string; passwordHash: string; };
const initialAccounts: MockAccount[] = [
  { name: "colecionador", email: "colecionador@kurio.io", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
  { name: "Conta existente", email: "existente@kurio.io", passwordHash: "8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92" },
];
const accounts = new Map<string, MockAccount>(initialAccounts.map((account) => [account.email, { ...account }]));
const orders = new Map<string, { signature: string; order: OrderDto; }>();
const profiles = new Map<string, { name: string; email: string; avatar?: string; }>();
const carts = new Map<string, Array<(typeof nftFixtures)[number] & { quantity: number }>>();
const wallets = new Map<string, Array<{ id: string; name: string; address: string; network: "Ethereum" | "Polygon"; primary: boolean }>>();
const currentUser = (request: Request) => request.headers.get("x-kurio-user")?.toLowerCase() ?? "";
const unauthorized = (email: string) => !email || email === "expirada@kurio.io";
const orderStorageKey = "orders";
const loadOrders = async () => new Map<string, { signature: string; order: OrderDto; }>(await readMockState<Array<[string, { signature: string; order: OrderDto; }]>>(orderStorageKey, []));
const persistOrders = async (entries: Map<string, { signature: string; order: OrderDto; }>) => saveMockState(orderStorageKey, [...entries.entries()]);
const resetAccounts = () => {
  accounts.clear();
  initialAccounts.forEach((account) => accounts.set(account.email, { ...account }));
};
const scheduleOrderConfirmation = (orderKey: string) => {
  setTimeout(() => {
    const entry = orders.get(orderKey);
    if (!entry || entry.order.status !== "pending") return;
    const completedOrder = { ...entry.order, status: "confirmed" as const, transaction: "0x7D2F4C8A91", version: entry.order.version + 1 };
    orders.set(orderKey, { ...entry, order: completedOrder });
    void loadOrders().then((persistedOrders) => {
      persistedOrders.set(orderKey, { ...entry, order: completedOrder });
      return persistOrders(persistedOrders);
    });
    const user = orderKey.slice(0, orderKey.lastIndexOf(":"));
    realtimeConnections.forEach((io) => io.server.emit("order.updated", { id: completedOrder.id, status: completedOrder.status, transaction: completedOrder.transaction, version: completedOrder.version, user }));
  }, 1_200);
};

export const handlers = [
  http.post("/api/scenario/reset", async () => { favorites.clear(); orders.clear(); profiles.clear(); carts.clear(); wallets.clear(); resetAccounts(); resetNftFixtures(); await clearMockState(); return HttpResponse.json({ ok: true }); }),
  http.get("/api/profile", ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const profile = profiles.get(email) ?? { name: email.split("@")[0], email };
    profiles.set(email, profile);
    return HttpResponse.json({ data: profile });
  }),
  http.patch("/api/profile", async ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const body = await request.json() as { name?: string; avatar?: string; };
    if (!body.name?.trim() || body.name.trim().length < 2) return HttpResponse.json({ message: "Informe um nome público válido." }, { status: 422 });
    const profile = { name: body.name.trim(), email, avatar: body.avatar?.trim() || undefined };
    profiles.set(email, profile);
    const account = accounts.get(email);
    if (account) accounts.set(email, { ...account, name: profile.name, avatar: profile.avatar });
    return HttpResponse.json({ data: profile });
  }),
  http.get("/api/wallets", ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    return HttpResponse.json({ data: wallets.get(email) ?? [{ id: "primary", name: "MetaMask", address: "0x7D2F...8A91", network: "Ethereum", primary: true }] });
  }),
  http.post("/api/wallets", async ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const body = await request.json() as { name?: string; address?: string; network?: "Ethereum" | "Polygon"; primary?: boolean; };
    if (!body.name?.trim() || !/^0x[a-fA-F0-9.]{4,}$/.test(body.address?.trim() ?? "")) return HttpResponse.json({ message: "Informe nome e endereço público válidos." }, { status: 422 });
    const current = wallets.get(email) ?? [];
    const entry = { id: crypto.randomUUID(), name: body.name.trim(), address: (body.address ?? "").trim(), network: body.network ?? "Ethereum", primary: body.primary || current.length === 0 };
    wallets.set(email, entry.primary ? [...current.map((wallet) => ({ ...wallet, primary: false })), entry] : [...current, entry]);
    return HttpResponse.json({ data: entry }, { status: 201 });
  }),
  http.patch("/api/wallets/:id", async ({ request, params }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const id = String(params.id);
    const body = await request.json() as { name?: string; address?: string; network?: "Ethereum" | "Polygon"; primary?: boolean; };
    const current = wallets.get(email) ?? [];
    const target = current.find((wallet) => wallet.id === id);
    if (!target) return HttpResponse.json({ message: "Carteira não encontrada." }, { status: 404 });
    if (!body.name?.trim() || !/^0x[a-fA-F0-9.]{4,}$/.test(body.address?.trim() ?? "")) return HttpResponse.json({ message: "Informe nome e endereço público válidos." }, { status: 422 });
    const entry = { ...target, ...body, id, name: body.name.trim(), address: (body.address ?? "").trim() };
    wallets.set(email, entry.primary ? current.map((wallet) => wallet.id === id ? entry : { ...wallet, primary: false }) : current.map((wallet) => wallet.id === id ? entry : wallet));
    return HttpResponse.json({ data: entry });
  }),
  http.get("/api/cart", ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    return HttpResponse.json({ data: carts.get(email) ?? [] });
  }),
  http.put("/api/cart", async ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const body = await request.json() as { items?: Array<(typeof nftFixtures)[number] & { quantity: number }>; };
    if (!Array.isArray(body.items) || body.items.some((item) => item.quantity < 1 || item.quantity > item.available)) return HttpResponse.json({ message: "Carrinho inválido ou com itens indisponíveis." }, { status: 409 });
    carts.set(email, body.items);
    return HttpResponse.json({ data: body.items });
  }),
  http.get("/api/session", ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email) || !accounts.has(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const account = accounts.get(email)!;
    return HttpResponse.json({ user: { name: account.name, email: account.email, avatar: account.avatar } });
  }),
  http.delete("/api/session", () => new HttpResponse(null, { status: 204 })),
  http.patch("/api/session", async ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email) || !accounts.has(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const body = await request.json() as { currentPassword?: string; newPassword?: string; };
    const account = accounts.get(email)!;
    if (!await passwordMatches(body.currentPassword ?? "", account.passwordHash)) return HttpResponse.json({ message: "Senha atual inválida." }, { status: 422 });
    if (!body.newPassword || body.newPassword.length < 6) return HttpResponse.json({ message: "A nova senha deve ter ao menos 6 caracteres." }, { status: 422 });
    accounts.set(email, { ...account, passwordHash: await hashPassword(body.newPassword) });
    return HttpResponse.json({ ok: true });
  }),
  http.post("/api/session", async ({ request }) => {
    const body = await request.json() as { mode?: string; name?: string; email?: string; password?: string; };
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";
    if (!email.includes("@") || password.length < 6) return HttpResponse.json({ message: "Informe um e-mail válido e uma senha com ao menos 6 caracteres." }, { status: 422 });
    const existing = accounts.get(email);
    if (body.mode === "register") {
      if (!body.name?.trim() || body.name.trim().length < 2) return HttpResponse.json({ message: "Informe seu nome." }, { status: 422 });
      if (existing) return HttpResponse.json({ message: "Este e-mail já possui uma conta." }, { status: 409 });
      accounts.set(email, { name: body.name.trim(), email, passwordHash: await hashPassword(password) });
    } else if (existing && !await passwordMatches(password, existing.passwordHash)) return HttpResponse.json({ message: "E-mail ou senha inválidos." }, { status: 401 });
    const account = accounts.get(email) ?? { name: email.split("@")[0], email, passwordHash: await hashPassword(password) };
    if (!accounts.has(email)) accounts.set(email, account);
    return HttpResponse.json({ user: { name: account.name, email: account.email, avatar: account.avatar }, token: `session-${email}` });
  }),
  http.post("/api/orders", async ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const scenario = getScenario(request.headers);
    if (isUnavailableScenario(scenario)) return HttpResponse.json({ message: "Serviço de pedidos temporariamente indisponível." }, { status: 503 });
    const body = await request.json() as { idempotencyKey?: string; items?: Array<{ id: string; edition: string; quantity: number; }>; coupon?: string; network?: "ethereum" | "polygon"; walletId?: string; };
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? body.idempotencyKey;
    if (!idempotencyKey || !body.items?.length || !body.network || !body.walletId) return HttpResponse.json({ message: "Dados de pedido incompletos." }, { status: 422 });
    const signature = JSON.stringify({ items: body.items, coupon: body.coupon ?? "", network: body.network, walletId: body.walletId });
    const orderKey = `${email}:${idempotencyKey}`;
    const persistedOrders = await loadOrders();
    const previous = orders.get(orderKey) ?? persistedOrders.get(orderKey);
    if (previous) return previous.signature === signature ? HttpResponse.json(previous.order) : HttpResponse.json({ message: "A chave de idempotência já foi usada em outro pedido." }, { status: 409 });
    const items = body.items.map((item) => {
      const nft = nftFixtures.find((entry) => entry.id === item.id);
      const selectedEdition = nft?.editions?.find((edition) => edition.value === item.edition);
      const available = selectedEdition?.available ?? (item.edition === nft?.edition ? nft.available : 0);
      return !nft || item.quantity < 1 || item.quantity > available ? null : { ...item, name: nft.name, unitPrice: nft.price, total: formatEth(multiplyEth(nft.price, item.quantity)) };
    });
    if (items.some((item) => !item)) return HttpResponse.json({ message: "A cotação mudou. Revise o pedido antes de confirmar." }, { status: 409 });
    const confirmedItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item));
    const quote = calculateEthQuote(confirmedItems, body.coupon);
    const order: OrderDto = { id: "KUR-" + crypto.randomUUID().slice(0, 8).toUpperCase(), status: scenario === "payment-refused" ? "refused" : "pending", items: confirmedItems, ...quote, network: body.network, version: 1 };
    persistedOrders.set(orderKey, { signature, order });
    orders.set(orderKey, { signature, order });
    await persistOrders(persistedOrders);
    if (order.status === "pending") scheduleOrderConfirmation(orderKey);
    if (scenario === "timeout-after-order") return HttpResponse.json({ message: "A confirmação demorou mais que o esperado. Tente novamente para recuperar seu pedido." }, { status: 504 });
    return HttpResponse.json(order, { status: 201 });
  }),
  http.get("/api/orders/:id", async ({ params, request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const persistedOrders = await loadOrders();
    const order = [...persistedOrders.entries()].find(([key, entry]) => key.startsWith(`${email}:`) && entry.order.id === String(params.id))?.[1].order;
    return order ? HttpResponse.json(order) : HttpResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
  }),
  http.post("/api/quote", async ({ request }) => {
    const scenario = getScenario(request.headers);
    await waitForScenario(scenario);
    if (isUnavailableScenario(scenario)) return HttpResponse.json({ message: "Serviço de cotação temporariamente indisponível." }, { status: 503 });
    if (scenario === "quote-changed") return HttpResponse.json({ message: "A cotação mudou. Revise o pedido antes de confirmar." }, { status: 409 });
    const body = await request.json() as { items?: Array<{ id: string; edition: string; quantity: number; }>; coupon?: string; };
    const requestedItems = body.items ?? [];
    if (!requestedItems.length) return HttpResponse.json({ message: "Adicione um NFT ao carrinho." }, { status: 422 });
    const items = requestedItems.map((item) => {
      const nft = nftFixtures.find((entry) => entry.id === item.id);
      const selectedEdition = nft?.editions?.find((edition) => edition.value === item.edition);
      const available = selectedEdition?.available ?? (item.edition === nft?.edition ? nft.available : 0);
      return !nft || item.quantity < 1 || item.quantity > available ? null : { ...item, name: nft.name, unitPrice: nft.price, total: formatEth(multiplyEth(nft.price, item.quantity)) };
    });
    if (items.some((item) => !item)) return HttpResponse.json({ message: "Um item não está mais disponível na edição selecionada." }, { status: 409 });
    const confirmedItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item));
    const coupon = body.coupon?.trim().toUpperCase();
    if (coupon && coupon !== "KURIO10") return HttpResponse.json({ message: "Código inválido ou expirado." }, { status: 422 });
    return HttpResponse.json({ items: confirmedItems, ...calculateEthQuote(confirmedItems, coupon), valid: true });
  }),
  http.get("/api/nfts", async ({ request }) => {
    const params = new URL(request.url).searchParams;
    const scenario = getScenario(request.headers);
    await waitForScenario(scenario, params.get("page") === "1" ? "first" : "next");
    if (isUnavailableScenario(scenario)) return HttpResponse.json({ message: "Catálogo temporariamente indisponível." }, { status: 503 });
    const query = params.get("search")?.toLowerCase() ?? "";
    const sort = params.get("sort") ?? "recent";
    const page = Number(params.get("page") ?? "1");
    const min = params.get("min") || "0";
    const max = params.get("max") || "99";
    const filtered = nftFixtures.filter((nft) => nft.name.toLowerCase().includes(query) && compareEth(nft.price, min) >= 0 && compareEth(nft.price, max) <= 0);
    const sorted = [...filtered].sort((first, second) => sort === "price-asc" ? compareEth(first.price, second.price) : sort === "price-desc" ? compareEth(second.price, first.price) : first.id.localeCompare(second.id));
    const data = sorted.slice((page - 1) * 4, page * 4);
    return HttpResponse.json({ data, total: filtered.length });
  }),
  http.get("/api/nfts/:id", ({ params }) => {
    const nft = nftFixtures.find((item) => item.id === String(params.id));
    return nft ? HttpResponse.json(nft) : HttpResponse.json({ message: "NFT não encontrado." }, { status: 404 });
  }),
  http.get("/api/favorites", ({ request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    return HttpResponse.json({ data: [...(favorites.get(email) ?? new Set<string>())] });
  }),
  http.post("/api/favorites/:id", ({ params, request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    const id = String(params.id);
    if (id === "088") return HttpResponse.json({ message: "Não foi possível salvar o favorito agora." }, { status: 503 });
    const entries = favorites.get(email) ?? new Set<string>();
    entries.add(id);
    favorites.set(email, entries);
    return HttpResponse.json({ id }, { status: 201 });
  }),
  http.delete("/api/favorites/:id", ({ params, request }) => {
    const email = currentUser(request);
    if (unauthorized(email)) return HttpResponse.json({ message: "Sessão expirada." }, { status: 401 });
    favorites.get(email)?.delete(String(params.id));
    return new HttpResponse(null, { status: 204 });
  }),
  socket.addEventListener("connection", (connection) => {
    const io = toSocketIo(connection);
    realtimeConnections.add(io);
    io.client.on("catalog.subscribe", (_event, payload?: { scenario?: string }) => {
      if (payload?.scenario === "stale-events") {
        setTimeout(() => {
          const update = { id: "042", price: "1.31", available: 2, version: 3 };
          updateNftFixture(update);
          io.server.emit("nft.updated", update);
        }, 150);
        setTimeout(() => io.server.emit("nft.updated", { id: "042", price: "1.27", available: 3, version: 2 }), 300);
        return;
      }
      setTimeout(() => {
        const update = { id: "042", price: "1.27", available: 3, version: 2 };
        updateNftFixture(update);
        io.server.emit("nft.updated", update);
      }, 6_000);
    });
    io.client.on("order.create", () => undefined);
  }),
];
