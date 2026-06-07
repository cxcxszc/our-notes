"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QUICK_ACTIONS } from "@/types";

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
    <div className="mb-6">
      <p style={{ fontSize: "11px", color: "#6B5F64", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>
        Quick Send
      </p>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <motion.button
            key={action.label}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend(action)}
            disabled={!!sending}
            className="transition-all duration-200"
            style={{
              padding: "7px 13px",
              borderRadius: "20px",
              border: "1px solid rgba(248,200,220,0.12)",
              background: sending === action.label ? "rgba(248,200,220,0.12)" : "rgba(248,200,220,0.04)",
              color: "#A89BA2",
              fontSize: "12px",
              cursor: sending ? "not-allowed" : "pointer",
              fontFamily: "DM Sans, sans-serif",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              opacity: sending && sending !== action.label ? 0.5 : 1,
            }}
          >
            <span>{action.emoji}</span>
            <span>{action.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
