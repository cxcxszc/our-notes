"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-32px)] max-w-[320px]">
      <AnimatePresence>
        {!minimized ? (
          <motion.div
            key="expanded"
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="app-card p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="truncate text-xs font-bold" style={{ color: "var(--app-text)" }}>
                {latestItem.type === "photo" ? `New photo from ${partnerName}` : `New note from ${partnerName}`}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setMinimized(true)} className="app-icon-button h-7 w-7 text-xs" aria-label="Minimize widget" title="Minimize" type="button">
                  _
                </button>
                <button onClick={() => setVisible(false)} className="app-icon-button h-7 w-7 text-xs" aria-label="Close widget" title="Close" type="button">
                  x
                </button>
              </div>
            </div>

            {latestItem.type === "photo" ? (
              <div className="space-y-2">
                <img src={latestItem.imageUrl} alt={latestItem.caption || `Shared by ${partnerName}`} className="aspect-[4/3] w-full rounded-2xl object-cover" />
                {latestItem.caption && <p className="break-words text-sm leading-relaxed" style={{ color: "var(--app-text)" }}>{latestItem.caption}</p>}
              </div>
            ) : (
              <p className="break-words text-sm leading-relaxed" style={{ color: "var(--app-text)" }}>
                {latestItem.content}
              </p>
            )}
            <p className="mt-2 text-xs" style={{ color: "var(--app-dimmed)" }}>
              {formatNoteTime(latestItem.createdAt)}
            </p>
          </motion.div>
        ) : (
          <motion.button
            key="minimized"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setMinimized(false)}
            className="app-chip ml-auto flex"
            type="button"
            aria-label="Open latest shared item"
          >
            New
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
