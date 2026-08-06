"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Note } from "@/types";

interface FloatingWidgetProps {
  latestUnreadPartnerNote: Note | null;
  partnerName: string;
  onOpenNote: () => void;
}

export function FloatingWidget({ latestUnreadPartnerNote, onOpenNote }: FloatingWidgetProps) {
  const [visible, setVisible] = useState(false);
  const shownNoteIdRef = useRef<string | null>(null);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pop up only when a *new* unread note shows up, then fade itself out
  // automatically after 5 seconds — it never previews the note content.
  useEffect(() => {
    if (latestUnreadPartnerNote && latestUnreadPartnerNote.id !== shownNoteIdRef.current) {
      shownNoteIdRef.current = latestUnreadPartnerNote.id;
      setVisible(true);

      if (fadeTimer.current) clearTimeout(fadeTimer.current);
      fadeTimer.current = setTimeout(() => setVisible(false), 5000);
    }
    if (!latestUnreadPartnerNote) {
      setVisible(false);
    }
    return () => {
      if (fadeTimer.current) clearTimeout(fadeTimer.current);
    };
  }, [latestUnreadPartnerNote]);

  if (!latestUnreadPartnerNote) return null;

  const handleOpen = () => {
    setVisible(false);
    onOpenNote();
  };

  return (
    <div className="fixed right-4 top-4 z-50 w-[calc(100vw-32px)] max-w-[260px]">
      <AnimatePresence>
        {visible && (
          <motion.button
            type="button"
            onClick={handleOpen}
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="app-card flex w-full items-center gap-2.5 p-3 text-left"
            aria-label={`New note from ${latestUnreadPartnerNote.authorName}`}
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
              style={{ background: "var(--app-pink-surface)" }}
              aria-hidden="true"
            >
              <Mail className="h-4 w-4" style={{ color: "var(--app-pink)" }} />
            </span>
            <span className="min-w-0">
              <span className="block text-xs font-extrabold tracking-wide" style={{ color: "var(--app-pink)" }}>
                NEW NOTE
              </span>
              <span className="block truncate text-xs" style={{ color: "var(--app-muted)" }}>
                from {latestUnreadPartnerNote.authorName}
              </span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
