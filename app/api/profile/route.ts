import { NextResponse } from "next/server";
import { getProfile, getRequestUser, isAuthorized, setProfile } from "../_store";
import { accounts } from "../_accounts";

export function GET(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  return NextResponse.json({ data: getProfile(email) });
}

export async function PATCH(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const body = await request.json() as { name?: string; avatar?: string; };
  if (!body.name?.trim() || body.name.trim().length < 2) return NextResponse.json({ message: "Informe um nome público válido." }, { status: 422 });
  const profile = { ...getProfile(email), name: body.name.trim(), avatar: body.avatar?.trim() || undefined };
  setProfile(email, profile);
  const account = accounts.get(email);
  if (account) accounts.set(email, { ...account, name: profile.name, avatar: profile.avatar });
  return NextResponse.json({ data: profile });
}
