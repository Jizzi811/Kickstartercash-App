import React, { useState } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Copy, Check } from "lucide-react";

export const CopyButton = ({ text, label, copiedLabel, testid }) => {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(copiedLabel || "Copied!");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Copy failed");
    }
  };
  return (
    <button
      data-testid={testid}
      onClick={onCopy}
      className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm border border-white/10 text-zinc-300 hover:border-[#7C3AED]/50 hover:text-[#7C3AED] transition-colors"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />} {label}
    </button>
  );
};
