import { NextResponse } from "next/server";
import { getCart, getRequestUser, isAuthorized, setCart, type StoredCartItem } from "../_store";

export function GET(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  return NextResponse.json({ data: getCart(email) });
}

export async function PUT(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const body = await request.json() as { items?: StoredCartItem[]; };
  if (!Array.isArray(body.items) || body.items.some((item) => !item.id || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > item.available)) return NextResponse.json({ message: "Carrinho inválido ou com itens indisponíveis." }, { status: 409 });
  setCart(email, body.items);
  return NextResponse.json({ data: body.items });
}
