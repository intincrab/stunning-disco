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
import { Plus, UploadSimple, FileText, GraduationCap, Article, TextAa } from "@phosphor-icons/react";
import { TEMPLATES } from "@/lib/latex-templates";

interface NewResumeDialogProps {
  onCreate: (name: string, source?: string) => Promise<unknown>;
}

export function NewResumeDialog({ onCreate }: NewResumeDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("jakes");
  const [texContent, setTexContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const templateIcons: Record<string, React.ReactNode> = {
    blank: <FileText size={20} />,
    jakes: <Article size={20} />,
    academic: <GraduationCap size={20} />,
    minimalist: <TextAa size={20} />,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setTexContent(reader.result as string);
      setSelectedTemplate("");
    };
    reader.readAsText(file);
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const source = texContent || TEMPLATES.find((t) => t.id === selectedTemplate)?.source || TEMPLATES[1].source;
    await onCreate(name.trim(), source);
    setCreating(false);
    setName("");
    setTexContent(null);
    setFileName("");
    setSelectedTemplate("jakes");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[#171717]">
          <Plus size={16} weight="bold" />
          New Resume
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--surface-card)] border-[var(--surface-border)] max-w-lg">
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
              className="bg-[var(--surface-bg)] border-[var(--surface-border)]"
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>

          <div className="space-y-2">
            <Label>Choose a Template</Label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setSelectedTemplate(t.id);
                    setTexContent(null);
                    setFileName("");
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                    selectedTemplate === t.id && !texContent
                      ? "border-[var(--accent-color)] bg-[var(--accent-color)]/10"
                      : "border-[var(--surface-border)] bg-[var(--surface-bg)] hover:border-[var(--surface-text-muted)]"
                  }`}
                >
                  <div className={`mt-0.5 ${selectedTemplate === t.id && !texContent ? "text-[var(--accent-color)]" : "text-[var(--surface-text-secondary)]"}`}>
                    {templateIcons[t.id]}
                  </div>
                  <div>
                    <div className={`text-sm font-medium ${selectedTemplate === t.id && !texContent ? "text-[var(--surface-text)]" : "text-[var(--surface-text-secondary)]"}`}>
                      {t.name}
                    </div>
                    <div className="text-xs text-[var(--surface-text-muted)] mt-0.5">{t.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Or upload your own .tex file</Label>
            <input
              ref={fileRef}
              type="file"
              accept=".tex"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              className={`w-full border-dashed hover:text-[var(--surface-text)] ${
                texContent
                  ? "border-[var(--accent-color)] text-[var(--accent-color)] bg-[var(--accent-color)]/10"
                  : "border-[var(--surface-border)] text-[var(--surface-text-secondary)]"
              }`}
              onClick={() => fileRef.current?.click()}
            >
              <UploadSimple size={16} className="mr-2" />
              {fileName || "Choose a .tex file"}
            </Button>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="w-full bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-[#171717]"
          >
            {creating ? "Creating..." : "Create Resume"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
