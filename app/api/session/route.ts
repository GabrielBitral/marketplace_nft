import { NextResponse } from "next/server";
import { hashPassword, passwordMatches } from "../../services/password";
import { accounts } from "../_accounts";

const requestUser = (request: Request) => request.headers.get("x-kurio-user")?.toLowerCase() ?? "";
const isExpired = (email: string) => !email || email === "expirada@kurio.io";

export function GET(request: Request) {
  const email = requestUser(request);
  if (isExpired(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const account = accounts.get(email);
  if (!account) return NextResponse.json({ message: "Sessão não encontrada." }, { status: 401 });
  return NextResponse.json({ user: { name: account.name, email: account.email, avatar: account.avatar } });
}

export function DELETE() { return new NextResponse(null, { status: 204 }); }

export async function PATCH(request: Request) {
  const email = requestUser(request);
  if (isExpired(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  const account = accounts.get(email);
  const body = await request.json() as { currentPassword?: string; newPassword?: string; };
  if (!account || !await passwordMatches(body.currentPassword ?? "", account.passwordHash)) return NextResponse.json({ message: "Senha atual inválida." }, { status: 422 });
  if (!body.newPassword || body.newPassword.length < 6) return NextResponse.json({ message: "A nova senha deve ter ao menos 6 caracteres." }, { status: 422 });
  accounts.set(email, { ...account, passwordHash: await hashPassword(body.newPassword) });
  return NextResponse.json({ ok: true });
}

export async function POST(request: Request) {
  const body = await request.json() as { mode?: string; name?: string; email?: string; password?: string; };
  const email = body.email?.trim().toLowerCase() ?? "";
  const password = body.password ?? "";
  if (!email.includes("@") || password.length < 6) return NextResponse.json({ message: "Informe um e-mail válido e uma senha com ao menos 6 caracteres." }, { status: 422 });
  const existing = accounts.get(email);
  if (body.mode === "register") {
    if (!body.name?.trim() || body.name.trim().length < 2) return NextResponse.json({ message: "Informe seu nome." }, { status: 422 });
    if (existing) return NextResponse.json({ message: "Este e-mail já possui uma conta." }, { status: 409 });
    accounts.set(email, { name: body.name.trim(), email, passwordHash: await hashPassword(password) });
  } else if (existing && !await passwordMatches(password, existing.passwordHash)) return NextResponse.json({ message: "E-mail ou senha inválidos." }, { status: 401 });
  const account = accounts.get(email) ?? { name: email.split("@")[0], email, passwordHash: await hashPassword(password) };
  if (!accounts.has(email)) accounts.set(email, account);
  return NextResponse.json({ user: { name: account.name, email: account.email, avatar: account.avatar }, token: `session-${crypto.randomUUID()}` });
}
