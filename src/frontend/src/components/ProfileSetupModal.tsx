import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function ProfileSetupModal() {
  const [name, setName] = useState("");
  const { mutateAsync: saveProfile, isPending } = useSaveCallerUserProfile();

  const handleSave = async () => {
    if (!name.trim()) return;
    await saveProfile({ name: name.trim() });
  };

  return (
    <Dialog open={true}>
      <DialogContent className="bg-card border-border rounded-sm max-w-sm w-full">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-foreground">
            Welcome
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Choose a display name for your gallery.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label
              htmlFor="profile-name"
              className="text-xs text-muted-foreground uppercase tracking-wider"
            >
              Display Name
            </Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Satoshi"
              disabled={isPending}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="bg-muted border-border rounded-sm focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={!name.trim() || isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-sm font-semibold disabled:opacity-40"
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Get Started"
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
