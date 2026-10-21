import { NextResponse } from "next/server";
import { findOrder } from "../../_orders";
import { getRequestUser, isAuthorized } from "../../_store";

export async function GET(_request: Request, context: RouteContext<"/api/orders/[id]">) {
  const email = getRequestUser(_request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const { id } = await context.params;
  const order = findOrder(id, email);
  return order ? NextResponse.json(order) : NextResponse.json({ message: "Pedido não encontrado." }, { status: 404 });
}
