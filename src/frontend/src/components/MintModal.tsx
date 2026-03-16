import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle2, Loader2, Upload, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useBlobStorage } from "../hooks/useBlobStorage";
import { useMintNFT } from "../hooks/useQueries";

interface MintModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MintModal({ open, onOpenChange }: MintModalProps) {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<
    "idle" | "uploading" | "minting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { upload, uploadProgress } = useBlobStorage();
  const { mutateAsync: mintNFT } = useMintNFT();

  const handleClose = () => {
    if (status === "uploading" || status === "minting") return;
    onOpenChange(false);
    setTimeout(() => {
      setSelectedFile(null);
      setPreviewUrl(null);
      setTitle("");
      setDescription("");
      setStatus("idle");
      setErrorMsg("");
    }, 200);
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect],
  );

  const handleMint = async () => {
    if (!selectedFile || !title.trim()) return;
    setStatus("uploading");
    setErrorMsg("");
    try {
      const imageUrl = await upload(selectedFile);
      setStatus("minting");
      await mintNFT({
        title: title.trim(),
        description: description.trim(),
        imageUrl,
      });
      setStatus("success");
      toast.success(`"${title}" minted successfully!`);
      setTimeout(() => handleClose(), 1500);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Minting failed. Please try again.");
    }
  };

  const isLoading = status === "uploading" || status === "minting";

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="mint.dialog"
        className="bg-card border-border rounded-sm max-w-md w-full p-0 overflow-hidden"
      >
        <DialogHeader className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="font-display text-xl font-bold text-foreground">
              Mint NFT
            </DialogTitle>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              data-ocid="mint.close_button"
              className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5">
          {/* Dropzone */}
          <div>
            <Label className="text-xs text-muted-foreground uppercase tracking-wider mb-2 block">
              Image
            </Label>
            <label
              htmlFor="file-input-hidden"
              data-ocid="mint.dropzone"
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              className={`relative rounded-sm border-2 border-dashed transition-all duration-200 overflow-hidden cursor-pointer ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : previewUrl
                    ? "border-border"
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
              } ${isLoading ? "pointer-events-none opacity-60" : ""}`}
            >
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-48 object-cover"
                  />
                  {!isLoading && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1 text-foreground hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  {status === "uploading" && (
                    <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                        <p className="text-xs text-foreground">
                          Uploading... {uploadProgress}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 px-4">
                  <Upload className="w-8 h-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground text-center">
                    Drop an image here or{" "}
                    <span className="text-primary">click to browse</span>
                  </p>
                  <p className="text-xs text-muted-foreground/50 mt-1">
                    JPG, PNG, GIF, WebP
                  </p>
                </div>
              )}
            </label>
            <input
              ref={fileInputRef}
              id="file-input-hidden"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
                e.target.value = "";
              }}
            />
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <Label
              htmlFor="nft-title"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Title <span className="text-primary">*</span>
            </Label>
            <Input
              id="nft-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My awesome NFT"
              disabled={isLoading}
              data-ocid="mint.title_input"
              className="bg-muted border-border rounded-sm focus-visible:ring-primary/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label
              htmlFor="nft-description"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Description
            </Label>
            <Textarea
              id="nft-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your NFT..."
              disabled={isLoading}
              data-ocid="mint.description_input"
              rows={3}
              className="bg-muted border-border rounded-sm focus-visible:ring-primary/50 resize-none"
            />
          </div>

          {/* Status feedback */}
          <AnimatePresence mode="wait">
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-ocid="mint.error_state"
                className="flex items-start gap-2 p-3 rounded-sm bg-destructive/10 border border-destructive/30"
              >
                <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-xs text-destructive">{errorMsg}</p>
              </motion.div>
            )}
            {status === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="mint.success_state"
                className="flex items-center gap-2 p-3 rounded-sm bg-green-500/10 border border-green-500/30"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs text-green-400">
                  NFT minted successfully!
                </p>
              </motion.div>
            )}
            {status === "minting" && (
              <motion.div
                key="minting"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="mint.loading_state"
                className="flex items-center gap-2 p-3 rounded-sm bg-primary/5 border border-primary/20"
              >
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Minting on-chain...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <Button
            onClick={handleMint}
            disabled={
              !selectedFile ||
              !title.trim() ||
              isLoading ||
              status === "success"
            }
            data-ocid="mint.submit_button"
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-semibold transition-all disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {status === "uploading" ? "Uploading image..." : "Minting..."}
              </>
            ) : (
              "Mint NFT"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
