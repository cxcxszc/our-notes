"use client";

import { useState } from "react";
import { Send } from "lucide-react";

interface AddNoteFormProps {
  onAdd: (content: string) => Promise<void>;
  partnerName?: string;
}

export function AddNoteForm({ onAdd, partnerName = "Partner" }: AddNoteFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = content.trim();
    if (!next) return;

    setLoading(true);
    try {
      await onAdd(next);
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="app-card p-4">
      <textarea
        className="app-textarea"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder={`Leave a note for ${partnerName}...`}
        maxLength={1000}
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs" style={{ color: "var(--app-dimmed)" }}>
          {content.length}/1000
        </span>
        <button className="app-primary-button" type="submit" disabled={loading || !content.trim()}>
          <span>{loading ? "Sending" : "Send"}</span>
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </form>
  );
}
