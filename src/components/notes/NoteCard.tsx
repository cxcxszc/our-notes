"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Pin, Pencil, Trash2, Mail } from "lucide-react";
import { Note, REACTIONS, ReactionEmoji } from "@/types";
import { formatNoteTime, formatReadTimestamp } from "@/lib/utils";

interface NoteCardProps {
  note: Note;
  currentUserId: string;
  onDelete: (id: string) => void;
  onEdit: (id: string, content: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onReact: (id: string, emoji: ReactionEmoji) => void;
  onView?: (id: string) => void;
  isMine: boolean;
  authorPhotoURL?: string | null;
}

export function NoteCard({
  note,
  currentUserId,
  onDelete,
  onEdit,
  onTogglePin,
  onReact,
  onView,
  isMine,
  authorPhotoURL,
}: NoteCardProps) {
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  // Local, optimistic "I tapped to open this" flag — avoids waiting on the
  // Firestore round-trip for isRead before revealing the content.
  const [justOpened, setJustOpened] = useState(false);

  const isOpened = isMine || note.isRead || justOpened;

  const handleOpen = () => {
    if (isOpened) return;
    setJustOpened(true);
    onView?.(note.id);
  };

  let readStatusLabel: string | null = null;
  if (isMine) {
    const viewedAfterRead =
      note.lastViewedAt && note.readAt && note.lastViewedAt.getTime() > note.readAt.getTime() + 1000;
    if (viewedAfterRead) {
      readStatusLabel = `Last viewed ${formatReadTimestamp(note.lastViewedAt as Date)}`;
    } else if (note.isRead && note.readAt) {
      readStatusLabel = `Read ${formatReadTimestamp(note.readAt)}`;
    }
  }

  const handleSaveEdit = () => {
    const next = editContent.trim();
    if (next) onEdit(note.id, next);
    setEditing(false);
  };

  const authorLabel = isMine ? "You" : note.authorName;

  const AuthorAvatar = ({ size = "h-6 w-6 text-[10px]" }: { size?: string }) => (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full font-bold text-white`}
      style={{ background: "linear-gradient(135deg, #F8C8DC 0%, #F4A6C1 100%)" }}
      aria-hidden="true"
    >
      {authorPhotoURL ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={authorPhotoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        authorLabel.charAt(0).toUpperCase()
      )}
    </span>
  );

  // Unread partner note: show a closed-envelope teaser. Tapping it is what
  // marks the note as read — no separate "mark as read" control.
  if (!isOpened) {
    return (
      <motion.button
        layout
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        onClick={handleOpen}
        type="button"
        className="app-card flex w-full items-center gap-3 p-5 text-left"
        style={{ borderColor: "var(--app-pink-border)" }}
        aria-label={`Open new note from ${note.authorName}`}
      >
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          style={{ background: "var(--app-pink-surface)" }}
          aria-hidden="true"
        >
          <Mail className="h-5 w-5" style={{ color: "var(--app-pink)" }} />
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-2">
            <span className="block text-sm font-bold" style={{ color: "var(--app-pink)" }}>
              New note from {note.authorName}
            </span>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-extrabold tracking-wide text-white"
              style={{ background: "var(--app-pink)" }}
              aria-label="Unread"
            >
              NEW
            </span>
          </span>
          <span className="mt-0.5 block text-xs" style={{ color: "var(--app-dimmed)" }}>
            Tap to open • {formatNoteTime(note.createdAt)}
          </span>
        </span>
      </motion.button>
    );
  }

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
            <AuthorAvatar />
            <p className="truncate text-sm font-bold" style={{ color: "var(--app-pink)" }}>
              {authorLabel}
            </p>
          </div>
          <p className="mt-1 text-xs" style={{ color: "var(--app-dimmed)" }}>
            {formatNoteTime(note.createdAt)}
          </p>
          {readStatusLabel && (
            <p className="mt-0.5 text-xs font-semibold" style={{ color: "var(--app-pink)" }}>
              {readStatusLabel}
            </p>
          )}
        </div>

        {isMine && (
          <div className="flex shrink-0 items-center gap-1.5">
            <button
              onClick={() => onTogglePin(note.id, note.pinned)}
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              aria-label={note.pinned ? "Unpin note" : "Pin note"}
              title={note.pinned ? "Unpin" : "Pin"}
            >
              <Pin className="h-3.5 w-3.5" style={{ fill: note.pinned ? "var(--app-pink)" : "none", color: note.pinned ? "var(--app-pink)" : "var(--app-muted)" }} />
            </button>
            <button
              onClick={() => setEditing(true)}
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              aria-label="Edit note"
              title="Edit"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(note.id)}
              className="app-icon-button h-8 w-8 text-xs"
              type="button"
              aria-label="Delete note"
              title="Delete"
              style={{ color: "var(--app-danger)" }}
            >
              <Trash2 className="h-3.5 w-3.5" />
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
