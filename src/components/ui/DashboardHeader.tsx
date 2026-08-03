"use client";

import { useEffect, useState } from "react";
import { PresenceData } from "@/types";
import { formatLastSeen } from "@/lib/utils";

interface DashboardHeaderProps {
  partnerPresence?: PresenceData | null;
  partnerName?: string;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Good Night";
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  if (hour < 21) return "Good Evening";
  return "Good Night";
}

export function DashboardHeader({ partnerPresence, partnerName = "Partner" }: DashboardHeaderProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="app-header">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="app-logo-mark">CK</div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-none" style={{ color: "var(--app-text)" }}>
              CK Space
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
          {getGreeting()} <span style={{ color: "var(--app-pink)" }}>♡</span>
        </h1>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              background: partnerPresence?.online ? "#34c759" : "var(--app-dimmed)",
              boxShadow: partnerPresence?.online ? "0 0 8px #34c759" : "none",
            }}
          />
          <span className="text-sm font-semibold" style={{ color: "var(--app-muted)" }}>
            {partnerPresence?.online
              ? `${partnerName} is online`
              : partnerPresence
              ? `${partnerName} • Last seen ${formatLastSeen(partnerPresence.lastSeen)}`
              : `${partnerName} • Last seen recently`}
          </span>
        </div>
      </div>
    </header>
  );
}
