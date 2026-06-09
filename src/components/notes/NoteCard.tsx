"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Note, REACTIONS, ReactionEmoji } from "@/types";
import { formatNoteTime } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  currentUserId: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onReact: (id: string, emoji: ReactionEmoji) => void;
  isMine: boolean;
}

export function NoteCard({
  note,
  currentUserId,
  onDelete,
  onEdit,
  onTogglePin,
  onReact,
  isMine,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSaveEdit = () => {
    const next = editContent.trim();
    if (next) onEdit(note.id, next);
    setEditing(false);
  };

  const authorLabel = isMine ? "From You" : `From ${note.authorName}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className="app-card p-5"
      style={{ borderColor: note.pinned ? "var(--app-pink-border)" : "var(--app-border)" }}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              💌
            </span>
            <p className="truncate text-sm font-bold" style={{ color: "var(--app-pink)" }}>
              {authorLabel}
            </p>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--app-dimmed)" }}>
            {formatNoteTime(note.createdAt)}
          </p>
        </div>

        {isMine && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => onTogglePin(note.id, note.pinned)}
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              title={note.pinned ? "Unpin" : "Pin"}
            >
              {note.pinned ? "P" : "+"}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              aria-label="Edit note"
              title="Edit"
            >
              E
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              aria-label="Delete note"
              title="Delete"
              style={{ color: "var(--app-danger)" }}
            >
              D
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            className="app-textarea"
            value={editContent}
            onChange={(event) => setEditContent(event.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="app-primary-button" type="button">
              Save
            </button>
            <button
              onClick={() => {
                setEditing(false);
                setEditContent(note.content);
              }}
              className="app-ghost-button"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-base leading-relaxed" style={{ color: "var(--app-text)" }}>
          {note.content}
        </p>
      )}

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {REACTIONS.map((emoji) => {
            const users = note.reactions?.[emoji] || [];
            const hasReacted = users.includes(currentUserId);

            return (
              <button
                key={emoji}
                onClick={() => onReact(note.id, emoji)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition"
                style={{
                  background: hasReacted ? "var(--app-pink-surface)" : "var(--app-overlay)",
                  borderColor: hasReacted ? "var(--app-pink-border)" : "var(--app-border)",
                  opacity: hasReacted || users.length > 0 ? 1 : 0.5,
                }}
                type="button"
                aria-label={`React with ${emoji}`}
              >
                <span>{emoji}</span>
                {users.length > 0 && <span style={{ color: "var(--app-muted)" }}>{users.length}</span>}
              </button>
            );
          })}
        </div>
        <span className="shrink-0 text-xs" style={{ color: "var(--app-dimmed)" }}>
          {formatNoteTime(note.createdAt)}
        </span>
      </div>
    </motion.article>
  );
}
