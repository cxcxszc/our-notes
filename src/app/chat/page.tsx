"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Send, User, X } from "lucide-react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useMessages } from "@/hooks/useMessages";
import { useTyping } from "@/hooks/useTyping";
import { usePartnerPresence } from "@/hooks/usePresence";
import { formatReadTimestamp } from "@/lib/utils";
import { Message, REACTIONS, ReactionEmoji } from "@/types";

export default function ChatPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [partnerName, setPartnerName] = useState("Partner");
  const [partnerPhotoURL, setPartnerPhotoURL] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { messages, loading: messagesLoading, sendMessage, markAllSeen, toggleReaction } = useMessages(
    userProfile?.pairId
  );
  const { partnerTyping, setTyping } = useTyping(userProfile?.pairId, user?.uid);
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

  // Auto-scroll to latest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, partnerTyping]);

  // Mark incoming messages as seen once they're visible on this page.
  useEffect(() => {
    if (!user || !messages.length) return;
    markAllSeen(messages, user.uid);
  }, [messages, user, markAllSeen]);

  const lastMineWithSeenId = useMemo(() => {
    if (!user) return null;
    const mine = messages.filter((m) => m.senderId === user.uid);
    if (!mine.length) return null;
    const last = mine[mine.length - 1];
    return last.seenBy.includes(userProfile?.partnerId || "__none__") ? last.id : null;
  }, [messages, user, userProfile?.partnerId]);

  if (authLoading || !userProfile || !user) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full" style={{ background: "var(--app-pink)" }} />
      </div>
    );
  }

  const handleTextChange = (value: string) => {
    setText(value);
    setTyping(value.trim().length > 0);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(false), 3000);
  };

  const handleSend = async () => {
    const content = text.trim();
    if (!content || !userProfile.pairId) return;
    setText("");
    setTyping(false);
    const replying = replyTo;
    setReplyTo(null);
    await sendMessage(userProfile.pairId, user.uid, userProfile.displayName, content, replying);
  };

  return (
    <div className="app-shell">
      <div className="app-mobile-frame">
        {/* Chat header */}
        <div
          className="flex items-center gap-3 px-4 pb-3 pt-10"
          style={{ borderBottom: "1px solid var(--app-border)" }}
        >
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="app-icon-button h-9 w-9"
            aria-label="Back to Notes"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full text-sm font-bold text-white"
            style={{ background: "linear-gradient(135deg, #F8C8DC 0%, #F4A6C1 100%)" }}
          >
            {partnerPhotoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={partnerPhotoURL} alt={partnerName} className="h-full w-full object-cover" />
            ) : (
              partnerName.charAt(0).toUpperCase() || <User className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold" style={{ color: "var(--app-text)" }}>
              {partnerName}
            </p>
            <p className="text-xs" style={{ color: "var(--app-muted)" }}>
              {partnerTyping ? "typing..." : partnerPresence?.online ? "Online" : "Offline"}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="app-scroll px-4 pb-4 pt-4" style={{ paddingBottom: "160px" }}>
          {messagesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="app-card h-12 w-2/3 animate-pulse" />
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="app-empty">Say hi to {partnerName} 👋</div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence initial={false}>
                {messages.map((message) => {
                  const isMine = message.senderId === user.uid;
                  const isActive = activeMessageId === message.id;
                  const hasReactions = Object.values(message.reactions || {}).some((u) => u.length > 0);

                  return (
                    <motion.div
                      key={message.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[78%] ${isMine ? "items-end" : "items-start"} flex flex-col`}>
                        {message.replyToId && (
                          <div
                            className="mb-1 max-w-full truncate rounded-xl px-3 py-1.5 text-xs"
                            style={{
                              background: "var(--app-overlay)",
                              border: "1px solid var(--app-border)",
                              color: "var(--app-muted)",
                            }}
                          >
                            <span className="font-bold">{message.replyToSenderName}</span>: {message.replyToPreview}
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setActiveMessageId(isActive ? null : message.id)}
                          className="rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed"
                          style={{
                            background: isMine ? "var(--app-pink)" : "var(--app-card)",
                            color: isMine ? "#ffffff" : "var(--app-text)",
                            border: isMine ? "none" : "1px solid var(--app-border)",
                          }}
                        >
                          {message.content}
                        </button>

                        {hasReactions && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {REACTIONS.filter((emoji) => (message.reactions?.[emoji]?.length || 0) > 0).map(
                              (emoji) => (
                                <span
                                  key={emoji}
                                  className="rounded-full px-2 py-0.5 text-xs"
                                  style={{ background: "var(--app-overlay)", border: "1px solid var(--app-border)" }}
                                >
                                  {emoji} {message.reactions[emoji].length}
                                </span>
                              )
                            )}
                          </div>
                        )}

                        <AnimatePresence>
                          {isActive && (
                            <motion.div
                              initial={{ opacity: 0, y: -4, height: 0 }}
                              animate={{ opacity: 1, y: 0, height: "auto" }}
                              exit={{ opacity: 0, y: -4, height: 0 }}
                              className="mt-1.5 flex items-center gap-1 overflow-hidden"
                            >
                              {REACTIONS.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => toggleReaction(message.id, emoji as ReactionEmoji, user.uid)}
                                  className="app-icon-button h-7 w-7 text-sm"
                                  aria-label={`React with ${emoji}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setReplyTo(message);
                                  setActiveMessageId(null);
                                }}
                                className="app-chip"
                              >
                                Reply
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        <p className="mt-0.5 text-[10px]" style={{ color: "var(--app-dimmed)" }}>
                          {formatReadTimestamp(message.createdAt)}
                        </p>
                        {isMine && message.id === lastMineWithSeenId && (
                          <p className="text-[10px] font-semibold" style={{ color: "var(--app-pink)" }}>
                            Seen
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {partnerTyping && (
                <div className="flex justify-start">
                  <div
                    className="flex items-center gap-1 rounded-2xl px-4 py-3"
                    style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
                  >
                    <span className="ck-typing-dot" />
                    <span className="ck-typing-dot" style={{ animationDelay: "0.15s" }} />
                    <span className="ck-typing-dot" style={{ animationDelay: "0.3s" }} />
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer */}
        <div
          className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 px-4 pb-[calc(env(safe-area-inset-bottom)+72px)] pt-2"
          style={{ background: "var(--app-bg)" }}
        >
          {replyTo && (
            <div
              className="mb-2 flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-xs"
              style={{ background: "var(--app-overlay)", border: "1px solid var(--app-border)" }}
            >
              <span className="min-w-0 truncate" style={{ color: "var(--app-muted)" }}>
                Replying to <span className="font-bold">{replyTo.senderName}</span>: {replyTo.content}
              </span>
              <button type="button" onClick={() => setReplyTo(null)} aria-label="Cancel reply">
                <X className="h-3.5 w-3.5" style={{ color: "var(--app-dimmed)" }} />
              </button>
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              handleSend();
            }}
            className="app-card flex items-center gap-2 p-2"
          >
            <input
              value={text}
              onChange={(event) => handleTextChange(event.target.value)}
              placeholder={`Message ${partnerName}...`}
              className="flex-1 bg-transparent px-2 text-sm outline-none"
              style={{ color: "var(--app-text)" }}
              maxLength={2000}
            />
            <button
              type="submit"
              className="app-primary-button h-9 w-9 justify-center p-0"
              disabled={!text.trim()}
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
