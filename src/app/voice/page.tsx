"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, Trash2, Heart, Mic, Square, X, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useVoiceNotes, VoiceNote } from "@/hooks/useVoiceNotes";
import { BottomNav } from "@/components/ui/BottomNav";
import { formatNoteTime } from "@/lib/utils";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Helper to generate mock waveform bars for display
const generateWaveform = (seed: number, bars = 36) => {
  return Array.from({ length: bars }, (_, i) => {
    const v = Math.sin(i * 0.4 + seed) * 0.4 + Math.sin(i * 0.9 + seed * 2) * 0.3 + 0.35;
    return Math.max(0.1, Math.min(1, v));
  });
};

function Waveform({
  bars,
  progress,
  isPlaying,
}: {
  bars: number[];
  progress: number;
  isPlaying: boolean;
}) {
  return (
    <div className="flex items-center gap-[2px] h-10 flex-1">
      {bars.map((h, i) => {
        const ratio = i / bars.length;
        const played = ratio <= progress;
        return (
          <div
            key={i}
            className="rounded-full flex-shrink-0 transition-all duration-75"
            style={{
              width: 3,
              height: `${h * 100}%`,
              background: played ? "var(--app-pink)" : "var(--app-border)",
              opacity: isPlaying && played ? 1 : played ? 0.85 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

function RecordingWaveform({ isRecording }: { isRecording: boolean }) {
  const [bars, setBars] = useState<number[]>(Array(24).fill(0.1));

  useEffect(() => {
    if (!isRecording) {
      setBars(Array(24).fill(0.1));
      return;
    }
    const interval = setInterval(() => {
      setBars((prev) => {
        const next = [...prev.slice(1)];
        next.push(Math.random() * 0.8 + 0.15);
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [isRecording]);

  return (
    <div className="flex items-center gap-[3px] h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-75"
          style={{
            width: 3,
            height: `${h * 100}%`,
            background: isRecording ? "var(--app-pink)" : "var(--app-border)",
          }}
        />
      ))}
    </div>
  );
}

export default function VoicePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  const [partnerName, setPartnerName] = useState("Partner");

  const {
    notes,
    loading: notesLoading,
    error,
    isUploading,
    addVoiceNote,
    deleteVoiceNote,
    toggleFavorite,
    incrementReactions,
  } = useVoiceNotes(userProfile?.pairId);

  // Audio Playback State
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progresses, setProgresses] = useState<Record<string, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Audio Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordSecs, setRecordSecs] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);
  const recordStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!userProfile?.partnerId) return;
    getDoc(doc(db, "users", userProfile.partnerId)).then((snap) => {
      if (snap.exists()) setPartnerName(snap.data().displayName || "Partner");
    });
  }, [userProfile?.partnerId]);

  // Audio Playback Logic
  const handlePlayPause = (note: VoiceNote) => {
    if (playingId === note.id) {
      pauseAudio();
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(note.audioUrl);
    audioRef.current = audio;
    setPlayingId(note.id);

    // Resume from current progress
    const currentProgress = progresses[note.id] || 0;
    
    // Listeners
    const onLoadedMetadata = () => {
      audio.currentTime = currentProgress * audio.duration;
    };
    audio.addEventListener("loadedmetadata", onLoadedMetadata);

    if (currentProgress > 0) {
      audio.currentTime = currentProgress * (note.durationSecs || 1);
    }

    audio.ontimeupdate = () => {
      const duration = audio.duration || note.durationSecs || 1;
      const prog = audio.currentTime / duration;
      setProgresses((prev) => ({ ...prev, [note.id]: Math.min(prog, 1) }));
    };

    audio.onended = () => {
      setProgresses((prev) => ({ ...prev, [note.id]: 0 }));
      setPlayingId(null);
    };

    audio.onerror = () => {
      setPlayingId(null);
    };

    audio.play().catch((err) => {
      console.error("Playback error:", err);
      setPlayingId(null);
    });
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingId(null);
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  // Audio Recording Logic
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let mimeType = "audio/webm";
      if (typeof MediaRecorder !== "undefined") {
        const types = [
          "audio/webm",
          "audio/mp4",
          "audio/ogg",
          "audio/wav",
          "audio/aac",
        ];
        for (const t of types) {
          if (MediaRecorder.isTypeSupported(t)) {
            mimeType = t;
            break;
          }
        }
      }

      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        const endTime = Date.now();
        const durationMs = recordStartTimeRef.current ? endTime - recordStartTimeRef.current : 0;
        const durationSecs = Math.max(1, Math.round(durationMs / 1000));
        
        const mins = Math.floor(durationSecs / 60);
        const secs = durationSecs % 60;
        const durationStr = `${mins}:${secs.toString().padStart(2, "0")}`;
        const waveform = generateWaveform(Math.random() * 10);

        if (user && userProfile && userProfile.pairId) {
          try {
            await addVoiceNote(
              audioBlob,
              durationStr,
              durationSecs,
              waveform,
              user.uid,
              userProfile.displayName,
              userProfile.pairId
            );
          } catch (err) {
            console.error("Failed to upload voice note:", err);
          }
        }

        stream.getTracks().forEach((track) => track.stop());
      };

      setIsRecording(true);
      setRecordSecs(0);
      recordStartTimeRef.current = Date.now();
      mediaRecorder.start();

      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setRecordSecs((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Mic access error:", err);
      alert("Please allow microphone access to record voice notes.");
    }
  };

  const stopRecording = () => {
    if (timerIntervalRef.current) {
      window.clearInterval(timerIntervalRef.current);
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) window.clearInterval(timerIntervalRef.current);
    };
  }, []);

  const formatRecordTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

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
        <div className="app-scroll pb-40">
          {/* Header */}
          <header className="app-header">
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
              🎤 Voice Notes
            </h1>
            <p className="mt-1 text-sm" style={{ color: "var(--app-muted)" }}>
              Saved voice memories from {partnerName}
            </p>
          </header>

          {/* Error Banner */}
          {error && (
            <div className="app-section mb-4">
              <div className="rounded-2xl border p-4 text-sm font-semibold" style={{ background: "rgba(239, 68, 68, 0.08)", borderColor: "rgba(239, 68, 68, 0.22)", color: "var(--app-danger)" }}>
                {error}
              </div>
            </div>
          )}

          {/* Uploading Banner */}
          {isUploading && (
            <div className="app-section mb-4">
              <div className="rounded-2xl border p-4 text-sm font-semibold flex items-center gap-3" style={{ background: "var(--app-pink-surface)", borderColor: "var(--app-pink-border)", color: "var(--app-pink)" }}>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--app-pink)", borderTopColor: "transparent" }} />
                <span>Uploading voice note...</span>
              </div>
            </div>
          )}

          {/* Voice Notes List */}
          <section className="app-section space-y-4">
            {notesLoading ? (
              [1, 2].map((item) => (
                <div key={item} className="app-card h-32 animate-pulse" />
              ))
            ) : notes.length === 0 ? (
              <div className="app-empty">
                No voice notes yet. Hold the mic button below to record your first message.
              </div>
            ) : (
              notes.map((note) => {
                const playing = playingId === note.id;
                const progress = progresses[note.id] || 0;
                const isMine = note.authorId === user.uid;

                return (
                  <div
                    key={note.id}
                    className="app-card p-5"
                    style={{
                      borderColor: "var(--app-pink-border)",
                    }}
                  >
                    {/* Header line of Card */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎤</span>
                        <span className="text-sm font-semibold" style={{ color: "var(--app-pink)" }}>
                          {isMine ? "Voice Note from You" : `Voice Note from ${note.authorName}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleFavorite(note.id, note.isFavorite)}
                          className="transition-all hover:scale-115 active:scale-95"
                          type="button"
                          aria-label="Toggle Favorite"
                        >
                          <Heart
                            className="w-4 h-4"
                            style={{
                              color: note.isFavorite ? "#F8C8DC" : "var(--app-dimmed)",
                              fill: note.isFavorite ? "#F8C8DC" : "none",
                            }}
                          />
                        </button>
                        {isMine && (
                          <button
                            onClick={() => deleteVoiceNote(note.id)}
                            className="transition-all hover:scale-115 active:scale-95 text-xs"
                            type="button"
                            aria-label="Delete note"
                            style={{ color: "var(--app-dimmed)" }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Waveform and Play Button */}
                    <div className="flex items-center gap-3 mb-4">
                      <button
                        onClick={() => handlePlayPause(note)}
                        className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: "linear-gradient(135deg, #F8C8DC 0%, #F4A6C1 100%)",
                          boxShadow: "0 4px 12px rgba(244, 166, 193, 0.25)",
                        }}
                        type="button"
                        aria-label={playing ? "Pause" : "Play"}
                      >
                        {playing ? (
                          <Pause className="w-4 h-4 text-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white ml-0.5" fill="white" />
                        )}
                      </button>

                      <Waveform bars={note.waveform} progress={progress} isPlaying={playing} />

                      <span className="text-xs flex-shrink-0 tabular-nums" style={{ color: "var(--app-muted)" }}>
                        {note.duration}
                      </span>
                    </div>

                    {/* Footer line of Card */}
                    <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid var(--app-border)" }}>
                      <button
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-105"
                        style={{
                          background: "var(--app-pink-surface)",
                          border: "1px solid var(--app-pink-border)",
                          color: "var(--app-pink)",
                        }}
                        onClick={() => incrementReactions(note.id, note.reactions)}
                        type="button"
                      >
                        <Heart className="w-3.5 h-3.5" style={{ fill: "var(--app-pink)", color: "var(--app-pink)" }} />
                        <span>{note.reactions > 0 ? note.reactions : "React"}</span>
                      </button>
                      <span className="text-xs" style={{ color: "var(--app-dimmed)" }}>
                        {formatNoteTime(note.createdAt)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </section>
        </div>

        {/* Floating audio record overlay */}
        <div
          className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-md px-6 flex flex-col items-center gap-3 z-40"
          style={{ pointerEvents: "none" }}
        >
          {isRecording && (
            <div
              className="rounded-2xl px-6 py-3 flex items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-200"
              style={{
                background: "var(--app-card)",
                border: "1px solid var(--app-pink-border)",
                boxShadow: "0 8px 32px rgba(248,200,220,0.2)",
                pointerEvents: "auto",
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
              <RecordingWaveform isRecording={isRecording} />
              <span className="tabular-nums text-sm font-bold" style={{ color: "var(--app-pink)" }}>
                {formatRecordTime(recordSecs)}
              </span>
            </div>
          )}

          <button
            onMouseDown={isUploading ? undefined : startRecording}
            onMouseUp={isUploading ? undefined : stopRecording}
            onMouseLeave={() => !isUploading && isRecording && stopRecording()}
            onTouchStart={(e) => { if (!isUploading) { e.preventDefault(); startRecording(); } }}
            onTouchEnd={(e) => { if (!isUploading) { e.preventDefault(); stopRecording(); } }}
            disabled={isUploading}
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-105 active:scale-95"
            style={{
              background: isUploading
                ? "var(--app-overlay)"
                : isRecording
                ? "linear-gradient(135deg, #FF6B6B 0%, #FF3B30 100%)"
                : "linear-gradient(135deg, #F8C8DC 0%, #F4A6C1 100%)",
              boxShadow: isUploading
                ? "none"
                : isRecording
                ? "0 0 0 8px rgba(255,59,48,0.2)"
                : "0 8px 24px rgba(248,200,220,0.4)",
              pointerEvents: "auto",
            }}
            type="button"
            aria-label="Record voice note"
          >
            {isUploading ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--app-pink)", borderTopColor: "transparent" }} />
            ) : isRecording ? (
              <Square className="w-6 h-6 text-white" fill="white" />
            ) : (
              <Mic className="w-7 h-7 text-white" />
            )}
          </button>
          <span className="text-xs font-semibold" style={{ color: "var(--app-muted)", pointerEvents: "none" }}>
            {isUploading ? "Saving to cloud..." : isRecording ? "Release to send" : "Hold to record"}
          </span>
        </div>

        {/* Bottom Nav */}
        <BottomNav activeTab="voice" />
      </div>
    </div>
  );
}
