import { NextResponse } from "next/server";
import { nftFixtures } from "../../mocks/fixtures";
import { compareEth } from "../../services/eth";
import { getScenario, isUnavailableScenario, waitForScenario } from "../../services/scenario";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const scenario = getScenario(request.headers);
  await waitForScenario(scenario, params.get("page") === "1" ? "first" : "next");
  if (isUnavailableScenario(scenario)) return NextResponse.json({ message: "Catálogo temporariamente indisponível." }, { status: 503 });
  const search = params.get("search")?.toLowerCase() ?? "";
  const min = params.get("min") || "0";
  const max = params.get("max") || "99";
  const sort = params.get("sort") ?? "recent";
  const page = Number(params.get("page") ?? "1");
  const filtered = nftFixtures.filter((nft) => nft.name.toLowerCase().includes(search) && compareEth(nft.price, min) >= 0 && compareEth(nft.price, max) <= 0);
  const data = [...filtered].sort((first, second) => sort === "price-asc" ? compareEth(first.price, second.price) : sort === "price-desc" ? compareEth(second.price, first.price) : first.id.localeCompare(second.id)).slice((page - 1) * 4, page * 4);
  return NextResponse.json({ data, total: filtered.length });
}
