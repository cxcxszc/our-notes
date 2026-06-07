"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Note, ReactionEmoji } from "@/types";

export function useNotes(pairId: string | undefined) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "notes"),
      where("pairId", "==", pairId),
      orderBy("pinned", "desc"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newNotes: Note[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        newNotes.push({
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Note);
      });
      setNotes(newNotes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pairId]);

  const addNote = useCallback(
    async (content: string, authorId: string, authorName: string, pairId: string) => {
      await addDoc(collection(db, "notes"), {
        content,
        authorId,
        authorName,
        pairId,
        pinned: false,
        reactions: {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    },
    []
  );

  const updateNote = useCallback(async (noteId: string, content: string) => {
    await updateDoc(doc(db, "notes", noteId), {
      content,
      updatedAt: serverTimestamp(),
    });
  }, []);

  const deleteNote = useCallback(async (noteId: string) => {
    await deleteDoc(doc(db, "notes", noteId));
  }, []);

  const togglePin = useCallback(async (noteId: string, pinned: boolean) => {
    await updateDoc(doc(db, "notes", noteId), { pinned: !pinned });
  }, []);

  const toggleReaction = useCallback(
    async (noteId: string, emoji: ReactionEmoji, userId: string) => {
      const noteRef = doc(db, "notes", noteId);
      const note = notes.find((n) => n.id === noteId);
      if (!note) return;

      const existing = note.reactions[emoji] || [];
      if (existing.includes(userId)) {
        await updateDoc(noteRef, {
          [`reactions.${emoji}`]: arrayRemove(userId),
        });
      } else {
        await updateDoc(noteRef, {
          [`reactions.${emoji}`]: arrayUnion(userId),
        });
      }
    },
    [notes]
  );

  return { notes, loading, addNote, updateNote, deleteNote, togglePin, toggleReaction };
}
