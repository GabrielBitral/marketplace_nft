"use client";

import { useQuery } from "@tanstack/react-query";
import { getNft, getNfts } from "../services/api";
import type { CatalogFilters } from "../services/api";

export const useNfts = (filters: CatalogFilters) => useQuery({
  queryKey: ["nfts", filters],
  queryFn: () => getNfts(filters),
  staleTime: 30_000,
  placeholderData: (previousData) => previousData,
});

export const useNft = (id: string) => useQuery({
  queryKey: ["nft", id],
  queryFn: () => getNft(id),
  retry: false,
  staleTime: 30_000,
});
