"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getMessagingInstance } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useNotes } from "@/hooks/useNotes";
import { usePresence, usePartnerPresence } from "@/hooks/usePresence";
import { useSharedPhotos } from "@/hooks/useSharedPhotos";
import { NoteCard } from "@/components/notes/NoteCard";
import { AddNoteForm } from "@/components/notes/AddNoteForm";
import { QuickActions } from "@/components/notes/QuickActions";
import { SharedPhotosPanel } from "@/components/photos/SharedPhotosPanel";
import { DashboardHeader } from "@/components/ui/DashboardHeader";
import { FloatingWidget } from "@/components/widget/FloatingWidget";
import { ReactionEmoji, SharedPhoto } from "@/types";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partnerName, setPartnerName] = useState("Partner");
  const [activeTab, setActiveTab] = useState<"mine" | "theirs">("mine");
  const [notificationState, setNotificationState] = useState<"idle" | "loading" | "enabled" | "unsupported" | "denied">("idle");

  const seenNoteIds = useRef<Set<string>>(new Set());
  const seenPhotoIds = useRef<Set<string>>(new Set());
  const reactionCounts = useRef<Map<string, number>>(new Map());
  const notificationsReady = useRef(false);

  const { notes, loading: notesLoading, addNote, updateNote, deleteNote, togglePin, toggleReaction } = useNotes(userProfile?.pairId);
  const { photos, loading: photosLoading, error: photosError, addPhoto, deletePhoto } = useSharedPhotos(userProfile?.pairId);

  usePresence(user?.uid, userProfile?.displayName);
  const partnerPresence = usePartnerPresence(userProfile?.partnerId);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (userProfile && !userProfile.pairId) { router.replace("/pair"); }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    if (!userProfile?.partnerId) return;
    getDoc(doc(db, "users", userProfile.partnerId)).then((snap) => {
      if (snap.exists()) setPartnerName(snap.data().displayName || "Partner");
    });
  }, [userProfile?.partnerId]);

  const myNotes = useMemo(() => notes.filter((n) => n.authorId === user?.uid), [notes, user?.uid]);
  const partnerNotes = useMemo(() => notes.filter((n) => n.authorId !== user?.uid), [notes, user?.uid]);
  const partnerPhotos = useMemo(() => photos.filter((photo) => photo.authorId !== user?.uid), [photos, user?.uid]);
  const pinnedNotes = useMemo(() => notes.filter((n) => n.pinned), [notes]);
  const latestPartnerNote = partnerNotes[0] || null;
  const latestPartnerPhoto = partnerPhotos[0] || null;

  const showBrowserNotification = (title: string, body: string, tag: string, image?: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const options: NotificationOptions & { image?: string } = {
      body,
      tag,
      icon: "/icons/icon-192.png",
    };
    if (image) options.image = image;
    new Notification(title, options);
  };

  useEffect(() => {
    if (!user || !notes.length) return;

    if (!notificationsReady.current) {
      notes.forEach((note) => {
        seenNoteIds.current.add(note.id);
        reactionCounts.current.set(note.id, Object.values(note.reactions || {}).reduce((sum, users) => sum + users.length, 0));
      });
      notificationsReady.current = true;
      return;
    }

    notes.forEach((note) => {
      const totalReactions = Object.values(note.reactions || {}).reduce((sum, users) => sum + users.length, 0);
      const previousReactions = reactionCounts.current.get(note.id) ?? totalReactions;

      if (!seenNoteIds.current.has(note.id)) {
        seenNoteIds.current.add(note.id);
        if (note.authorId !== user.uid) {
          showBrowserNotification(`💬 New note from ${note.authorName}`, note.content, `note-${note.id}`);
        }
      } else if (note.authorId === user.uid && totalReactions > previousReactions) {
        showBrowserNotification("❤️ New reaction", `${partnerName} reacted to your note.`, `reaction-${note.id}-${totalReactions}`);
      }

      reactionCounts.current.set(note.id, totalReactions);
    });
  }, [notes, partnerName, user]);

  useEffect(() => {
    if (!user || !photos.length) return;

    const firstRun = seenPhotoIds.current.size === 0;
    photos.forEach((photo) => {
      if (!seenPhotoIds.current.has(photo.id)) {
        seenPhotoIds.current.add(photo.id);
        if (!firstRun && photo.authorId !== user.uid) {
          showBrowserNotification(`📸 New photo from ${photo.authorName}`, photo.caption || "A new shared photo is waiting.", `photo-${photo.id}`, photo.imageUrl);
        }
      }
    });
  }, [photos, user]);

  if (authLoading || !userProfile || !user) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-lg" style={{ background: "var(--ink)" }} />
      </div>
    );
  }

  const handleAddNote = async (content: string) => {
    await addNote(content, user.uid, userProfile.displayName, userProfile.pairId!);
  };

  const handleQuickSend = async (message: string) => {
    await addNote(message, user.uid, userProfile.displayName, userProfile.pairId!);
  };

  const handleUploadPhoto = async (file: File, caption?: string) => {
    await addPhoto(file, user.uid, userProfile.displayName, userProfile.pairId!, caption);
  };

  const handleDeletePhoto = async (photo: SharedPhoto, currentUserId: string) => {
    await deletePhoto(photo, currentUserId);
  };

  const handleEnableNotifications = async () => {
    setNotificationState("loading");
    try {
      const messaging = await getMessagingInstance();
      if (!messaging || !("Notification" in window)) {
        setNotificationState("unsupported");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationState("denied");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (token) {
        await updateDoc(doc(db, "users", user.uid), {
          notificationTokens: arrayUnion(token),
        });
        setNotificationState("enabled");
        showBrowserNotification("🔔 Notifications enabled", "New notes, reactions, and photos can now pop up here.", "notifications-enabled");
      } else {
        setNotificationState("unsupported");
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setNotificationState("unsupported");
    }
  };

  const EmptyState = ({ children }: { children: React.ReactNode }) => (
    <div className="rounded-lg border border-dashed p-8 text-center text-sm" style={{ borderColor: "var(--line)", color: "var(--muted)", background: "rgba(255, 253, 248, 0.46)" }}>
      {children}
    </div>
  );

  return (
    <div className="app-shell">
      <DashboardHeader partnerPresence={partnerPresence} partnerName={partnerName} />

      <main className="app-container py-5 md:py-8">
        <section className="hero-panel mb-5 p-4 md:mb-6 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="section-label mb-2">Shared notebook</p>
              <h1 className="font-semibold leading-tight" style={{ fontFamily: "Newsreader, serif", fontSize: "clamp(32px, 7vw, 54px)", color: "var(--ink)" }}>
                {userProfile.displayName} + {partnerName}
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 md:text-base" style={{ color: "var(--muted)" }}>
                Real-time notes, quick check-ins, shared photos, and the little moments worth keeping.
              </p>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center md:min-w-[360px]">
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--line)", background: "rgba(255, 253, 248, 0.58)" }}>
                <p className="text-lg font-bold">{notes.length}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Notes</p>
              </div>
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--line)", background: "rgba(255, 253, 248, 0.58)" }}>
                <p className="text-lg font-bold">{photos.length}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Photos</p>
              </div>
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--line)", background: "rgba(255, 253, 248, 0.58)" }}>
                <p className="text-lg font-bold">{pinnedNotes.length}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Pinned</p>
              </div>
              <div className="rounded-lg border p-3" style={{ borderColor: "var(--line)", background: "rgba(255, 253, 248, 0.58)" }}>
                <p className="text-lg font-bold">{partnerPresence?.online ? "Live" : "Away"}</p>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Status</p>
              </div>
            </div>
          </div>
        </section>

        <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <QuickActions onSend={handleQuickSend} />
          <button onClick={handleEnableNotifications} className="btn-ghost w-full md:w-auto" style={{ color: "#000" }} disabled={notificationState === "loading" || notificationState === "enabled"}>
            {notificationState === "loading" && "🔔 Enabling..."}
            {notificationState === "enabled" && "🔔 Notifications on"}
            {notificationState === "unsupported" && "⚠️ Notifications unavailable"}
            {notificationState === "denied" && "🚫 Notifications blocked"}
            {notificationState === "idle" && "🔔 Enable notifications"}
          </button>
        </div>

        <div className="segmented-control mb-5 md:hidden">
          <button onClick={() => setActiveTab("mine")} aria-pressed={activeTab === "mine"}>📝 {userProfile.displayName} ({myNotes.length})</button>
          <button onClick={() => setActiveTab("theirs")} aria-pressed={activeTab === "theirs"}>💬 {partnerName} ({partnerNotes.length})</button>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <section className={activeTab === "theirs" ? "hidden md:block" : "block"}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="section-label">Composer</p>
                <h2 className="text-xl font-bold">📝 {userProfile.displayName}</h2>
              </div>
              <span className="rounded-full border px-2.5 py-1 text-xs font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>{myNotes.length}</span>
            </div>
            <AddNoteForm onAdd={handleAddNote} />
            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
              </div>
            ) : myNotes.length === 0 ? (
              <EmptyState>Write your first note for {partnerName}.</EmptyState>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {myNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      currentUserId={user.uid}
                      isMine={true}
                      onDelete={deleteNote}
                      onEdit={updateNote}
                      onTogglePin={togglePin}
                      onReact={(id, emoji) => toggleReaction(id, emoji as ReactionEmoji, user.uid)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>

          <section className={activeTab === "mine" ? "hidden md:block" : "block"}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="section-label">{partnerName}</p>
                <h2 className="text-xl font-bold">💬 {partnerName}</h2>
              </div>
              <span className="rounded-full border px-2.5 py-1 text-xs font-bold" style={{ borderColor: "var(--line)", color: "var(--muted)" }}>{partnerNotes.length}</span>
            </div>
            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="card h-28 animate-pulse" />)}
              </div>
            ) : partnerNotes.length === 0 ? (
              <EmptyState>Waiting for {partnerName} to write.</EmptyState>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {partnerNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      currentUserId={user.uid}
                      isMine={false}
                      onDelete={deleteNote}
                      onEdit={updateNote}
                      onTogglePin={togglePin}
                      onReact={(id, emoji) => toggleReaction(id, emoji as ReactionEmoji, user.uid)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </section>
        </div>

        <SharedPhotosPanel
          photos={photos}
          loading={photosLoading}
          error={photosError}
          currentUserId={user.uid}
          onUpload={handleUploadPhoto}
          onDelete={handleDeletePhoto}
        />
      </main>

      <FloatingWidget
        latestPartnerNote={latestPartnerNote}
        latestPartnerPhoto={latestPartnerPhoto}
        partnerName={partnerName}
        currentUserId={user.uid}
      />
    </div>
  );
}