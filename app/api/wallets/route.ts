import { NextResponse } from "next/server";
import { getRequestUser, getWallets, isAuthorized, setWallets, type StoredWallet } from "../_store";

export function GET(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  return NextResponse.json({ data: getWallets(email) });
}

export async function POST(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const body = await request.json() as Omit<StoredWallet, "id">;
  if (!body.name?.trim() || !/^0x[a-fA-F0-9.]{4,}$/.test(body.address?.trim() ?? "")) return NextResponse.json({ message: "Informe nome e endereço público válidos." }, { status: 422 });
  const current = getWallets(email);
  const entry: StoredWallet = { ...body, id: crypto.randomUUID(), name: body.name.trim(), address: body.address.trim(), primary: body.primary || current.length === 0 };
  const next = entry.primary ? [...current.map((item) => ({ ...item, primary: false })), entry] : [...current, entry];
  setWallets(email, next);
  return NextResponse.json({ data: entry }, { status: 201 });
}
