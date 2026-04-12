"use client";

import { useEffect, useRef, useState } from "react";
import {
  PaperPlaneTilt,
  CheckCircle,
  XCircle,
  Sparkle,
  User,
  ArrowRight,
} from "@phosphor-icons/react";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPanelProps {
  messages: ChatMessage[];
  loading: boolean;
  hasPendingChange: boolean;
  onSend: (message: string) => void;
  onAccept: () => void;
  onReject: () => void;
}

const SUGGESTIONS = [
  "Make bullet points more concise",
  "Add a Skills section",
  "Improve action verbs",
  "Add a Hobbies section",
];

export function ChatPanel({
  messages,
  loading,
  hasPendingChange,
  onSend,
  onAccept,
  onReject,
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || loading || hasPendingChange) return;
    setInput("");
    onSend(trimmed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    if (loading || hasPendingChange) return;
    onSend(suggestion);
  };

  const isInputDisabled = loading || hasPendingChange;

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5 shrink-0">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
          <Sparkle size={12} weight="fill" className="text-emerald-400" />
        </div>
        <div>
          <span className="text-[13px] font-medium text-white/90">AI Editor</span>
          <span className="text-[10px] text-white/30 ml-2">MiniMax</span>
        </div>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-4 min-h-0 scrollbar-thin">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col h-full">
            {/* Empty state */}
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-6">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.06] flex items-center justify-center">
                <Sparkle size={20} weight="duotone" className="text-white/20" />
              </div>
              <div>
                <p className="text-[13px] text-white/70 font-medium">
                  Edit with AI
                </p>
                <p className="text-[11px] text-white/30 mt-1 max-w-[200px] leading-relaxed">
                  Describe changes in plain English and preview before applying
                </p>
              </div>
            </div>

            {/* Suggestions */}
            <div className="space-y-1.5 pb-2">
              <p className="text-[10px] text-white/25 uppercase tracking-wider font-medium px-1">
                Try asking
              </p>
              {SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 rounded-lg text-[11px] text-white/50 bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08] hover:text-white/70 transition-all duration-200 flex items-center justify-between group"
                >
                  <span>{suggestion}</span>
                  <ArrowRight
                    size={10}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  msg.role === "user"
                    ? "bg-white/[0.08]"
                    : "bg-gradient-to-br from-emerald-500/20 to-emerald-500/5"
                }`}
              >
                {msg.role === "user" ? (
                  <User size={12} weight="bold" className="text-white/50" />
                ) : (
                  <Sparkle size={12} weight="fill" className="text-emerald-400" />
                )}
              </div>

              {/* Message bubble */}
              <div
                className={`max-w-[85%] rounded-xl px-3 py-2 text-[12px] leading-relaxed ${
                  msg.role === "user"
                    ? "bg-white/[0.08] text-white/80"
                    : "bg-white/[0.03] text-white/60 border border-white/[0.06]"
                }`}
              >
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-2.5 animate-in fade-in duration-200">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center shrink-0">
              <Sparkle size={12} weight="fill" className="text-emerald-400 animate-pulse" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-2.5">
              <div className="flex gap-1 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-[bounce_1s_infinite_0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-[bounce_1s_infinite_150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 animate-[bounce_1s_infinite_300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Accept / Reject buttons */}
      {hasPendingChange && (
        <div className="px-3 py-3 border-t border-white/[0.06] space-y-2 shrink-0 bg-white/[0.02]">
          <p className="text-[10px] text-white/30 text-center">
            Review the diff and preview, then decide
          </p>
          <div className="flex gap-2">
            <button
              onClick={onAccept}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-[12px] font-medium transition-all duration-200 border border-emerald-500/20 hover:border-emerald-500/30 active:scale-[0.98]"
            >
              <CheckCircle size={14} weight="bold" />
              Accept
            </button>
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[12px] font-medium transition-all duration-200 border border-red-500/15 hover:border-red-500/25 active:scale-[0.98]"
            >
              <XCircle size={14} weight="bold" />
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-3 py-3 border-t border-white/[0.06] shrink-0">
        <div
          className={`relative rounded-xl border transition-all duration-200 ${
            isInputDisabled
              ? "bg-white/[0.02] border-white/[0.04] opacity-50"
              : isFocused
              ? "bg-white/[0.04] border-white/[0.12] shadow-[0_0_0_3px_rgba(255,255,255,0.02)]"
              : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.1]"
          }`}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={isInputDisabled}
            placeholder={
              hasPendingChange
                ? "Accept or reject the pending change…"
                : "Describe your edit…"
            }
            rows={1}
            className="w-full resize-none bg-transparent text-[12px] text-white/80 placeholder:text-white/25 outline-none px-3 py-2.5 pr-10 min-h-[38px] max-h-24 overflow-y-auto disabled:cursor-not-allowed"
            style={{ lineHeight: "1.5" }}
          />
          <button
            onClick={handleSend}
            disabled={isInputDisabled || !input.trim()}
            className={`absolute right-2 bottom-2 p-1.5 rounded-lg transition-all duration-200 ${
              input.trim() && !isInputDisabled
                ? "bg-emerald-500 text-white hover:bg-emerald-400 active:scale-95"
                : "text-white/20"
            }`}
          >
            <PaperPlaneTilt size={14} weight="fill" />
          </button>
        </div>
        <p className="text-[10px] text-white/20 mt-2 text-center">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}
