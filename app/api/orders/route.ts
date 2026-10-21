import { NextResponse } from "next/server";
import { nftFixtures } from "../../mocks/fixtures";
import { orders } from "../_orders";
import type { OrderDto } from "../../services/contracts";
import { getRequestUser, isAuthorized } from "../_store";
import { calculateEthQuote, formatEth, multiplyEth } from "../../services/eth";
import { getScenario, isUnavailableScenario } from "../../services/scenario";

export async function POST(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const scenario = getScenario(request.headers);
  if (isUnavailableScenario(scenario)) return NextResponse.json({ message: "Serviço de pedidos temporariamente indisponível." }, { status: 503 });
  const body = await request.json() as { idempotencyKey?: string; items?: Array<{ id: string; edition: string; quantity: number; }>; coupon?: string; network?: "ethereum" | "polygon"; walletId?: string; };
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? body.idempotencyKey;
  if (!idempotencyKey || !body.items?.length || !body.network || !body.walletId) return NextResponse.json({ message: "Dados de pedido incompletos." }, { status: 422 });
  const signature = JSON.stringify({ items: body.items, coupon: body.coupon ?? "", network: body.network, walletId: body.walletId });
  const orderKey = `${email}:${idempotencyKey}`;
  const previous = orders.get(orderKey);
  if (previous) return previous.signature === signature ? NextResponse.json(previous.order) : NextResponse.json({ message: "A chave de idempotência já foi usada em outro pedido." }, { status: 409 });
  const items = body.items.map((item) => {
    const nft = nftFixtures.find((entry) => entry.id === item.id);
    const selectedEdition = nft?.editions?.find((edition) => edition.value === item.edition);
    const available = selectedEdition?.available ?? (item.edition === nft?.edition ? nft.available : 0);
    if (!nft || item.quantity < 1 || item.quantity > available) return null;
    return { ...item, name: nft.name, unitPrice: nft.price, total: formatEth(multiplyEth(nft.price, item.quantity)) };
  });
  if (items.some((item) => !item)) return NextResponse.json({ message: "A cotação mudou. Revise o pedido antes de confirmar." }, { status: 409 });
  const confirmedItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const quote = calculateEthQuote(confirmedItems, body.coupon);
  const order: OrderDto = { id: "KUR-" + crypto.randomUUID().slice(0, 8).toUpperCase(), status: scenario === "payment-refused" ? "refused" : "pending", items: confirmedItems, ...quote, network: body.network, version: 1 };
  orders.set(orderKey, { signature, order });
  if (scenario === "timeout-after-order") return NextResponse.json({ message: "A confirmação demorou mais que o esperado. Tente novamente para recuperar seu pedido." }, { status: 504 });
  return NextResponse.json(order, { status: 201 });
}
