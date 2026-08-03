"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { ChevronLeft, ChevronRight, Heart } from "lucide-react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { useNotes } from "@/hooks/useNotes";
import { BottomNav } from "@/components/ui/BottomNav";

export default function CalendarPage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [connectionDate, setConnectionDate] = useState<Date | null>(null);
  const [monthCursor, setMonthCursor] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { notes } = useNotes(userProfile?.pairId);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/login");
      return;
    }
    if (userProfile && !userProfile.pairId) router.replace("/pair");
  }, [user, userProfile, authLoading, router]);

  useEffect(() => {
    if (!userProfile?.pairId) return;
    getDoc(doc(db, "pairs", userProfile.pairId)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.createdAt) setConnectionDate(data.createdAt.toDate());
      }
    });
  }, [userProfile?.pairId]);

  const gridDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(monthCursor));
    const end = endOfWeek(endOfMonth(monthCursor));
    return eachDayOfInterval({ start, end });
  }, [monthCursor]);

  const notesByDay = useMemo(() => {
    if (!selectedDate) return [];
    return notes
      .filter((note) => isSameDay(note.createdAt, selectedDate))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [notes, selectedDate]);

  const hasNoteOnDay = (day: Date) => notes.some((note) => isSameDay(note.createdAt, day));

  if (authLoading || !userProfile || !user) {
    return (
      <div className="app-shell flex min-h-dvh items-center justify-center">
        <div className="h-12 w-12 animate-pulse rounded-full" style={{ background: "var(--app-pink)" }} />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-mobile-frame">
        <div className="app-scroll">
          <div className="app-section pb-2 pt-10">
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
              Calendar
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--app-muted)" }}>
              Tap a date to see what happened that day.
            </p>
          </div>

          {/* Month navigator */}
          <section className="app-section mt-4">
            <div className="app-card flex items-center justify-between p-3">
              <button
                type="button"
                className="app-icon-button"
                aria-label="Previous month"
                onClick={() => setMonthCursor((m) => subMonths(m, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-bold" style={{ color: "var(--app-text)" }}>
                {format(monthCursor, "MMMM yyyy")}
              </span>
              <button
                type="button"
                className="app-icon-button"
                aria-label="Next month"
                onClick={() => setMonthCursor((m) => addMonths(m, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </section>

          {/* Weekday labels + grid */}
          <section className="app-section mt-4">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold" style={{ color: "var(--app-dimmed)" }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={`${d}-${i}`}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {gridDays.map((day) => {
                const inMonth = isSameMonth(day, monthCursor);
                const isConnectionDay = connectionDate ? isSameDay(day, connectionDate) : false;
                const selected = selectedDate ? isSameDay(day, selectedDate) : false;
                const todayFlag = isToday(day);
                const dayHasNote = hasNoteOnDay(day);

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(day)}
                    className="relative flex aspect-square flex-col items-center justify-center rounded-xl text-xs font-semibold transition-transform active:scale-95"
                    style={{
                      background: isConnectionDay
                        ? "linear-gradient(135deg, var(--app-pink-soft), var(--app-pink))"
                        : selected
                        ? "var(--app-pink-surface)"
                        : "transparent",
                      color: isConnectionDay ? "#ffffff" : inMonth ? "var(--app-text)" : "var(--app-dimmed)",
                      border: todayFlag ? "1.5px solid var(--app-pink)" : "1.5px solid transparent",
                      opacity: inMonth ? 1 : 0.45,
                    }}
                    title={isConnectionDay ? "The day you two connected 💗" : undefined}
                  >
                    {format(day, "d")}
                    {dayHasNote && !isConnectionDay && (
                      <span
                        className="absolute bottom-1 h-1 w-1 rounded-full"
                        style={{ background: "var(--app-pink)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
            {connectionDate && (
              <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--app-muted)" }}>
                <Heart className="h-3.5 w-3.5" style={{ color: "var(--app-pink)", fill: "var(--app-pink)" }} />
                Pink date = the day you two connected ({format(connectionDate, "MMM d, yyyy")})
              </p>
            )}
          </section>

          {/* Day preview */}
          {selectedDate && (
            <section className="app-section mt-5">
              <div className="app-card p-4">
                <p className="text-sm font-bold" style={{ color: "var(--app-pink)" }}>
                  {format(selectedDate, "EEEE, MMM d, yyyy")}
                </p>
                {connectionDate && isSameDay(selectedDate, connectionDate) && (
                  <p className="mt-1 text-xs font-semibold" style={{ color: "var(--app-muted)" }}>
                    💗 The day your connection began
                  </p>
                )}
                <div className="mt-3 space-y-2">
                  {notesByDay.length === 0 ? (
                    <p className="text-sm" style={{ color: "var(--app-dimmed)" }}>
                      No notes or memories from this day yet.
                    </p>
                  ) : (
                    notesByDay.map((note) => (
                      <div
                        key={note.id}
                        className="rounded-xl border p-3 text-sm"
                        style={{ borderColor: "var(--app-border)", background: "var(--app-overlay)" }}
                      >
                        <p className="text-xs font-bold" style={{ color: "var(--app-pink)" }}>
                          {note.authorName}
                        </p>
                        <p className="mt-0.5 line-clamp-2" style={{ color: "var(--app-text)" }}>
                          {note.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          )}

          <p className="app-section mt-2 text-xs" style={{ color: "var(--app-dimmed)" }}>
            Tap to see what inside the date
          </p>
        </div>

        <BottomNav activeTab="calendar" />
      </div>
    </div>
  );
}
