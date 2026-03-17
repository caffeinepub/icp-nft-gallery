import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  NFT,
  TransferArg,
  UserProfile,
  backendInterface,
} from "../backend.d";
import { useActor } from "./useActor";

// Cast actor to full interface including new ICRC-7 methods
function fullActor(actor: ReturnType<typeof useActor>["actor"]) {
  return actor as (backendInterface & typeof actor) | null;
}

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
  const { actor: rawActor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      nftId,
      recipientPrincipal,
    }: {
      nftId: bigint;
      recipientPrincipal: string;
    }) => {
      const actor = fullActor(rawActor);
      if (!actor) throw new Error("Actor not available");
      const { Principal } = await import("@icp-sdk/core/principal");
      const principal = Principal.fromText(recipientPrincipal);
      const transferArg: TransferArg = {
        from_subaccount: null,
        to: { owner: principal, subaccount: null },
        token_id: nftId,
        memo: null,
        created_at_time: null,
      };
      const results = await actor.icrc7_transfer([transferArg]);
      const result = results[0];
      if (result && "Err" in result) {
        const errKey = Object.keys(result.Err)[0];
        const errVal = (result.Err as any)[errKey];
        if (errKey === "Unauthorized")
          throw new Error("You are not authorized to transfer this NFT.");
        if (errKey === "NonExistingTokenId") throw new Error("NFT not found.");
        if (errKey === "InvalidRecipient")
          throw new Error("Invalid recipient principal.");
        throw new Error(
          `Transfer failed: ${errKey}${
            errVal && typeof errVal === "object" && "message" in errVal
              ? ` - ${errVal.message}`
              : ""
          }`,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nfts"] });
    },
  });
}
