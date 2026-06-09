"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
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
import { formatNoteTime } from "@/lib/utils";
import { ReactionEmoji, SharedPhoto } from "@/types";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partnerName, setPartnerName] = useState("Partner");
  const [activeTab, setActiveTab] = useState<"mine" | "theirs">("theirs");
  const [latestMinimized, setLatestMinimized] = useState(false);
  const [notificationState, setNotificationState] = useState<
    "idle" | "loading" | "enabled" | "unsupported" | "denied"
  >("idle");

  const seenNoteIds = useRef<Set<string>>(new Set());
  const seenPhotoIds = useRef<Set<string>>(new Set());
  const reactionCounts = useRef<Map<string, number>>(new Map());
  const notificationsReady = useRef(false);

  const { notes, loading: notesLoading, addNote, updateNote, deleteNote, togglePin, toggleReaction } =
    useNotes(userProfile?.pairId);
  const { photos, loading: photosLoading, error: photosError, addPhoto, deletePhoto } =
    useSharedPhotos(userProfile?.pairId);

  usePresence(user?.uid, userProfile?.displayName);
  const partnerPresence = usePartnerPresence(userProfile?.partnerId);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (userProfile && !userProfile.pairId) router.replace("/pair");
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    if (!userProfile?.partnerId) return;
    getDoc(doc(db, "users", userProfile.partnerId)).then((snap) => {
      if (snap.exists()) setPartnerName(snap.data().displayName || "Partner");
    });
  }, [userProfile?.partnerId]);

  const myNotes = useMemo(() => notes.filter((note) => note.authorId === user?.uid), [notes, user?.uid]);
  const partnerNotes = useMemo(() => notes.filter((note) => note.authorId !== user?.uid), [notes, user?.uid]);
  const partnerPhotos = useMemo(() => photos.filter((photo) => photo.authorId !== user?.uid), [photos, user?.uid]);
  const latestPartnerNote = partnerNotes[0] || null;
  const latestPartnerPhoto = partnerPhotos[0] || null;
  const displayedNotes = activeTab === "theirs" ? partnerNotes : myNotes;

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
        reactionCounts.current.set(
          note.id,
          Object.values(note.reactions || {}).reduce((sum, users) => sum + users.length, 0)
        );
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
          showBrowserNotification(`New note from ${note.authorName}`, note.content, `note-${note.id}`);
        }
      } else if (note.authorId === user.uid && totalReactions > previousReactions) {
        showBrowserNotification("New reaction", `${partnerName} reacted to your note.`, `reaction-${note.id}-${totalReactions}`);
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
          showBrowserNotification(
            `New photo from ${photo.authorName}`,
            photo.caption || "A new shared photo is waiting.",
            `photo-${photo.id}`,
            photo.imageUrl
          );
        }
      }
    });
  }, [photos, user]);

  if (authLoading || !userProfile || !user) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full" style={{ background: "var(--app-pink)" }} />
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

      if (!token) {
        setNotificationState("unsupported");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        notificationTokens: arrayUnion(token),
      });
      setNotificationState("enabled");
      showBrowserNotification("Notifications enabled", "New notes, reactions, and photos can now pop up here.", "notifications-enabled");
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setNotificationState("unsupported");
    }
  };

  return (
    <div className="app-shell">
      <div className="app-mobile-frame">
        <div className="app-scroll">
          <DashboardHeader partnerPresence={partnerPresence} partnerName={partnerName} />

          <section className="app-section mb-6">
            {!latestMinimized ? (
              <div className="app-love-card relative p-6">
                <button
                  onClick={() => setLatestMinimized(true)}
                  className="app-icon-button absolute right-4 top-4 h-8 w-8"
                  type="button"
                  aria-label="Minimize latest note"
                >
                  v
                </button>
                <p className="mb-3 text-sm" style={{ color: "var(--app-muted)" }}>
                  Latest Note
                </p>
                {latestPartnerNote ? (
                  <>
                    <p className="mb-4 text-xl font-bold leading-snug" style={{ color: "var(--app-text)" }}>
                      &quot;{latestPartnerNote.content}&quot;
                    </p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold" style={{ color: "var(--app-pink)" }}>
                        From {latestPartnerNote.authorName}
                      </span>
                      <span className="text-sm" style={{ color: "var(--app-dimmed)" }}>
                        {formatNoteTime(latestPartnerNote.createdAt)}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-base" style={{ color: "var(--app-muted)" }}>
                    Your newest shared note will appear here.
                  </p>
                )}
              </div>
            ) : (
              <button className="app-chip" onClick={() => setLatestMinimized(false)} type="button">
                Show latest note
              </button>
            )}
          </section>

          <section className="app-section mb-7">
            <QuickActions onSend={handleQuickSend} />
          </section>

          <section className="app-section mb-5">
            <button
              onClick={handleEnableNotifications}
              className="app-ghost-button w-full"
              type="button"
              disabled={notificationState === "loading" || notificationState === "enabled"}
            >
              {notificationState === "loading" && "Enabling notifications"}
              {notificationState === "enabled" && "Notifications on"}
              {notificationState === "unsupported" && "Notifications unavailable"}
              {notificationState === "denied" && "Notifications blocked"}
              {notificationState === "idle" && "Enable notifications"}
            </button>
          </section>

          <section className="app-section mb-5">
            <div className="app-segmented">
              <button onClick={() => setActiveTab("theirs")} aria-pressed={activeTab === "theirs"} type="button">
                {partnerName}&apos;s Notes
              </button>
              <button onClick={() => setActiveTab("mine")} aria-pressed={activeTab === "mine"} type="button">
                My Notes
              </button>
            </div>
          </section>

          <section className="app-section mb-6 space-y-4">
            {notesLoading ? (
              [1, 2, 3].map((item) => <div key={item} className="app-card h-32 animate-pulse" />)
            ) : displayedNotes.length === 0 ? (
              <div className="app-empty">
                {activeTab === "theirs" ? `Waiting for ${partnerName} to write.` : `Leave your first note for ${partnerName}.`}
              </div>
            ) : (
              <AnimatePresence>
                {displayedNotes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    currentUserId={user.uid}
                    isMine={note.authorId === user.uid}
                    onDelete={deleteNote}
                    onEdit={updateNote}
                    onTogglePin={togglePin}
                    onReact={(id, emoji) => toggleReaction(id, emoji as ReactionEmoji, user.uid)}
                  />
                ))}
              </AnimatePresence>
            )}
          </section>

          <section className="app-section mb-7">
            <AddNoteForm onAdd={handleAddNote} partnerName={partnerName} />
          </section>

          <section className="app-section mb-4">
            <SharedPhotosPanel
              photos={photos}
              loading={photosLoading}
              error={photosError}
              currentUserId={user.uid}
              onUpload={handleUploadPhoto}
              onDelete={handleDeletePhoto}
            />
          </section>
        </div>

        <nav className="app-bottom-nav" aria-label="Main navigation">
          <div className="app-bottom-nav-inner">
            <Link className="app-nav-item" data-active="true" href="/dashboard">
              <span className="text-lg" aria-hidden="true">⌂</span>
              <span>Notes</span>
            </Link>
            <Link className="app-nav-item" data-active="false" href="/memories">
              <span className="text-lg" aria-hidden="true">□</span>
              <span>Memories</span>
            </Link>
            <button className="app-nav-item" data-active="false" onClick={handleEnableNotifications} type="button">
              <span className="text-lg" aria-hidden="true">!</span>
              <span>Alerts</span>
            </button>
          </div>
        </nav>
      </div>

      <FloatingWidget
        latestPartnerNote={latestPartnerNote}
        latestPartnerPhoto={latestPartnerPhoto}
        partnerName={partnerName}
        currentUserId={user.uid}
      />
    </div>
  );
}
