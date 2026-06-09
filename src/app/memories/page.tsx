"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useSharedPhotos } from "@/hooks/useSharedPhotos";

export default function MemoriesPage() {
  const { user, userProfile, loading } = useAuth();
  const { photos, loading: photosLoading, error } = useSharedPhotos(userProfile?.pairId);
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);

  const favoritePhotos = useMemo(() => photos.slice(0, 4), [photos]);
  const selectedPhoto = photos.find((photo) => photo.id === selectedPhotoId);

  if (loading || !user || !userProfile) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full" style={{ background: "var(--app-pink)" }} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-mobile-frame">
        <main className="app-scroll">
          <header className="app-header">
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
              Our Memories
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--app-muted)" }}>
              Beautiful moments you have shared.
            </p>
          </header>

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
              <div className="app-empty">
                No memories yet. Upload shared photos from Notes and they will appear here.
              </div>
            ) : (
              favoritePhotos.map((photo) => (
                <article key={photo.id} className="app-card overflow-hidden">
                  <button className="relative block aspect-[4/3] w-full overflow-hidden" onClick={() => setSelectedPhotoId(photo.id)} type="button">
                    <img src={photo.imageUrl} alt={photo.caption || `Shared by ${photo.authorName}`} className="h-full w-full object-cover transition-transform hover:scale-[1.02]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-left text-white">
                      <h3 className="truncate text-lg font-bold leading-none">{photo.caption || "Shared moment"}</h3>
                      <p className="mt-1 text-xs opacity-85">{photo.createdAt.toLocaleDateString()}</p>
                    </div>
                  </button>

                  <div className="px-5 py-4">
                    <p className="text-sm leading-relaxed" style={{ color: "var(--app-muted)" }}>
                      {photo.authorId === user.uid ? "From you" : `From ${photo.authorName}`}
                    </p>
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
                    <img src={photo.imageUrl} alt={photo.caption || `Shared by ${photo.authorName}`} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
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

        <nav className="app-bottom-nav" aria-label="Main navigation">
          <div className="app-bottom-nav-inner">
            <Link className="app-nav-item" data-active="false" href="/dashboard">
              <span className="text-lg" aria-hidden="true">⌂</span>
              <span>Notes</span>
            </Link>
            <Link className="app-nav-item" data-active="true" href="/memories">
              <span className="text-lg" aria-hidden="true">□</span>
              <span>Memories</span>
            </Link>
          </div>
        </nav>
      </div>

      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur" onClick={() => setSelectedPhotoId(null)}>
          <div className="w-full max-w-md overflow-hidden rounded-3xl" style={{ background: "var(--app-card)" }} onClick={(event) => event.stopPropagation()}>
            <div className="relative aspect-[4/3]">
              <img src={selectedPhoto.imageUrl} alt={selectedPhoto.caption || `Shared by ${selectedPhoto.authorName}`} className="h-full w-full object-cover" />
              <button className="app-icon-button absolute right-4 top-4 bg-black/50 text-white" onClick={() => setSelectedPhotoId(null)} type="button" aria-label="Close memory">
                x
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
