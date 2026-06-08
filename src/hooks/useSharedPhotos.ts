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
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SharedPhoto } from "@/types";

const getFriendlyPhotoError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("Missing ImgBB API key")) {
    return "Missing ImgBB API key. Check your env variables.";
  }

  if (message.toLowerCase().includes("imgbb")) {
    return "Photo upload failed on ImgBB. Check your API key and try again.";
  }

  if (message.includes("permission-denied")) {
    return "Photo access is blocked by Firestore rules.";
  }

  return "Photo sharing is temporarily unavailable. Please try again.";
};

async function uploadToImgBB(file: File) {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ImgBB API key");
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("name", file.name);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data?.success) {
    throw new Error(data?.error?.message || "ImgBB upload failed");
  }

  return {
    imageUrl: data.data.display_url || data.data.url,
    deleteUrl: data.data.delete_url || null,
  };
}

export function useSharedPhotos(pairId: string | undefined) {
  const [photos, setPhotos] = useState<SharedPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pairId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "photos"),
      where("pairId", "==", pairId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextPhotos: SharedPhoto[] = [];
        snapshot.forEach((photoDoc) => {
          const data = photoDoc.data();
          nextPhotos.push({
            ...data,
            id: photoDoc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
          } as SharedPhoto);
        });
        setPhotos(nextPhotos);
        setError(null);
        setLoading(false);
      },
      (snapshotError) => {
        console.error("Photo listener error:", snapshotError);
        setPhotos([]);
        setError(getFriendlyPhotoError(snapshotError));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [pairId]);

  const addPhoto = useCallback(
    async (file: File, authorId: string, authorName: string, pairId: string, caption?: string) => {
      setError(null);

      try {
        const uploaded = await uploadToImgBB(file);

        await addDoc(collection(db, "photos"), {
          pairId,
          authorId,
          authorName,
          imageUrl: uploaded.imageUrl,
          deleteUrl: uploaded.deleteUrl,
          caption: caption?.trim() || "",
          createdAt: serverTimestamp(),
        });
      } catch (uploadError) {
        console.error("Photo upload error:", uploadError);
        const friendlyError = getFriendlyPhotoError(uploadError);
        setError(friendlyError);
        throw new Error(friendlyError);
      }
    },
    []
  );

  const deletePhoto = useCallback(async (photo: SharedPhoto, currentUserId: string) => {
    if (photo.authorId !== currentUserId) return;
    await deleteDoc(doc(db, "photos", photo.id));
  }, []);

  return { photos, loading, error, addPhoto, deletePhoto };
}