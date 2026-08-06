"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useNotes } from "@/hooks/useNotes";
import { usePresence, usePartnerPresence } from "@/hooks/usePresence";
import { NoteCard } from "@/components/notes/NoteCard";
import { AddNoteForm } from "@/components/notes/AddNoteForm";
import { DashboardHeader } from "@/components/ui/DashboardHeader";
import { FloatingWidget } from "@/components/widget/FloatingWidget";
import { BottomNav } from "@/components/ui/BottomNav";
import { MiniGamesCard } from "@/components/games/MiniGames";
import { ReactionEmoji } from "@/types";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partnerName, setPartnerName] = useState("Partner");
  const [partnerPhotoURL, setPartnerPhotoURL] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"mine" | "theirs">("theirs");

  // Remember the last selected Notes tab across visits.
  useEffect(() => {
    const saved = localStorage.getItem("ck-space-notes-tab");
    if (saved === "mine" || saved === "theirs") setActiveTab(saved);
  }, []);

  const selectNotesTab = (tab: "mine" | "theirs") => {
    setActiveTab(tab);
    localStorage.setItem("ck-space-notes-tab", tab);
  };

  const seenNoteIds = useRef<Set<string>>(new Set());
  const reactionCounts = useRef<Map<string, number>>(new Map());
  const notificationsReady = useRef(false);

  const { notes, loading: notesLoading, addNote, updateNote, deleteNote, togglePin, toggleReaction, markNoteViewed } =
    useNotes(userProfile?.pairId);

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
      if (snap.exists()) {
        const data = snap.data();
        setPartnerName(data.displayName || "Partner");
        setPartnerPhotoURL(data.photoURL || null);
      }
    });
  }, [userProfile?.partnerId]);

  const myNotes = useMemo(() => notes.filter((note) => note.authorId === user?.uid), [notes, user?.uid]);
  const partnerNotes = useMemo(() => notes.filter((note) => note.authorId !== user?.uid), [notes, user?.uid]);
  const displayedNotes = activeTab === "theirs" ? partnerNotes : myNotes;

  // Most recent unread note from the partner, regardless of pin order — this
  // drives the floating "new note" popup.
  const latestUnreadPartnerNote = useMemo(() => {
    const unread = partnerNotes.filter((note) => !note.isRead);
    if (!unread.length) return null;
    return [...unread].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  }, [partnerNotes]);

  const showBrowserNotification = (title: string, body: string, tag: string) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification(title, { body, tag, icon: "/icons/icon-192.png" });
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

  return (
    <div className="app-shell">
      <div className="app-mobile-frame">
        <div className="app-scroll">
          <DashboardHeader partnerPresence={partnerPresence} partnerName={partnerName} />

          {/* Mini Games entry point (replaces the old love-note banner) */}
          <section className="app-section mb-6">
            <MiniGamesCard uid={user.uid} />
          </section>

          {/* Add New Note / Leave a Note */}
          <section className="app-section mb-7">
            <AddNoteForm onAdd={handleAddNote} partnerName={partnerName} />
          </section>

          {/* Communication Tabs: Message / Partner Notes / My Notes */}
          <section className="app-section mb-5">
            <div className="app-segmented grid w-full grid-cols-3 gap-1 text-center text-xs">
              <button onClick={() => router.push("/chat")} type="button">
                Message
              </button>
              <button onClick={() => selectNotesTab("theirs")} aria-pressed={activeTab === "theirs"} type="button">
                {partnerName} Notes
              </button>
              <button onClick={() => selectNotesTab("mine")} aria-pressed={activeTab === "mine"} type="button">
                {userProfile.displayName} Notes
              </button>
            </div>
          </section>

          {/* Notes Feed - List */}
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
                    authorPhotoURL={note.authorId === user.uid ? userProfile.photoURL ?? null : partnerPhotoURL}
                    onDelete={deleteNote}
                    onEdit={updateNote}
                    onTogglePin={togglePin}
                    onReact={(id, emoji) => toggleReaction(id, emoji as ReactionEmoji, user.uid)}
                    onView={markNoteViewed}
                  />
                ))}
              </AnimatePresence>
            )}
          </section>
        </div>

        <BottomNav activeTab="notes" />
      </div>

      <FloatingWidget
        latestUnreadPartnerNote={latestUnreadPartnerNote}
        partnerName={partnerName}
        onOpenNote={() => {
          if (!latestUnreadPartnerNote) return;
          selectNotesTab("theirs");
          markNoteViewed(latestUnreadPartnerNote.id);
        }}
      />
    </div>
  );
}
