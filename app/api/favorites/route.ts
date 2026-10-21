import { NextResponse } from "next/server";
import { getFavorites, getRequestUser, isAuthorized } from "../_store";

export function GET(request: Request) {
  const email = getRequestUser(request);
  if (!isAuthorized(email)) return NextResponse.json({ message: "Sessão expirada." }, { status: 401 });
  return NextResponse.json({ data: getFavorites(email) });
}
