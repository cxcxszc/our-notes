"use client";

import { useEffect, useState } from "react";
import { ref, onValue, set, onDisconnect, serverTimestamp } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { PresenceData } from "@/types";

export function usePresence(userId: string | undefined, displayName: string | undefined) {
  useEffect(() => {
    if (!userId || !displayName) return;

    const presenceRef = ref(rtdb, `presence/${userId}`);
    const connectedRef = ref(rtdb, ".info/connected");

    const unsubscribe = onValue(connectedRef, (snap) => {
      if (snap.val() === true) {
        set(presenceRef, {
          online: true,
          lastSeen: serverTimestamp(),
          displayName,
        });
        onDisconnect(presenceRef).set({
          online: false,
          lastSeen: serverTimestamp(),
          displayName,
        });
      }
    });

    return () => unsubscribe();
  }, [userId, displayName]);
}

export function usePartnerPresence(partnerId: string | undefined) {
  const [presence, setPresence] = useState<PresenceData | null>(null);

  useEffect(() => {
    if (!partnerId) return;

    const presenceRef = ref(rtdb, `presence/${partnerId}`);
    const unsubscribe = onValue(presenceRef, (snap) => {
      if (snap.exists()) {
        setPresence(snap.val() as PresenceData);
      }
    });

    return () => unsubscribe();
  }, [partnerId]);

  return presence;
}
