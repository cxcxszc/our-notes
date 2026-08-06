"use client";

import { useEffect, useState } from "react";

// Tracks a per-user, per-game best score in localStorage only — no Firestore
// schema changes needed for this small addition.
export function useHighScore(uid: string | undefined, gameId: string, mode: "max" | "min" = "max") {
  const storageKey = uid ? `ck-space-highscore-${gameId}-${uid}` : null;
  const [best, setBest] = useState<number | null>(null);

  useEffect(() => {
    if (!storageKey) {
      setBest(null);
      return;
    }
    const stored = localStorage.getItem(storageKey);
    setBest(stored !== null ? Number(stored) : null);
  }, [storageKey]);

  const reportScore = (value: number) => {
    if (!storageKey) return;
    setBest((prev) => {
      const better = prev === null || (mode === "max" ? value > prev : value < prev);
      const next = better ? value : prev;
      if (better) localStorage.setItem(storageKey, String(next));
      return next;
    });
  };

  return [best, reportScore] as const;
}
