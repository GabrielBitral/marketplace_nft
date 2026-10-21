import type { NftDto } from "../services/contracts";

export const nftFixtures: NftDto[] = [
  { id: "042", name: "Emerald Ape #042", price: "1.19", edition: "1/50", color: "linear-gradient(135deg,#e9e7c6,#8cac86)", accessory: "⌁", available: 4, version: 1, editions: [{ value: "1/50", available: 4 }, { value: "1/10", available: 0 }, { value: "ABERTA", available: 12 }] },
  { id: "009", name: "Sage Nomad #009", price: "1.69", edition: "1/10", color: "linear-gradient(135deg,#e8e4c8,#b5a678)", accessory: "⌂", available: 2, version: 1, editions: [{ value: "1/10", available: 2 }, { value: "ABERTA", available: 0 }] },
  { id: "088", name: "Ivory Baron #088", price: "1.58", edition: "1/10", color: "linear-gradient(135deg,#d7dfd1,#7f907b)", accessory: "◉", rare: true, available: 1, version: 1, editions: [{ value: "1/10", available: 1 }, { value: "1/1", available: 0 }] },
  { id: "207", name: "Golden Beat #207", price: "1.98", edition: "1/50", color: "linear-gradient(135deg,#f3e5ae,#d1a35e)", accessory: "◌", available: 8, version: 1 },
  { id: "118", name: "Classic Frame #118", price: "1.29", edition: "1/10", color: "linear-gradient(135deg,#dfe6d4,#b7b480)", accessory: "□", available: 3, version: 1 },
  { id: "411", name: "Violet Nomad #411", price: "1.39", edition: "1/1", color: "linear-gradient(135deg,#e2d7d1,#967887)", accessory: "⌂", available: 1, version: 1 },
  { id: "306", name: "Ivory Baron #306", price: "1.79", edition: "1/10", color: "linear-gradient(135deg,#e8e2ca,#839d88)", accessory: "◉", available: 5, version: 1 },
  { id: "405", name: "Golden Signal #405", price: "0.98", edition: "1/50", color: "linear-gradient(135deg,#f5eac3,#c5bd81)", accessory: "◌", available: 7, version: 1 },
];

const initialNfts = nftFixtures.map((nft) => ({ ...nft, editions: nft.editions?.map((edition) => ({ ...edition })) }));

export const updateNftFixture = (update: Pick<NftDto, "id" | "price" | "available" | "version">) => {
  const target = nftFixtures.find((nft) => nft.id === update.id);
  if (!target || update.version <= target.version) return;
  Object.assign(target, update);
  const edition = target.editions?.find((entry) => entry.value === target.edition);
  if (edition) edition.available = update.available;
};

export const resetNftFixtures = () => {
  nftFixtures.splice(0, nftFixtures.length, ...initialNfts.map((nft) => ({ ...nft, editions: nft.editions?.map((edition) => ({ ...edition })) })));
};
