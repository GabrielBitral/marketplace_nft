import { NextResponse } from "next/server";
import { resetScenario } from "../../_store";

export function POST() {
  resetScenario();
  return NextResponse.json({ ok: true });
}
