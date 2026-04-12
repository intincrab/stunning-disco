"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CommitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommit: (message: string) => Promise<void>;
}

export function CommitDialog({ open, onOpenChange, onCommit }: CommitDialogProps) {
  const [message, setMessage] = useState("");
  const [committing, setCommitting] = useState(false);

  const handleCommit = async () => {
    if (!message.trim()) return;
    setCommitting(true);
    await onCommit(message.trim());
    setCommitting(false);
    setMessage("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1c1c1c] border-[#2e2e2e]">
        <DialogHeader>
          <DialogTitle>Commit Changes</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="commit-msg">Commit Message</Label>
            <Input
              id="commit-msg"
              placeholder="Describe your changes..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="bg-[#171717] border-[#2e2e2e]"
              onKeyDown={(e) => e.key === "Enter" && handleCommit()}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCommit}
              disabled={!message.trim() || committing}
              className="bg-[#3ECF8E] hover:bg-[#35b87c] text-[#171717]"
            >
              {committing ? "Committing..." : "Commit"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
