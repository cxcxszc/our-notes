"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Message, ReactionEmoji } from "@/types";

export function useMessages(pairId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "messages"), where("pairId", "==", pairId), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const next: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        next.push({
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          seenBy: data.seenBy || [],
          reactions: data.reactions || {},
        } as Message);
      });
      setMessages(next);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pairId]);

  const sendMessage = useCallback(
    async (
      pairId: string,
      senderId: string,
      senderName: string,
      content: string,
      replyTo?: Message | null
    ) => {
      await addDoc(collection(db, "messages"), {
        pairId,
        senderId,
        senderName,
        content,
        seenBy: [senderId],
        reactions: {},
        replyToId: replyTo?.id ?? null,
        replyToPreview: replyTo?.content?.slice(0, 120) ?? null,
        replyToSenderName: replyTo?.senderName ?? null,
        createdAt: serverTimestamp(),
      });
    },
    []
  );

  // Marks every message not sent by `userId` as seen by them (batched).
  const markAllSeen = useCallback(async (unseenMessages: Message[], userId: string) => {
    const toUpdate = unseenMessages.filter((m) => m.senderId !== userId && !m.seenBy.includes(userId));
    if (!toUpdate.length) return;
    const batch = writeBatch(db);
    toUpdate.forEach((m) => {
      batch.update(doc(db, "messages", m.id), { seenBy: arrayUnion(userId) });
    });
    await batch.commit();
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: ReactionEmoji, userId: string) => {
      const message = messages.find((m) => m.id === messageId);
      if (!message) return;
      const existing = message.reactions?.[emoji] || [];
      const ref = doc(db, "messages", messageId);
      if (existing.includes(userId)) {
        await updateDoc(ref, { [`reactions.${emoji}`]: arrayRemove(userId) });
      } else {
        await updateDoc(ref, { [`reactions.${emoji}`]: arrayUnion(userId) });
      }
    },
    [messages]
  );

  return { messages, loading, sendMessage, markAllSeen, toggleReaction };
}
