"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Note, SharedPhoto } from "@/types";
import { formatNoteTime } from "@/lib/utils";

interface FloatingWidgetProps {
  latestPartnerNote: Note | null;
  latestPartnerPhoto: SharedPhoto | null;
  partnerName: string;
  currentUserId: string;
}

type WidgetItem =
  | { type: "note"; id: string; createdAt: Date; content: string }
  | { type: "photo"; id: string; createdAt: Date; imageUrl: string; caption?: string };

export function FloatingWidget({ latestPartnerNote, latestPartnerPhoto, partnerName }: FloatingWidgetProps) {
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(false);
  const [lastItemId, setLastItemId] = useState<string | null>(null);

  const latestItem = useMemo<WidgetItem | null>(() => {
    if (!latestPartnerNote && !latestPartnerPhoto) return null;
    if (latestPartnerNote && !latestPartnerPhoto) {
      return { type: "note", id: latestPartnerNote.id, createdAt: latestPartnerNote.createdAt, content: latestPartnerNote.content };
    }
    if (!latestPartnerNote && latestPartnerPhoto) {
      return { type: "photo", id: latestPartnerPhoto.id, createdAt: latestPartnerPhoto.createdAt, imageUrl: latestPartnerPhoto.imageUrl, caption: latestPartnerPhoto.caption };
    }
    return latestPartnerPhoto!.createdAt > latestPartnerNote!.createdAt
      ? { type: "photo", id: latestPartnerPhoto!.id, createdAt: latestPartnerPhoto!.createdAt, imageUrl: latestPartnerPhoto!.imageUrl, caption: latestPartnerPhoto!.caption }
      : { type: "note", id: latestPartnerNote!.id, createdAt: latestPartnerNote!.createdAt, content: latestPartnerNote!.content };
  }, [latestPartnerNote, latestPartnerPhoto]);

  useEffect(() => {
    if (latestItem && latestItem.id !== lastItemId) {
      setLastItemId(latestItem.id);
      setVisible(true);
      setMinimized(false);
    }
  }, [latestItem, lastItemId]);

  if (!visible || !latestItem) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[calc(100vw-32px)] max-w-[320px] sm:bottom-6 sm:right-6">
      <AnimatePresence>
        {!minimized ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="rounded-lg border p-4"
            style={{ background: "rgba(255, 253, 248, 0.94)", borderColor: "var(--line)", boxShadow: "var(--shadow)", backdropFilter: "blur(18px)" }}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span aria-hidden="true">{latestItem.type === "photo" ? "📸" : "💬"}</span>
                <span className="truncate text-xs font-bold" style={{ color: "var(--ink)" }}>
                  {latestItem.type === "photo" ? `New photo from ${partnerName}` : `New note from ${partnerName}`}
                </span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setMinimized(true)} className="btn-icon !h-7 !min-h-7 !w-7" aria-label="Minimize widget" title="Minimize">➖</button>
                <button onClick={() => setVisible(false)} className="btn-icon !h-7 !min-h-7 !w-7" aria-label="Close widget" title="Close">✖️</button>
              </div>
            </div>

            {latestItem.type === "photo" ? (
              <div className="space-y-2">
                <img src={latestItem.imageUrl} alt={latestItem.caption || `Shared by ${partnerName}`} className="aspect-[4/3] w-full rounded-lg object-cover" />
                {latestItem.caption && <p className="break-words text-sm leading-6" style={{ color: "var(--ink)" }}>{latestItem.caption}</p>}
              </div>
            ) : (
              <p className="break-words text-sm leading-6" style={{ color: "var(--ink)" }}>
                {latestItem.content}
              </p>
            )}
            <p className="mt-2 text-xs" style={{ color: "var(--muted)" }}>{formatNoteTime(latestItem.createdAt)}</p>
          </motion.div>
        ) : (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setMinimized(false)}
            className="ml-auto flex h-14 w-14 items-center justify-center rounded-full border text-2xl shadow-lg"
            style={{ background: "var(--ink)", borderColor: "var(--line)", color: "#fffdf8" }}
            aria-label="Open latest shared item"
          >
            {latestItem.type === "photo" ? "📸" : "💬"}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}