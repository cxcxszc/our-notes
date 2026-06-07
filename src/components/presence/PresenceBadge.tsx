"use client";

import { PresenceData } from "@/types";
import { formatLastSeen } from "@/lib/utils";

interface PresenceBadgeProps {
  presence: PresenceData | null;
  partnerName?: string;
}

export function PresenceBadge({ presence, partnerName }: PresenceBadgeProps) {
  const isOnline = presence?.online === true;

  return (
    <div className="flex items-center gap-2">
      <div
        style={{
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: isOnline ? "#4ade80" : "#6B5F64",
          boxShadow: isOnline ? "0 0 6px rgba(74,222,128,0.6)" : "none",
          flexShrink: 0,
          transition: "background 0.3s, box-shadow 0.3s",
        }}
      />
      <div>
        <span style={{ fontSize: "13px", color: "#F5F0F2", fontWeight: 500 }}>
          {partnerName || presence?.displayName || "Partner"}
        </span>
        <span style={{ fontSize: "11px", color: "#6B5F64", marginLeft: "6px" }}>
          {isOnline ? "Online" : presence ? `Last seen ${formatLastSeen(presence.lastSeen)}` : "Offline"}
        </span>
      </div>
    </div>
  );
}
