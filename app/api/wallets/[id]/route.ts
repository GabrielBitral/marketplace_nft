import { NextResponse } from "next/server";
import { getRequestUser, getWallets, isAuthorized, setWallets, type StoredWallet } from "../../_store";

export async function PATCH(request: Request, context: RouteContext<"/api/wallets/[id]">) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json() as Partial<StoredWallet>;
  const current = getWallets(email);
  const target = current.find((wallet) => wallet.id === id);
  if (!target) return NextResponse.json({ message: "Carteira não encontrada." }, { status: 404 });
  if (!body.name?.trim() || !/^0x[a-fA-F0-9.]{4,}$/.test(body.address?.trim() ?? "")) return NextResponse.json({ message: "Informe nome e endereço público válidos." }, { status: 422 });
  const entry = { ...target, ...body, id, name: body.name.trim(), address: (body.address ?? "").trim() };
  const next = entry.primary ? current.map((wallet) => wallet.id === id ? entry : { ...wallet, primary: false }) : current.map((wallet) => wallet.id === id ? entry : wallet);
  setWallets(email, next);
  return NextResponse.json({ data: entry });
}
