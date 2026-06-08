"use client";

import { motion } from "framer-motion";
import { QUICK_ACTIONS } from "@/types";
import { useState } from "react";

interface QuickActionsProps {
  onSend: (message: string) => Promise<void>;
}

export function QuickActions({ onSend }: QuickActionsProps) {
  const [sending, setSending] = useState<string | null>(null);

  const handleSend = async (action: typeof QUICK_ACTIONS[0]) => {
    if (sending) return;
    setSending(action.label);
    try {
      await onSend(action.message);
    } finally {
      setSending(null);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="section-label">Quick send</p>
        {sending && <span className="text-xs font-medium" style={{ color: "var(--muted)" }}>Sending...</span>}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 md:flex-wrap md:overflow-visible">
        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSend(action)}
            disabled={!!sending}
            className="shrink-0 rounded-full border px-3 py-2 text-sm font-semibold transition"
            style={{
              borderColor: sending === action.label ? "rgba(199, 95, 84, 0.42)" : "var(--line)",
              background: sending === action.label ? "var(--accent-soft)" : "rgba(255, 253, 248, 0.76)",
              color: "var(--ink)",
              opacity: sending && sending !== action.label ? 0.5 : 1,
            }}
          >
            <span aria-hidden="true">{action.emoji}</span>
            <span className="ml-1">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </section>
  );
}
