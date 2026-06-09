"use client";

import { useState } from "react";
import { QUICK_ACTIONS } from "@/types";

interface QuickActionsProps {
  onSend: (message: string) => Promise<void>;
}

export function QuickActions({ onSend }: QuickActionsProps) {
  const [sending, setSending] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  const handleSend = async (action: (typeof QUICK_ACTIONS)[0]) => {
    if (sending) return;
    setSending(action.label);
    try {
      await onSend(action.message);
      setSent(action.label);
      window.setTimeout(() => setSent(null), 1600);
    } finally {
      setSending(null);
    }
  };

  return (
    <section>
      <h2 className="mb-3 text-base font-bold" style={{ color: "var(--app-text)" }}>
        Quick Send
      </h2>
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            onClick={() => handleSend(action)}
            disabled={!!sending}
            className="app-chip"
            type="button"
            style={{ opacity: sending && sending !== action.label ? 0.55 : 1 }}
          >
            <span aria-hidden="true">{action.emoji}</span>
            <span className="ml-1.5">{action.label}</span>
          </button>
        ))}
      </div>
      {sent && (
        <div className="mt-3 inline-flex rounded-full px-4 py-2 text-sm" style={{ background: "var(--app-pink-surface)", color: "var(--app-pink)" }}>
          Sent: {sent}
        </div>
      )}
    </section>
  );
}
