"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { SharedPhoto } from "@/types";
import { formatNoteTime } from "@/lib/utils";

interface PhotoCardProps {
  photo: SharedPhoto;
  currentUserId: string;
  onDelete: (photo: SharedPhoto, currentUserId: string) => Promise<void>;
}

export function PhotoCard({ photo, currentUserId, onDelete }: PhotoCardProps) {
  const isMine = photo.authorId === currentUserId;
  const [imgError, setImgError] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="app-card overflow-hidden"
    >
      <div className="aspect-[4/3]" style={{ background: "var(--app-overlay)" }}>
        {!imgError && photo.imageUrl ? (
          <img
            src={photo.imageUrl}
            alt={photo.caption || `Shared by ${photo.authorName}`}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm" style={{ color: "var(--app-muted)" }}>
            Image failed to load.
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "var(--app-text)" }}>
              {isMine ? "You" : photo.authorName}
            </p>
            <p className="text-xs" style={{ color: "var(--app-dimmed)" }}>
              {formatNoteTime(photo.createdAt)}
            </p>
          </div>

          {isMine && (
            <button
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              onClick={() => onDelete(photo, currentUserId)}
              aria-label="Delete photo"
              title="Delete photo"
              style={{ color: "var(--app-danger)" }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {photo.caption && (
          <p className="break-words text-sm leading-relaxed" style={{ color: "var(--app-muted)" }}>
            {photo.caption}
          </p>
        )}
      </div>
    </motion.article>
  );
}
