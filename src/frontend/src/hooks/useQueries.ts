import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NFT, UserProfile } from "../backend.d";
import { useActor } from "./useActor";

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useGetNFTsByMinter() {
  const { actor, isFetching: actorFetching } = useActor();

  return useQuery<NFT[]>({
    queryKey: ["nfts", "minter"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getNFTsByMinter();
    },
    enabled: !!actor && !actorFetching,
  });
}

export function useMintNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      description,
      imageUrl,
    }: {
      title: string;
      description: string;
      imageUrl: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.mintNFT(title, description, imageUrl);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfts"] });
    },
  });
}

export function useTransferNFT() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftId,
      recipientPrincipal,
    }: {
      nftId: bigint;
      recipientPrincipal: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principal = Principal.fromText(recipientPrincipal);
      return actor.transferNFT(nftId, principal);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfts"] });
    },
  });
}
