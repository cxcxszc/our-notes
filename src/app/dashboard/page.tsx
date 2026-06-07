"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useNotes } from "@/hooks/useNotes";
import { usePresence, usePartnerPresence } from "@/hooks/usePresence";
import { NoteCard } from "@/components/notes/NoteCard";
import { AddNoteForm } from "@/components/notes/AddNoteForm";
import { QuickActions } from "@/components/notes/QuickActions";
import { DashboardHeader } from "@/components/ui/DashboardHeader";
import { FloatingWidget } from "@/components/widget/FloatingWidget";
import { ReactionEmoji } from "@/types";

export default function DashboardPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [partnerName, setPartnerName] = useState("Partner");
  const [activeTab, setActiveTab] = useState<"mine" | "theirs">("mine");

  const { notes, loading: notesLoading, addNote, updateNote, deleteNote, togglePin, toggleReaction } = useNotes(userProfile?.pairId);

  usePresence(user?.uid, userProfile?.displayName);
  const partnerPresence = usePartnerPresence(userProfile?.partnerId);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.replace("/auth/login"); return; }
    if (user && !authLoading && userProfile && !userProfile.pairId) { router.replace("/pair"); }
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    if (!userProfile?.partnerId) return;
    getDoc(doc(db, "users", userProfile.partnerId)).then((snap) => {
      if (snap.exists()) setPartnerName(snap.data().displayName || "Partner");
    });
  }, [userProfile?.partnerId]);

  if (authLoading || !userProfile) {
    return (
      <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0F0F0F" }}>
        <div className="w-10 h-10 rounded-full animate-pulse" style={{ background: "linear-gradient(135deg, #F8C8DC, #E8849E)" }} />
      </div>
    );
  }

  const myNotes = notes.filter((n) => n.authorId === user!.uid);
  const partnerNotes = notes.filter((n) => n.authorId !== user!.uid);
  const latestPartnerNote = partnerNotes[0] || null;

  const handleAddNote = async (content: string) => {
    await addNote(content, user!.uid, userProfile.displayName, userProfile.pairId!);
  };

  const handleQuickSend = async (message: string) => {
    await addNote(message, user!.uid, userProfile.displayName, userProfile.pairId!);
  };

  return (
    <div className="min-h-dvh relative" style={{ background: "#0F0F0F" }}>
      <div className="ambient-bg" />

      <DashboardHeader partnerPresence={partnerPresence} partnerName={partnerName} />

      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6">
        {/* Quick Actions */}
        <QuickActions onSend={handleQuickSend} />

        {/* Mobile Tab Toggle */}
        <div className="flex md:hidden gap-2 mb-6">
          {(["mine", "theirs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px",
                borderRadius: "12px",
                border: activeTab === tab ? "1px solid rgba(248,200,220,0.2)" : "1px solid #2E2E2E",
                background: activeTab === tab ? "rgba(248,200,220,0.06)" : "#1A1A1A",
                color: activeTab === tab ? "#F8C8DC" : "#6B5F64",
                fontSize: "13px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "DM Sans, sans-serif",
                transition: "all 0.2s",
              }}
            >
              {tab === "mine" ? `My Notes (${myNotes.length})` : `${partnerName}'s Notes (${partnerNotes.length})`}
            </button>
          ))}
        </div>

        {/* Desktop: Two columns. Mobile: Tab-based */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* My Notes Column */}
          <div className={activeTab === "theirs" ? "hidden md:block" : "block"}>
            <div className="flex items-center gap-2 mb-4">
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#F5F0F2", fontWeight: 500 }}>My Notes</h2>
              <span style={{ fontSize: "12px", color: "#6B5F64", background: "#1A1A1A", border: "1px solid #2E2E2E", padding: "2px 8px", borderRadius: "20px" }}>{myNotes.length}</span>
            </div>
            <AddNoteForm onAdd={handleAddNote} />
            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="card" style={{ height: "100px", background: "#1A1A1A", animation: "pulse 2s infinite" }} />)}
              </div>
            ) : myNotes.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ border: "1px dashed #2E2E2E" }}>
                <div className="text-3xl mb-2">✍️</div>
                <p style={{ color: "#6B5F64", fontSize: "13px" }}>Write your first note for {partnerName}…</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {myNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      currentUserId={user!.uid}
                      isMine={true}
                      onDelete={deleteNote}
                      onEdit={updateNote}
                      onTogglePin={togglePin}
                      onReact={(id, emoji) => toggleReaction(id, emoji as ReactionEmoji, user!.uid)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>

          {/* Partner Notes Column */}
          <div className={activeTab === "mine" ? "hidden md:block" : "block"}>
            <div className="flex items-center gap-2 mb-4">
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "20px", color: "#F5F0F2", fontWeight: 500 }}>{partnerName}'s Notes</h2>
              <span style={{ fontSize: "12px", color: "#6B5F64", background: "#1A1A1A", border: "1px solid #2E2E2E", padding: "2px 8px", borderRadius: "20px" }}>{partnerNotes.length}</span>
            </div>
            {notesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <div key={i} className="card" style={{ height: "100px", animation: "pulse 2s infinite" }} />)}
              </div>
            ) : partnerNotes.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ border: "1px dashed #2E2E2E" }}>
                <div className="text-3xl mb-2">💭</div>
                <p style={{ color: "#6B5F64", fontSize: "13px" }}>Waiting for {partnerName} to write…</p>
              </div>
            ) : (
              <AnimatePresence>
                <div className="space-y-3">
                  {partnerNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      currentUserId={user!.uid}
                      isMine={false}
                      onDelete={deleteNote}
                      onEdit={updateNote}
                      onTogglePin={togglePin}
                      onReact={(id, emoji) => toggleReaction(id, emoji as ReactionEmoji, user!.uid)}
                    />
                  ))}
                </div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Floating Widget */}
      <FloatingWidget
        latestPartnerNote={latestPartnerNote}
        partnerName={partnerName}
        currentUserId={user!.uid}
      />
    </div>
  );
}
