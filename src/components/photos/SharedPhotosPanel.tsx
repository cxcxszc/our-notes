"use client";

import { AnimatePresence } from "framer-motion";
import { SharedPhoto } from "@/types";
import { PhotoCard } from "@/components/photos/PhotoCard";
import { PhotoUploader } from "@/components/photos/PhotoUploader";

interface SharedPhotosPanelProps {
  photos: SharedPhoto[];
  loading: boolean;
  error: string | null;
  currentUserId: string;
  onUpload: (file: File, caption?: string) => Promise<void>;
  onDelete: (photo: SharedPhoto, currentUserId: string) => Promise<void>;
}

export function SharedPhotosPanel({ photos, loading, error, currentUserId, onUpload, onDelete }: SharedPhotosPanelProps) {
  return (
    <section className="space-y-4">
      <PhotoUploader onUpload={onUpload} />

      {error ? (
        <div className="rounded-2xl border p-4 text-sm font-semibold" style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.22)", color: "var(--app-danger)" }}>
          {error}
        </div>
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="app-card h-52 animate-pulse" />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="app-empty">Share the first photo here.</div>
      ) : (
        <AnimatePresence>
          <div className="grid gap-3 sm:grid-cols-2">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} currentUserId={currentUserId} onDelete={onDelete} />
            ))}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
