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
            className="w-full rounded-xl px-4 py-3 text-left transition-colors duration-200"
            style={{
              background: "#1A1A1A",
              border: "1px dashed #2E2E2E",
              color: "#6B5F64",
              fontSize: "14px",
              cursor: "pointer",
              fontFamily: "DM Sans, sans-serif",
            }}
          >
            + Write a note…
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
              style={{ minHeight: "90px", fontSize: "14px", background: "#222" }}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your heart?"
              autoFocus
              maxLength={1000}
            />
            <div className="flex items-center justify-between">
              <span style={{ fontSize: "11px", color: "#6B5F64" }}>{content.length}/1000</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); setContent(""); }}
                  className="btn-ghost"
                  style={{ padding: "8px 14px", fontSize: "13px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: "8px 16px", fontSize: "13px" }}
                  disabled={loading || !content.trim()}
                >
                  {loading ? "Sending…" : "Send 💌"}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
