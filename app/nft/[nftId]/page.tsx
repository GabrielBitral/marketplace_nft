import { Suspense } from "react";
import InitialRouteShell from "../../Components/InitialRouteShell";
import MarketplaceRouter from "../../Router";
import { nftFixtures } from "../../mocks/fixtures";

type NftRouteProps = { params: Promise<{ nftId: string }>; };

const ResolveNftRoute = async ({ params }: NftRouteProps) => {
  const { nftId } = await params;
  const nft = nftFixtures.find((item) => item.id === nftId);
  return <MarketplaceRouter fallback={<InitialRouteShell nft={nft} />} />;
};

export default function NftRoutePage({ params }: NftRouteProps) {
  return <Suspense fallback={<InitialRouteShell />}><ResolveNftRoute params={params} /></Suspense>;
}
