"use client";

import Link from "next/link";
import { Home, CalendarDays, Camera, User } from "lucide-react";

interface BottomNavProps {
  // "voice" kept for the legacy /voice page, which no longer has a nav item
  // (Voice was replaced by Calendar) but still works if visited directly.
  activeTab: "notes" | "calendar" | "memories" | "profile" | "voice";
}

export function BottomNav({ activeTab }: BottomNavProps) {
  const items = [
    { id: "notes", label: "Notes", href: "/dashboard", icon: <Home className="h-5 w-5" /> },
    { id: "calendar", label: "Calendar", href: "/calendar", icon: <CalendarDays className="h-5 w-5" /> },
    { id: "memories", label: "Photos", href: "/memories", icon: <Camera className="h-5 w-5" /> },
    { id: "profile", label: "Profile", href: "/profile", icon: <User className="h-5 w-5" /> },
  ] as const;

  return (
    <nav className="app-bottom-nav" aria-label="Main navigation">
      <div className="app-bottom-nav-inner">
        {items.map((item) => {
          const active = activeTab === item.id;
          return (
            <Link
              key={item.id}
              className="app-nav-item"
              data-active={active ? "true" : "false"}
              href={item.href}
            >
              <span className="flex items-center justify-center transition-transform active:scale-95" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
