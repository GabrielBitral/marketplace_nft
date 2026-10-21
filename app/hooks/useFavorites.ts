"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFavorite, deleteFavorite, getFavorites } from "../services/api";
import { useAuth } from "../Contexts/AuthContext";

export const useFavorites = () => {
  const { user } = useAuth();
  const key = ["favorites", user?.email ?? "guest"];
  const queryClient = useQueryClient();
  const favorites = useQuery({ queryKey: key, queryFn: getFavorites, enabled: Boolean(user) });
  const mutation = useMutation({
    mutationFn: ({ id, shouldFavorite }: { id: string; shouldFavorite: boolean }) => shouldFavorite ? createFavorite(id) : deleteFavorite(id),
    onMutate: async ({ id, shouldFavorite }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(key, shouldFavorite ? [...new Set([...previous, id])] : previous.filter((favorite) => favorite !== id));
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous ?? []);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
  return { ids: favorites.data ?? [], isPending: favorites.isPending, error: mutation.error, toggle: (id: string) => user && mutation.mutate({ id, shouldFavorite: !(favorites.data ?? []).includes(id) }) };
};
