import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";
import { Hexagon, ImageOff, LogOut, Plus } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import type { NFT } from "../backend.d";
import MintModal from "../components/MintModal";
import TransferModal from "../components/TransferModal";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useGetNFTsByMinter } from "../hooks/useQueries";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3", "sk-4"];

function NFTCardSkeleton() {
  return (
    <div className="rounded-sm border border-border bg-card overflow-hidden">
      <Skeleton className="w-full aspect-square" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-8 w-full mt-3" />
      </div>
    </div>
  );
}

function NFTCard({
  nft,
  index,
  onTransfer,
}: {
  nft: NFT;
  index: number;
  onTransfer: (nft: NFT) => void;
}) {
  const [imgError, setImgError] = useState(false);

  const formattedDate = new Date(
    Number(nft.createdAt / 1_000_000n),
  ).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const ocidIndex = index + 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.06,
        ease: [0.16, 1, 0.3, 1],
      }}
      data-ocid={`gallery.item.${ocidIndex}`}
      className="group rounded-sm border border-border bg-card overflow-hidden nft-card-hover cursor-default"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {imgError || !nft.imageUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            <ImageOff className="w-10 h-10 text-muted-foreground/40" />
          </div>
        ) : (
          <img
            src={nft.imageUrl}
            alt={nft.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}
        <div className="absolute top-2 right-2">
          <Badge
            variant="secondary"
            className="text-xs font-mono bg-background/80 backdrop-blur-sm border-border text-muted-foreground"
          >
            #{nft.id.toString()}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-display font-semibold text-foreground text-sm leading-tight truncate mb-1">
          {nft.title}
        </h3>
        {nft.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-3">
            {nft.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground/50 mb-3">{formattedDate}</p>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onTransfer(nft)}
          data-ocid={`nft.transfer_button.${ocidIndex}`}
          className="w-full text-xs border-border hover:border-primary/50 hover:text-primary transition-colors rounded-sm"
        >
          Transfer (ICRC-7)
        </Button>
      </div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [mintOpen, setMintOpen] = useState(false);
  const [transferNFT, setTransferNFT] = useState<NFT | null>(null);

  const { data: nfts, isLoading, isError } = useGetNFTsByMinter();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
  };

  const principalShort = identity
    ? `${identity.getPrincipal().toString().slice(0, 10)}...`
    : "";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Hexagon
                className="text-primary w-8 h-8"
                strokeWidth={1.5}
                fill="oklch(0.78 0.14 75 / 0.1)"
              />
              <span className="absolute inset-0 flex items-center justify-center font-display font-bold text-primary text-xs">
                N
              </span>
            </div>
            <span className="font-display font-bold text-foreground text-lg tracking-tight">
              NFT Gallery
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono hidden sm:block">
              {principalShort}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-ocid="auth.logout_button"
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero band */}
      <div
        className="relative h-28 overflow-hidden"
        style={{
          backgroundImage:
            "url('/assets/generated/nft-hero-bg.dim_1920x400.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 to-background" />
      </div>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-12 -mt-6 relative z-10">
        {/* Title + mint CTA */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">
              My Collection
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading
                ? "Loading..."
                : `${nfts?.length ?? 0} NFT${
                    (nfts?.length ?? 0) !== 1 ? "s" : ""
                  } minted`}
            </p>
          </div>
          <Button
            onClick={() => setMintOpen(true)}
            data-ocid="gallery.mint_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-sm font-semibold transition-all hover:shadow-gold"
          >
            <Plus className="w-4 h-4" />
            Mint NFT
          </Button>
        </div>

        {/* Error state */}
        {isError && (
          <div
            data-ocid="gallery.error_state"
            className="rounded-sm border border-destructive/30 bg-destructive/10 p-6 text-center"
          >
            <p className="text-destructive text-sm">
              Failed to load your NFTs. Please refresh and try again.
            </p>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <div
            data-ocid="gallery.loading_state"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {SKELETON_KEYS.map((key) => (
              <NFTCardSkeleton key={key} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isError && nfts?.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            data-ocid="gallery.empty_state"
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-16 h-16 rounded-sm border border-dashed border-border flex items-center justify-center mb-5">
              <Plus className="w-6 h-6 text-muted-foreground/40" />
            </div>
            <h2 className="font-display text-lg font-semibold text-foreground mb-2">
              No NFTs yet
            </h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Mint your first NFT by uploading an image and adding a title.
            </p>
            <Button
              onClick={() => setMintOpen(true)}
              data-ocid="gallery.mint_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-sm font-semibold"
            >
              <Plus className="w-4 h-4" />
              Mint your first NFT
            </Button>
          </motion.div>
        )}

        {/* NFT Grid */}
        {!isLoading && !isError && nfts && nfts.length > 0 && (
          <div
            data-ocid="gallery.list"
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {nfts.map((nft, index) => (
                <NFTCard
                  key={nft.id.toString()}
                  nft={nft}
                  index={index}
                  onTransfer={setTransferNFT}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-6 text-center">
        <p className="text-xs text-muted-foreground/40">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>

      {/* Modals */}
      <MintModal open={mintOpen} onOpenChange={setMintOpen} />
      <TransferModal nft={transferNFT} onClose={() => setTransferNFT(null)} />
    </div>
  );
}
