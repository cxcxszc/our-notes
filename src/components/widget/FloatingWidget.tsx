"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Note } from "@/types";
import { formatNoteTime } from "@/lib/utils";

interface FloatingWidgetProps {
  latestUnreadPartnerNote: Note | null;
  partnerName: string;
  onOpenNote: (noteId: string) => void;
}

export function FloatingWidget({ latestUnreadPartnerNote, partnerName, onOpenNote }: FloatingWidgetProps) {
  const [minimized, setMinimized] = useState(false);
  const [visible, setVisible] = useState(false);
  const shownNoteIdRef = useRef<string | null>(null);

  // Only pop up when a *new* unread note shows up. Once a note is marked
  // read (isRead flips in Firestore), latestUnreadPartnerNote goes null/changes
  // and the popup hides itself automatically.
  useEffect(() => {
    if (latestUnreadPartnerNote && latestUnreadPartnerNote.id !== shownNoteIdRef.current) {
      shownNoteIdRef.current = latestUnreadPartnerNote.id;
      setVisible(true);
      setMinimized(false);
    }
    if (!latestUnreadPartnerNote) {
      setVisible(false);
    }
  }, [latestUnreadPartnerNote]);

  if (!visible || !latestUnreadPartnerNote) return null;

  const handleOpen = () => {
    onOpenNote(latestUnreadPartnerNote.id);
  };

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
                New note from {partnerName}
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

            <button className="block w-full text-left" onClick={handleOpen} type="button" aria-label="Open note and mark as read">
              <p className="break-words text-sm leading-relaxed" style={{ color: "var(--app-text)" }}>
                {latestUnreadPartnerNote.content}
              </p>
              <p className="mt-2 text-xs" style={{ color: "var(--app-dimmed)" }}>
                {formatNoteTime(latestUnreadPartnerNote.createdAt)}
              </p>
            </button>
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
            aria-label="Open latest note"
          >
            New
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
