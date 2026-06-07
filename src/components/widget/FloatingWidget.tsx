"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Note } from "@/types";
import { formatNoteTime } from "@/lib/utils";

interface FloatingWidgetProps {
  latestPartnerNote: Note | null;
  partnerName: string;
  currentUserId: string;
}

export function FloatingWidget({ latestPartnerNote, partnerName, currentUserId }: FloatingWidgetProps) {
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lastNoteId, setLastNoteId] = useState<string | null>(null);

  useEffect(() => {
    if (latestPartnerNote && latestPartnerNote.id !== lastNoteId) {
      setLastNoteId(latestPartnerNote.id);
      setVisible(true);
      setMinimized(false);
    }
  }, [latestPartnerNote]);

  if (!visible || !latestPartnerNote) return null;

  return (
    <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 50, maxWidth: "300px", width: "calc(100vw - 48px)" }}>
      <AnimatePresence>
        {!minimized ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="glass-strong"
            style={{
              borderRadius: "20px",
              padding: "16px",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 30px rgba(248,200,220,0.08)",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "16px" }}>💌</span>
                <span style={{ fontSize: "12px", fontWeight: 600, color: "#F8C8DC" }}>
                  New note from {partnerName}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setMinimized(true)}
                  style={{ width: "22px", height: "22px", borderRadius: "6px", background: "#2E2E2E", border: "none", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B5F64" }}
                >
                  −
                </button>
                <button
                  onClick={() => setVisible(false)}
                  style={{ width: "22px", height: "22px", borderRadius: "6px", background: "#2E2E2E", border: "none", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "#6B5F64" }}
                >
                  ×
                </button>
              </div>
            </div>
            <p style={{ fontSize: "14px", color: "#F5F0F2", lineHeight: "1.5", fontStyle: "italic", marginBottom: "8px", wordBreak: "break-word" }}>
              "{latestPartnerNote.content}"
            </p>
            <p style={{ fontSize: "11px", color: "#6B5F64" }}>
              {formatNoteTime(latestPartnerNote.createdAt)}
            </p>
          </motion.div>
        ) : (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setMinimized(false)}
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #F4A6C1, #E8849E)",
              border: "none",
              cursor: "pointer",
              fontSize: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 20px rgba(232,132,158,0.4)",
              marginLeft: "auto",
            }}
          >
            💌
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
