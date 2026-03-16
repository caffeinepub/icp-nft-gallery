import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle2, Loader2, Send } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { NFT } from "../backend.d";
import { useTransferNFT } from "../hooks/useQueries";

interface TransferModalProps {
  nft: NFT | null;
  onClose: () => void;
}

export default function TransferModal({ nft, onClose }: TransferModalProps) {
  const [recipient, setRecipient] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { mutateAsync: transferNFT } = useTransferNFT();

  // Reset on open
  useEffect(() => {
    if (nft) {
      setRecipient("");
      setStatus("idle");
      setErrorMsg("");
    }
  }, [nft]);

  const handleClose = () => {
    if (status === "loading") return;
    onClose();
  };

  const handleTransfer = async () => {
    if (!nft || !recipient.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      await transferNFT({
        nftId: nft.id,
        recipientPrincipal: recipient.trim(),
      });
      setStatus("success");
      toast.success(`"${nft.title}" transferred successfully!`);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(
        err?.message?.includes("invalid")
          ? "Invalid principal ID. Please check and try again."
          : (err?.message ?? "Transfer failed. Please try again."),
      );
    }
  };

  const isLoading = status === "loading";

  return (
    <Dialog open={!!nft} onOpenChange={handleClose}>
      <DialogContent
        data-ocid="transfer.dialog"
        className="bg-card border-border rounded-sm max-w-sm w-full"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-lg font-bold text-foreground">
            Transfer NFT
          </DialogTitle>
          {nft && (
            <DialogDescription className="text-muted-foreground text-sm">
              Transfer{" "}
              <span className="text-foreground font-medium">"{nft.title}"</span>{" "}
              to another wallet.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="recipient"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Recipient Principal ID
            </Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="xxxxx-xxxxx-xxxxx-xxxxx-xxx"
              disabled={isLoading || status === "success"}
              data-ocid="transfer.recipient_input"
              className="bg-muted border-border rounded-sm focus-visible:ring-primary/50 font-mono text-sm"
            />
          </div>

          <AnimatePresence mode="wait">
            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                data-ocid="transfer.error_state"
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
                data-ocid="transfer.success_state"
                className="flex items-center gap-2 p-3 rounded-sm bg-green-500/10 border border-green-500/30"
              >
                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                <p className="text-xs text-green-400">Transfer complete!</p>
              </motion.div>
            )}
            {status === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="transfer.loading_state"
                className="flex items-center gap-2 p-3 rounded-sm bg-primary/5 border border-primary/20"
              >
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Processing transfer...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            data-ocid="transfer.cancel_button"
            className="border-border hover:border-primary/30 rounded-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!recipient.trim() || isLoading || status === "success"}
            data-ocid="transfer.confirm_button"
            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-semibold gap-2 disabled:opacity-40"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Transfer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
