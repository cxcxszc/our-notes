"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { X, Trash2 } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { useAuth } from "@/lib/auth-context";
import { useSharedPhotos } from "@/hooks/useSharedPhotos";

export default function MemoriesPage() {
  const { user, userProfile, loading } = useAuth();
  const { photos, loading: photosLoading, error, addPhoto, deletePhoto } = useSharedPhotos(userProfile?.pairId);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const seenPhotoIds = useRef<Set<string>>(new Set());
  const notificationsReady = useRef(false);

  const favoritePhotos = useMemo(() => photos.slice(0, 4), [photos]);
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);

  useEffect(() => {
    if (!user || !photos.length) return;

    if (!notificationsReady.current) {
      photos.forEach((photo) => seenPhotoIds.current.add(photo.id));
      notificationsReady.current = true;
      return;
    }

    photos.forEach((photo) => {
      if (!seenPhotoIds.current.has(photo.id)) {
        seenPhotoIds.current.add(photo.id);
        if (photo.authorId !== user.uid && "Notification" in window && Notification.permission === "granted") {
          new Notification(`New photo from ${photo.authorName}`, {
            body: photo.caption || "A new shared photo is waiting.",
            tag: `photo-${photo.id}`,
            icon: "/icons/icon-192.png",
          });
        }
      }
    });
  }, [photos, user]);

  if (loading || !user || !userProfile) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full" style={{ background: "var(--app-pink)" }} />
      </div>
    );
  }

  const handleUploadPhoto = async (file: File, caption?: string) => {
    await addPhoto(file, user.uid, userProfile.displayName, userProfile.pairId!, caption);
  };

  return (
    <div className="app-shell">
      <div className="app-mobile-frame">
        <main className="app-scroll">
          <header className="app-header">
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
              Photos
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--app-muted)" }}>
              Beautiful moments you have shared.
            </p>
          </header>

          <section className="app-section mb-6">
            <PhotoUploader onUpload={handleUploadPhoto} />
          </section>

          <section className="app-section mb-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold" style={{ color: "var(--app-text)" }}>
                Highlights
              </h2>
              <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "var(--app-pink-surface)", color: "var(--app-pink)" }}>
                {photos.length} memories
              </span>
            </div>
          </section>

          <section className="app-section mb-6 space-y-5">
            {photosLoading ? (
              [1, 2, 3].map((item) => <div key={item} className="app-card h-64 animate-pulse" />)
            ) : error ? (
              <div className="rounded-2xl border p-4 text-sm font-semibold" style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.22)", color: "var(--app-danger)" }}>
                {error}
              </div>
            ) : favoritePhotos.length === 0 ? (
              <div className="app-empty">No memories yet. Upload a shared photo above and it will appear here.</div>
            ) : (
              favoritePhotos.map((photo) => (
                <article key={photo.id} className="app-card overflow-hidden">
                  <button
                    className="relative flex w-full items-center justify-center overflow-hidden"
                    style={{ background: "var(--app-overlay)", maxHeight: 420 }}
                    onClick={() => setSelectedPhotoId(photo.id)}
                    type="button"
                  >
                    <img
                      src={photo.imageUrl}
                      alt={photo.caption || `Shared by ${photo.authorName}`}
                      className="max-h-[420px] w-full object-contain"
                    />
                  </button>

                  <div className="flex items-start justify-between gap-3 px-5 py-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-bold" style={{ color: "var(--app-text)" }}>
                        {photo.caption || "Shared moment"}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--app-muted)" }}>
                        {photo.authorId === user.uid ? "From you" : `From ${photo.authorName}`} • {photo.createdAt.toLocaleDateString()}
                      </p>
                    </div>
                    {photo.authorId === user.uid && (
                      <button
                        className="app-icon-button h-8 w-8 shrink-0 text-xs"
                        type="button"
                        onClick={() => deletePhoto(photo, user.uid)}
                        aria-label="Delete photo"
                        title="Delete photo"
                        style={{ color: "var(--app-danger)" }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </article>
              ))
            )}
          </section>

          {photos.length > 4 && (
            <section className="app-section mb-6">
              <h2 className="mb-3 text-base font-bold" style={{ color: "var(--app-text)" }}>
                Timeline
              </h2>
              <div className="space-y-3">
                {photos.slice(4).map((photo) => (
                  <button key={photo.id} className="app-card flex w-full items-start gap-4 p-4 text-left" onClick={() => setSelectedPhotoId(photo.id)} type="button">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl" style={{ background: "var(--app-overlay)" }}>
                      <img src={photo.imageUrl} alt={photo.caption || `Shared by ${photo.authorName}`} className="h-full w-full object-contain" />
                    </div>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold" style={{ color: "var(--app-text)" }}>
                        {photo.caption || "Untitled memory"}
                      </span>
                      <span className="mt-2 block text-xs" style={{ color: "var(--app-muted)" }}>
                        {photo.createdAt.toLocaleString()}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}
        </main>

        <BottomNav activeTab="memories" />
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur" onClick={() => setSelectedPhotoId(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl" style={{ background: "var(--app-card)" }} onClick={(event) => event.stopPropagation()}>
            <div className="relative flex items-center justify-center bg-black" style={{ touchAction: "pinch-zoom", overflow: "auto", maxHeight: "80vh" }}>
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.caption || `Shared by ${selectedPhoto.authorName}`}
                className="max-h-[80vh] w-full object-contain"
              />
              <button className="app-icon-button absolute right-4 top-4 bg-black/50 text-white" onClick={() => setSelectedPhotoId(null)} type="button" aria-label="Close memory">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold" style={{ color: "var(--app-text)" }}>
                {selectedPhoto.caption || "Shared moment"}
              </h3>
              <p className="mt-2 text-sm" style={{ color: "var(--app-muted)" }}>
                {selectedPhoto.authorId === user.uid ? "From you" : `From ${selectedPhoto.authorName}`} on {selectedPhoto.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
