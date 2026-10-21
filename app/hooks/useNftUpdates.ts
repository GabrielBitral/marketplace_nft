"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { subscribeToNftUpdates } from "../services/realtime";
import type { NftListResponse, NftUpdatedEvent } from "../services/contracts";

export const useNftUpdates = (onUpdate: (update: NftUpdatedEvent) => void) => {
  const queryClient = useQueryClient();

  useEffect(() => subscribeToNftUpdates((update) => {
    queryClient.setQueriesData<NftListResponse>({ queryKey: ["nfts"] }, (current) => {
      if (!current) return current;
      return {
        ...current,
        data: current.data.map((nft) => nft.id === update.id && update.version > nft.version
          ? { ...nft, ...update }
          : nft),
      };
    });
    onUpdate(update);
  }, {
    onReconnect: () => {
      void queryClient.invalidateQueries({ queryKey: ["nfts"] });
      void queryClient.invalidateQueries({ queryKey: ["nft"] });
    },
  }), [onUpdate, queryClient]);
};
