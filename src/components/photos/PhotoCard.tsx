"use client";

import { motion } from "framer-motion";
import { SharedPhoto } from "@/types";
import { formatNoteTime } from "@/lib/utils";

interface PhotoCardProps {
  photo: SharedPhoto;
  currentUserId: string;
  onDelete: (photo: SharedPhoto, currentUserId: string) => Promise<void>;
}

export function PhotoCard({ photo, currentUserId, onDelete }: PhotoCardProps) {
  const isMine = photo.authorId === currentUserId;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className="overflow-hidden rounded-lg border"
      style={{ background: "rgba(255, 253, 248, 0.86)", borderColor: "var(--line)", boxShadow: "0 12px 30px rgba(31, 35, 32, 0.07)" }}
    >
      <div className="aspect-[4/3] bg-stone-100">
        <img src={photo.imageUrl} alt={photo.caption || `Shared by ${photo.authorName}`} className="h-full w-full object-cover" />
      </div>
      <div className="space-y-2 p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "var(--ink)" }}>{isMine ? "You" : photo.authorName}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{formatNoteTime(photo.createdAt)}</p>
          </div>
          {isMine && (
            <button className="btn-icon" type="button" onClick={() => onDelete(photo, currentUserId)} aria-label="Delete photo" title="Delete photo" style={{ color: "var(--accent-strong)" }}>
              🗑️
            </button>
          )}
        </div>
        {photo.caption && <p className="break-words text-sm leading-6" style={{ color: "var(--ink)" }}>{photo.caption}</p>}
      </div>
    </motion.article>
  );
}