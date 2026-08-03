"use client";

import { PresenceData } from "@/types";
import { formatLastSeen } from "@/lib/utils";

interface PresenceBadgeProps {
  presence: PresenceData | null;
  partnerName?: string;
}

export function PresenceBadge({ presence, partnerName }: PresenceBadgeProps) {
  const isOnline = presence?.online === true;
  const statusText = isOnline ? "Online" : presence ? `Last seen ${formatLastSeen(presence.lastSeen)}` : "Offline";

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-full border px-2.5 py-1.5" style={{ background: "rgba(255, 253, 248, 0.64)", borderColor: "var(--line)" }}>
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{
          background: isOnline ? "#4f9a64" : "var(--soft)",
          boxShadow: isOnline ? "0 0 0 4px rgba(79, 154, 100, 0.14)" : "none",
        }}
      />
      <div className="min-w-0 leading-tight">
        <p className="max-w-[92px] truncate text-xs font-bold sm:max-w-[150px]" style={{ color: "var(--ink)" }}>{partnerName || presence?.displayName || "Partner"}</p>
        <p className="hidden text-[11px] sm:block" style={{ color: "var(--muted)" }}>{statusText}</p>
      </div>
    </div>
  );
}
