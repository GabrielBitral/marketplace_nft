import { NextResponse } from "next/server";
import { nftFixtures } from "../../../mocks/fixtures";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const nft = nftFixtures.find((item) => item.id === id);
  return nft ? NextResponse.json(nft) : NextResponse.json({ message: "NFT não encontrado." }, { status: 404 });
}
