"use client";

import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { PresenceBadge } from "@/components/presence/PresenceBadge";
import { PresenceData } from "@/types";

interface DashboardHeaderProps {
  partnerPresence: PresenceData | null;
  partnerName: string;
}

export function DashboardHeader({ partnerPresence, partnerName }: DashboardHeaderProps) {
  const { logout } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32 }}
      className="app-header"
    >
      <div className="app-container flex min-h-16 items-center justify-between gap-3 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-bold" style={{ background: "var(--ink)", color: "#fffdf8" }}>
            ON
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-bold" style={{ color: "var(--ink)" }}>Our Notes</p>
            <p className="truncate text-xs" style={{ color: "var(--muted)" }}>A private space for two</p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <PresenceBadge presence={partnerPresence} partnerName={partnerName} />
          <button onClick={logout} className="btn-ghost hidden sm:inline-flex">
            🚪 Sign out
          </button>
          <button onClick={logout} className="btn-icon sm:hidden" aria-label="Sign out" title="Sign out">
            🚪
          </button>
        </div>
      </div>
    </motion.header>
  );
}