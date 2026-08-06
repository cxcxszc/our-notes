"use client";

import { useEffect, useRef, useState } from "react";
import { onDisconnect, onValue, ref, remove, set } from "firebase/database";
import { rtdb } from "@/lib/firebase";

// Reports the current user's typing state for this pair, and subscribes to
// the partner's typing state. Stored at /typing/{pairId}/{uid} in the
// Realtime Database, next to the existing /presence node.
export function useTyping(pairId: string | undefined, userId: string | undefined) {
  const [partnerTyping, setPartnerTyping] = useState(false);
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pairId || !userId) return;
    const myRef = ref(rtdb, `typing/${pairId}/${userId}`);
    onDisconnect(myRef).remove();
    return () => {
      remove(myRef).catch(() => {});
    };
  }, [pairId, userId]);

  useEffect(() => {
    if (!pairId || !userId) return;
    const typingRef = ref(rtdb, `typing/${pairId}`);
    const unsubscribe = onValue(typingRef, (snap) => {
      const data = snap.val() || {};
      const someoneElseTyping = Object.entries(data).some(
        ([uid, isTyping]) => uid !== userId && !!isTyping
      );
      setPartnerTyping(someoneElseTyping);
    });
    return () => unsubscribe();
  }, [pairId, userId]);

  const setTyping = (isTyping: boolean) => {
    if (!pairId || !userId) return;
    const myRef = ref(rtdb, `typing/${pairId}/${userId}`);
    set(myRef, isTyping);

    if (stopTimer.current) clearTimeout(stopTimer.current);
    if (isTyping) {
      stopTimer.current = setTimeout(() => set(myRef, false), 4000);
    }
  };

  return { partnerTyping, setTyping };
}
