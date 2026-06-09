"use client";

import { useAuth } from "@/lib/auth-context";

interface DashboardHeaderProps {
  partnerPresence?: { online?: boolean } | null;
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
  const { logout } = useAuth();

  return (
    <header className="app-header">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2">
          <div className="app-logo-mark">ON</div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-none" style={{ color: "var(--app-text)" }}>
              Our Notes
            </p>
            <p className="mt-1 truncate text-[11px] leading-none" style={{ color: "var(--app-pink)" }}>
              for two
            </p>
          </div>
        </div>

        <button className="app-icon-button" onClick={logout} type="button" aria-label="Sign out" title="Sign out">
          <span aria-hidden="true">x</span>
        </button>
      </div>

      <div className="mt-5">
        <h1 className="text-2xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
          {getGreeting()} <span style={{ color: "var(--app-pink)" }}>♡</span>
        </h1>
        <div className="mt-1.5 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: partnerPresence?.online ? "#34c759" : "var(--app-dimmed)" }}
          />
          <span className="text-sm" style={{ color: "var(--app-muted)" }}>
            {partnerName} is {partnerPresence?.online ? "online" : "offline"}
          </span>
        </div>
      </div>
    </header>
  );
}
