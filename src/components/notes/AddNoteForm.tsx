"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface AddNoteFormProps {
  onAdd: (content: string) => Promise<void>;
}

export function AddNoteForm({ onAdd }: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      await onAdd(content.trim());
      setContent("");
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="open"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(true)}
            className="focus-ring w-full rounded-lg border px-4 py-3 text-left text-sm font-semibold transition"
            style={{
              background: "rgba(255, 253, 248, 0.72)",
              borderColor: "var(--line)",
              color: "var(--muted)",
            }}
          >
            📝 Write a note...
          </motion.button>
        ) : (
          <motion.form
            key="form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleSubmit}
            className="card space-y-3"
          >
            <textarea
              className="input-base focus-ring"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              autoFocus
              maxLength={1000}
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs" style={{ color: "var(--muted)" }}>{content.length}/1000</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setContent(""); }}
                  className="btn-ghost flex-1 sm:flex-none"
                >
                  ↩️ Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1 sm:flex-none"
                  disabled={loading || !content.trim()}
                >
                  {loading ? "💌 Sending..." : "💌 Send"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}