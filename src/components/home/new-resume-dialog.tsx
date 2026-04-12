"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, UploadSimple } from "@phosphor-icons/react";
import { DEFAULT_LATEX_TEMPLATE } from "@/lib/latex-templates";

interface NewResumeDialogProps {
  onCreate: (name: string, source?: string) => Promise<unknown>;
}

export function NewResumeDialog({ onCreate }: NewResumeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [texContent, setTexContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setTexContent(reader.result as string);
    reader.readAsText(file);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    await onCreate(name.trim(), texContent || DEFAULT_LATEX_TEMPLATE);
    setCreating(false);
    setName("");
    setTexContent(null);
    setFileName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[#3ECF8E] hover:bg-[#35b87c] text-[#171717]">
          <Plus size={16} weight="bold" />
          New Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[#1c1c1c] border-[#2e2e2e]">
        <DialogHeader>
          <DialogTitle>Create New Resume</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="name">Resume Name</Label>
            <Input
              id="name"
              placeholder="e.g., Software Engineer Resume"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-[#171717] border-[#2e2e2e]"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <div className="space-y-2">
            <Label>Upload .tex file (optional)</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".tex"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className="w-full border-dashed border-[#2e2e2e] text-[#a1a1a1] hover:text-[#ededed]"
              onClick={() => fileRef.current?.click()}
            >
              <UploadSimple size={16} className="mr-2" />
              {fileName || "Choose a .tex file"}
            </Button>
          </div>
          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="w-full bg-[#3ECF8E] hover:bg-[#35b87c] text-[#171717]"
          >
            {creating ? "Creating..." : "Create Resume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
