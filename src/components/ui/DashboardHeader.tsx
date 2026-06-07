"use client";

import { useAuth } from "@/lib/auth-context";
import { PresenceBadge } from "@/components/presence/PresenceBadge";
import { PresenceData } from "@/types";
import { motion } from "framer-motion";

interface DashboardHeaderProps {
  partnerPresence: PresenceData | null;
  partnerName: string;
}

export function DashboardHeader({ partnerPresence, partnerName }: DashboardHeaderProps) {
  const { logout, userProfile } = useAuth();

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-strong sticky top-0 z-40"
      style={{ padding: "12px 20px", borderRadius: 0, borderLeft: "none", borderRight: "none", borderTop: "none" }}
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "20px" }}>💌</span>
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", color: "#F8C8DC", letterSpacing: "-0.01em" }}>
            Our Notes
          </span>
        </div>

        <div className="flex items-center gap-4">
          <PresenceBadge presence={partnerPresence} partnerName={partnerName} />
          <button
            onClick={logout}
            style={{ fontSize: "12px", color: "#6B5F64", background: "none", border: "none", cursor: "pointer", padding: "6px 10px", borderRadius: "8px" }}
            className="hover:text-pink-rose transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </motion.header>
  );
}
