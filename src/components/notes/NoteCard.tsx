"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [showActions, setShowActions] = useState(false);

  const handleSaveEdit = () => {
    if (editContent.trim()) {
      onEdit(note.id, editContent.trim());
    }
    setEditing(false);
  };

  const totalReactions = Object.values(note.reactions).reduce((sum, users) => sum + users.length, 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="card relative group"
      style={{
        borderColor: note.pinned ? "rgba(248,200,220,0.2)" : undefined,
        boxShadow: note.pinned ? "0 0 20px rgba(248,200,220,0.06)" : undefined,
      }}
    >
      {/* Pin indicator */}
      {note.pinned && (
        <div style={{ position: "absolute", top: "-8px", left: "16px", fontSize: "16px" }}>📌</div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: isMine ? "linear-gradient(135deg, #F4A6C1, #E8849E)" : "linear-gradient(135deg, #6B5F64, #3A3A3A)", color: isMine ? "#0F0F0F" : "#F5F0F2" }}>
            {note.authorName[0]?.toUpperCase()}
          </div>
          <span style={{ fontSize: "12px", color: "#A89BA2", fontWeight: 500 }}>{note.authorName}</span>
        </div>
        <span style={{ fontSize: "11px", color: "#6B5F64" }}>{formatNoteTime(note.createdAt)}</span>
      </div>

      {/* Content */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="input-base focus-ring"
            style={{ minHeight: "80px", fontSize: "14px" }}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <button onClick={handleSaveEdit} className="btn-primary" style={{ padding: "8px 16px", fontSize: "13px" }}>Save</button>
            <button onClick={() => { setEditing(false); setEditContent(note.content); }} className="btn-ghost" style={{ padding: "8px 16px", fontSize: "13px" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#F5F0F2", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{note.content}</p>
      )}

      {/* Reactions */}
      <div className="mt-3 flex flex-wrap items-center gap-1">
        {REACTIONS.map((emoji) => {
          const users = note.reactions[emoji] || [];
          const hasReacted = users.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => onReact(note.id, emoji)}
              className="transition-all duration-150"
              style={{
                fontSize: "13px",
                padding: "3px 8px",
                borderRadius: "20px",
                border: hasReacted ? "1px solid rgba(248,200,220,0.3)" : "1px solid transparent",
                background: hasReacted ? "rgba(248,200,220,0.08)" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "3px",
              }}
            >
              <span>{emoji}</span>
              {users.length > 0 && <span style={{ fontSize: "11px", color: "#A89BA2" }}>{users.length}</span>}
            </button>
          );
        })}
      </div>

      {/* Actions (visible on hover) */}
      {isMine && (
        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onTogglePin(note.id, note.pinned)}
            title={note.pinned ? "Unpin" : "Pin"}
            style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#222", border: "1px solid #2E2E2E", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            {note.pinned ? "📌" : "🔖"}
          </button>
          <button
            onClick={() => setEditing(true)}
            title="Edit"
            style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#222", border: "1px solid #2E2E2E", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(note.id)}
            title="Delete"
            style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#222", border: "1px solid rgba(232,132,158,0.2)", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            🗑️
          </button>
        </div>
      )}
    </motion.div>
  );
}
