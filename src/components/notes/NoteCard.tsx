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

export function NoteCard({ note, currentUserId, onDelete, onEdit, onTogglePin, onReact, isMine }: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);

  const handleSaveEdit = () => {
    if (editContent.trim()) onEdit(note.id, editContent.trim());
    setEditing(false);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      className={`note-card group ${isMine ? "mine" : "theirs"} ${note.pinned ? "pinned" : ""}`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
            style={{
              background: isMine ? "var(--ink)" : "var(--sage)",
              color: "#fffdf8",
            }}
          >
            {note.authorName[0]?.toUpperCase() || "?"}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "var(--ink)" }}>{note.authorName}</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>{formatNoteTime(note.createdAt)}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {note.pinned && <span className="rounded-full px-2 py-1 text-xs font-bold" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>📌 Pinned</span>}
          {isMine && (
            <div className="flex gap-1 opacity-100 md:opacity-0 md:transition-opacity md:group-hover:opacity-100">
              <button onClick={() => onTogglePin(note.id, note.pinned)} className="btn-icon" title={note.pinned ? "Unpin" : "Pin"} aria-label={note.pinned ? "Unpin note" : "Pin note"}>{note.pinned ? "📍" : "📌"}</button>
              <button onClick={() => setEditing(true)} className="btn-icon" title="Edit" aria-label="Edit note">✏️</button>
              <button onClick={() => onDelete(note.id)} className="btn-icon" title="Delete" aria-label="Delete note" style={{ color: "var(--accent-strong)" }}>🗑️</button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-3">
          <textarea
            className="input-base focus-ring"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="btn-primary" type="button">💾 Save</button>
            <button onClick={() => { setEditing(false); setEditContent(note.content); }} className="btn-ghost" type="button">↩️ Cancel</button>
          </div>
        </div>
      ) : (
        <p className="whitespace-pre-wrap break-words text-[15px] leading-7" style={{ color: "var(--ink)" }}>{note.content}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {REACTIONS.map((emoji) => {
          const users = note.reactions?.[emoji] || [];
          const hasReacted = users.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => onReact(note.id, emoji)}
              className="rounded-full border px-2.5 py-1 text-sm transition"
              style={{
                borderColor: hasReacted ? "rgba(199, 95, 84, 0.36)" : "var(--line)",
                background: hasReacted ? "var(--accent-soft)" : "rgba(255, 253, 248, 0.48)",
              }}
              aria-label={`React with ${emoji}`}
            >
              <span>{emoji}</span>
              {users.length > 0 && <span className="ml-1 text-xs font-bold" style={{ color: "var(--muted)" }}>{users.length}</span>}
            </button>
          );
        })}
      </div>
    </motion.article>
  );
}