"use client";

import { useCallback, useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface VoiceNote {
  id: string;
  pairId: string;
  authorId: string;
  authorName: string;
  audioUrl: string; // base64 string
  duration: string; // "0:12"
  durationSecs: number;
  waveform: number[];
  isFavorite: boolean;
  reactions: number;
  createdAt: Date;
}

export function useVoiceNotes(pairId: string | undefined) {
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "voice_notes"),
      where("pairId", "==", pairId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextNotes: VoiceNote[] = [];
        snapshot.forEach((noteDoc) => {
          const data = noteDoc.data();
          nextNotes.push({
            id: noteDoc.id,
            pairId: data.pairId,
            authorId: data.authorId,
            authorName: data.authorName,
            audioUrl: data.audioUrl,
            duration: data.duration,
            durationSecs: data.durationSecs,
            waveform: data.waveform || [],
            isFavorite: !!data.isFavorite,
            reactions: data.reactions || 0,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        });
        setNotes(nextNotes);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Voice notes listener error:", err);
        setError("Failed to load voice notes.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pairId]);

  const addVoiceNote = useCallback(
    async (
      audioBlob: Blob,
      duration: string,
      durationSecs: number,
      waveform: number[],
      authorId: string,
      authorName: string,
      pairId: string
    ) => {
      setIsUploading(true);
      setError(null);
      try {
        const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dhfpxpusj";
        const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "voice-notes";

        const formData = new FormData();
        const extension = audioBlob.type.split("/")[1]?.split(";")[0] || "webm";
        const file = new File([audioBlob], `voice_note.${extension}`, { type: audioBlob.type });

        formData.append("file", file);
        formData.append("upload_preset", uploadPreset);
        formData.append("resource_type", "video");

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const errText = await res.text().catch(() => "");
          console.error("Cloudinary upload failure:", errText);
          throw new Error("Failed to upload audio to Cloudinary");
        }

        const data = await res.json();
        const audioUrl = data.secure_url;

        if (!audioUrl) {
          throw new Error("Upload succeeded but secure_url was not returned");
        }

        await addDoc(collection(db, "voice_notes"), {
          pairId,
          authorId,
          authorName,
          audioUrl,
          duration,
          durationSecs,
          waveform,
          isFavorite: false,
          reactions: 0,
          createdAt: serverTimestamp(),
        });
      } catch (err: any) {
        console.error("Error adding voice note:", err);
        setError(err.message || "Failed to upload and save voice note.");
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const deleteVoiceNote = useCallback(async (id: string) => {
    try {
      await deleteDoc(doc(db, "voice_notes", id));
    } catch (err) {
      console.error("Error deleting voice note:", err);
      throw err;
    }
  }, []);

  const toggleFavorite = useCallback(async (id: string, isFavorite: boolean) => {
    try {
      await updateDoc(doc(db, "voice_notes", id), {
        isFavorite: !isFavorite,
      });
    } catch (err) {
      console.error("Error toggling favorite on voice note:", err);
      throw err;
    }
  }, []);

  const incrementReactions = useCallback(async (id: string, currentReactions: number) => {
    try {
      await updateDoc(doc(db, "voice_notes", id), {
        reactions: currentReactions + 1,
      });
    } catch (err) {
      console.error("Error reacting to voice note:", err);
      throw err;
    }
  }, []);

  return {
    notes,
    loading,
    error,
    isUploading,
    addVoiceNote,
    deleteVoiceNote,
    toggleFavorite,
    incrementReactions,
  };
}
