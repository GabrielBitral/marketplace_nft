import { NextResponse } from "next/server";
import { addFavorite, getRequestUser, isAuthorized, removeFavorite } from "../../_store";

export async function POST(request: Request, context: RouteContext<"/api/favorites/[id]">) {
  const email = getRequestUser(request);
  const { id } = await context.params;
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  if (id === "088") return NextResponse.json({ message: "Não foi possível salvar o favorito agora." }, { status: 503 });
  addFavorite(email, id);
  return NextResponse.json({ id }, { status: 201 });
}

export async function DELETE(request: Request, context: RouteContext<"/api/favorites/[id]">) {
  const email = getRequestUser(request);
  const { id } = await context.params;
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  removeFavorite(email, id);
  return new NextResponse(null, { status: 204 });
}
