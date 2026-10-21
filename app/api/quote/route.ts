import { NextResponse } from "next/server";
import { nftFixtures } from "../../mocks/fixtures";
import { calculateEthQuote, formatEth, multiplyEth } from "../../services/eth";
import { getScenario, isUnavailableScenario, waitForScenario } from "../../services/scenario";

export async function POST(request: Request) {
  const scenario = getScenario(request.headers);
  await waitForScenario(scenario);
  if (isUnavailableScenario(scenario)) return NextResponse.json({ message: "Serviço de cotação temporariamente indisponível." }, { status: 503 });
  if (scenario === "quote-changed") return NextResponse.json({ message: "A cotação mudou. Revise o pedido antes de confirmar." }, { status: 409 });
  const body = await request.json() as { items?: Array<{ id: string; edition: string; quantity: number; }>; coupon?: string; };
  const requestedItems = body.items ?? [];
  if (!requestedItems.length) return NextResponse.json({ message: "Adicione um NFT ao carrinho." }, { status: 422 });
  const items = requestedItems.map((item) => {
    const nft = nftFixtures.find((entry) => entry.id === item.id);
    const selectedEdition = nft?.editions?.find((edition) => edition.value === item.edition);
    const available = selectedEdition?.available ?? (item.edition === nft?.edition ? nft.available : 0);
    if (!nft || item.quantity < 1 || item.quantity > available) return null;
    const unitPrice = nft.price;
    return { ...item, name: nft.name, unitPrice, total: formatEth(multiplyEth(unitPrice, item.quantity)) };
  });
  if (items.some((item) => !item)) return NextResponse.json({ message: "Um item não está mais disponível na edição selecionada." }, { status: 409 });
  const typedItems = items.filter((item): item is NonNullable<typeof item> => Boolean(item));
  const coupon = body.coupon?.trim().toUpperCase();
  if (coupon && coupon !== "KURIO10") return NextResponse.json({ message: "Código inválido ou expirado." }, { status: 422 });
  return NextResponse.json({ items: typedItems, ...calculateEthQuote(typedItems, coupon), valid: true });
}
