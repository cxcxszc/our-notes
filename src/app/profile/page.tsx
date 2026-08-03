"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Bell, LogOut, Trash2, ChevronRight, Heart, Sun, Moon, Smartphone, Check, User, Camera, X } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { BottomNav } from "@/components/ui/BottomNav";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { getToken } from "firebase/messaging";
import { db, getMessagingInstance } from "@/lib/firebase";
import { ThemeMode, SPECIAL_THEMES } from "@/types";

const THEME_OPTIONS = [
  { id: "light" as ThemeMode, label: "Light", icon: <Sun className="w-4 h-4" /> },
  { id: "dark" as ThemeMode, label: "Dark", icon: <Moon className="w-4 h-4" /> },
  { id: "system" as ThemeMode, label: "System", icon: <Smartphone className="w-4 h-4" /> },
];

const SPECIAL_THEME_IDS = SPECIAL_THEMES.map((t) => t.id);

// Special themes that should apply the dark base palette underneath them.
const DARK_SPECIAL_THEMES: ThemeMode[] = ["symbiote", "barbie-night", "spiderman-verse"];

async function uploadProfilePhoto(file: File): Promise<string> {
  const apiKey = process.env.NEXT_PUBLIC_IMGBB_API_KEY;
  if (!apiKey) throw new Error("Missing ImgBB API key");

  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: "POST",
    body: formData,
  });
  const data = await response.json();
  if (!response.ok || !data?.success) {
    throw new Error(data?.error?.message || "Photo upload failed");
  }
  return data.data.display_url || data.data.url;
}

function SettingRow({
  icon,
  title,
  subtitle,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl px-4 py-4 flex items-center justify-between gap-3 transition-all"
      style={{
        background: "var(--app-card)",
        border: "1px solid var(--app-border)",
      }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: "var(--app-pink-surface)", color: "var(--app-pink)" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: "var(--app-text)" }}>
            {title}
          </div>
          {subtitle && (
            <div className="text-xs mt-0.5 truncate" style={{ color: "var(--app-muted)" }}>
              {subtitle}
            </div>
          )}
        </div>
      </div>
      {right}
    </div>
  );
}

function Toggle({
  value,
  onChange,
  disabled,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => !disabled && onChange(!value)}
      disabled={disabled}
      className="relative w-12 h-6 rounded-full transition-colors flex-shrink-0"
      style={{
        background: value
          ? "linear-gradient(135deg, #F8C8DC 0%, #F4A6C1 100%)"
          : "var(--app-border)",
        opacity: disabled ? 0.6 : 1,
      }}
      type="button"
      aria-label="Toggle setting"
    >
      <div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
        style={{ transform: value ? "translateX(26px)" : "translateX(2px)" }}
      />
    </button>
  );
}

export default function ProfilePage() {
  const { user, userProfile, logout, loading: authLoading, refreshProfile } = useAuth();
  const router = useRouter();

  const [partnerName, setPartnerName] = useState("Partner");
  const [pairCreatedAt, setPairCreatedAt] = useState<Date | null>(null);
  const [copied, setCopied] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Settings states
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [storageSave, setStorageSave] = useState(true);

  const [notificationState, setNotificationState] = useState<
    "idle" | "loading" | "enabled" | "unsupported" | "denied"
  >("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (!("Notification" in window)) {
        setNotificationState("unsupported");
      } else if (Notification.permission === "granted") {
        setNotificationState("enabled");
      } else if (Notification.permission === "denied") {
        setNotificationState("denied");
      } else {
        setNotificationState("idle");
      }
    }
  }, []);

  const handleEnableNotifications = async () => {
    if (!user) return;
    setNotificationState("loading");

    try {
      const messaging = await getMessagingInstance();
      if (!messaging || !("Notification" in window)) {
        setNotificationState("unsupported");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotificationState("denied");
        return;
      }

      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!token) {
        setNotificationState("unsupported");
        return;
      }

      await updateDoc(doc(db, "users", user.uid), {
        notificationTokens: arrayUnion(token),
      });
      setNotificationState("enabled");

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("Notifications enabled", {
          body: "New notes, reactions, and photos can now pop up here.",
          icon: "/icons/icon-192.png",
        });
      }
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setNotificationState("unsupported");
    }
  };

  // Fetch partner info and pair creation date
  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.partnerId) {
      getDoc(doc(db, "users", userProfile.partnerId)).then((snap) => {
        if (snap.exists()) setPartnerName(snap.data().displayName || "Partner");
      });
    }

    if (userProfile.pairId) {
      getDoc(doc(db, "pairs", userProfile.pairId)).then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.createdAt) {
            setPairCreatedAt(data.createdAt.toDate());
          }
        }
      });
    }
  }, [userProfile]);

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem("our-notes-theme") as ThemeMode | null;
    if (saved) setThemeState(saved);
  }, []);

  // Theme change application handler (handles base light/dark/system as well
  // as the Special Themes, which layer their own background + palette).
  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem("our-notes-theme", t);

    SPECIAL_THEME_IDS.forEach((id) => document.documentElement.classList.remove(`theme-${id}`));

    const applyDark = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    if (SPECIAL_THEME_IDS.includes(t)) {
      document.documentElement.classList.add(`theme-${t}`);
      applyDark(DARK_SPECIAL_THEMES.includes(t));
      return;
    }

    if (t === "system") {
      const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyDark(darkQuery.matches);
    } else {
      applyDark(t === "dark");
    }
  };

  const handlePhotoSelect = async (file?: File) => {
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Please choose an image file.");
      return;
    }
    setPhotoError(null);
    setPhotoUploading(true);
    try {
      const photoURL = await uploadProfilePhoto(file);
      await updateDoc(doc(db, "users", user.uid), { photoURL });
      await refreshProfile();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Photo upload failed. Please try again.");
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user) return;
    setPhotoError(null);
    try {
      await updateDoc(doc(db, "users", user.uid), { photoURL: null });
      await refreshProfile();
    } catch (err) {
      setPhotoError("Couldn't remove photo. Please try again.");
    }
  };

  const copyCode = () => {
    if (!userProfile?.pairCode) return;
    navigator.clipboard.writeText(userProfile.pairCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysTogether = pairCreatedAt
    ? Math.max(0, Math.floor((Date.now() - pairCreatedAt.getTime()) / 86400000))
    : 0;

  const handleLogout = async () => {
    try {
      await logout();
      router.replace("/auth/login");
    } catch (err) {
      console.error("Logout error:", err);
    }
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
        <div className="app-scroll pb-28">
          {/* Header */}
          <div className="px-6 pt-10 pb-6">
            <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--app-text)" }}>
              Profile
            </h1>
          </div>

          {/* User Profile Card */}
          <div className="px-6 mb-6">
            <div
              className="rounded-3xl p-6 text-center"
              style={{
                background: "var(--app-pink-surface)",
                border: "1px solid var(--app-pink-border)",
                boxShadow: "0 8px 32px rgba(248,200,220,0.1)",
              }}
            >
              {/* Avatar circle */}
              <div className="relative mx-auto mb-2 w-20 h-20">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-md overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #F8C8DC 0%, #F4A6C1 100%)",
                  }}
                >
                  {userProfile.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userProfile.photoURL} alt={userProfile.displayName} className="h-full w-full object-cover" />
                  ) : userProfile.displayName ? (
                    userProfile.displayName.charAt(0).toUpperCase()
                  ) : (
                    <User />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full shadow-md"
                  style={{ background: "var(--app-card)", border: "1px solid var(--app-pink-border)" }}
                  aria-label="Change profile photo"
                  title="Change photo"
                >
                  <Camera className="h-3.5 w-3.5" style={{ color: "var(--app-pink)" }} />
                </button>
                {userProfile.photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute bottom-0 left-0 flex h-7 w-7 items-center justify-center rounded-full shadow-md"
                    style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
                    aria-label="Remove profile photo"
                    title="Remove photo"
                  >
                    <X className="h-3.5 w-3.5" style={{ color: "var(--app-danger)" }} />
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handlePhotoSelect(event.target.files?.[0])}
                />
              </div>
              {photoUploading && (
                <p className="mb-2 text-xs font-semibold" style={{ color: "var(--app-muted)" }}>
                  Uploading photo...
                </p>
              )}
              {photoError && (
                <p className="mb-2 text-xs font-semibold" style={{ color: "var(--app-danger)" }}>
                  {photoError}
                </p>
              )}
              <h2 className="text-xl font-bold mb-1" style={{ color: "var(--app-text)" }}>
                {userProfile.displayName}
              </h2>
              <p className="text-sm mb-4" style={{ color: "var(--app-muted)" }}>
                Connected with {partnerName} ❤️
              </p>

              {/* Days Together pill */}
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                style={{
                  background: "var(--app-card)",
                  border: "1px solid var(--app-pink-border)",
                }}
              >
                <Heart className="w-4 h-4" style={{ color: "var(--app-pink)", fill: "var(--app-pink)" }} />
                <span className="text-sm font-bold" style={{ color: "var(--app-text)" }}>
                  {daysTogether} days together
                </span>
              </div>
            </div>
          </div>

          {/* Pair Code Copy Section */}
          <div className="px-6 mb-6">
            <div
              className="rounded-3xl px-5 py-4 flex items-center justify-between"
              style={{
                background: "var(--app-card)",
                border: "1px solid var(--app-border)",
              }}
            >
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--app-muted)" }}>
                  Your Pair Code
                </div>
                <div className="text-2xl font-mono font-bold tracking-widest" style={{ color: "var(--app-pink)" }}>
                  {userProfile.pairCode}
                </div>
              </div>
              <button
                onClick={copyCode}
                className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "var(--app-pink-surface)",
                  border: "1px solid var(--app-pink-border)",
                }}
                type="button"
                aria-label="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4" style={{ color: "var(--app-pink)" }} />
                ) : (
                  <Copy className="w-4 h-4" style={{ color: "var(--app-pink)" }} />
                )}
              </button>
            </div>
          </div>

          {/* Appearance Section */}
          <div className="px-6 mb-6">
            <h3 className="text-xs font-bold tracking-wider mb-3 px-1 uppercase" style={{ color: "var(--app-muted)" }}>
              Appearance
            </h3>
            <div
              className="rounded-3xl p-4"
              style={{
                background: "var(--app-card)",
                border: "1px solid var(--app-border)",
              }}
            >
              <div className="text-sm font-semibold mb-3" style={{ color: "var(--app-text)" }}>
                Theme
              </div>
              <div className="flex gap-2">
                {THEME_OPTIONS.map((opt) => {
                  const active = theme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setTheme(opt.id)}
                      className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl text-xs font-bold transition-all"
                      style={{
                        background: active ? "var(--app-pink-surface)" : "var(--app-overlay)",
                        border: active
                          ? "1.5px solid var(--app-pink)"
                          : "1.5px solid transparent",
                        color: active ? "var(--app-pink)" : "var(--app-muted)",
                      }}
                      type="button"
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Special Themes Section */}
          <div className="px-6 mb-6">
            <h3 className="text-xs font-bold tracking-wider mb-3 px-1 uppercase" style={{ color: "var(--app-muted)" }}>
              NEW THEMES
            </h3>
            <div
              className="rounded-3xl p-4 space-y-4"
              style={{ background: "var(--app-card)", border: "1px solid var(--app-border)" }}
            >
              {(["Option 1", "Option 2"] as const).map((group) => (
                <div key={group}>
                  <div className="text-sm font-semibold mb-2" style={{ color: "var(--app-text)" }}>
                    {group}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {SPECIAL_THEMES.filter((opt) => opt.group === group).map((opt) => {
                      const active = theme === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setTheme(opt.id)}
                          className="flex flex-col items-center gap-1 py-2.5 rounded-2xl text-[11px] font-bold transition-all"
                          style={{
                            background: active ? "var(--app-pink-surface)" : "var(--app-overlay)",
                            border: active ? "1.5px solid var(--app-pink)" : "1.5px solid transparent",
                            color: active ? "var(--app-pink)" : "var(--app-muted)",
                          }}
                          type="button"
                        >
                          <span className={`theme-swatch theme-swatch-${opt.id}`} aria-hidden="true" />
                          <span className="text-center leading-tight">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <p className="text-[11px]" style={{ color: "var(--app-dimmed)" }}>
                Special themes add a subtle animated background — text and buttons always stay readable.
              </p>
            </div>
          </div>

          {/* Settings Section */}
          <div className="px-6 mb-6">
            <h3 className="text-xs font-bold tracking-wider mb-3 px-1 uppercase" style={{ color: "var(--app-muted)" }}>
              Settings
            </h3>
            <div className="space-y-2">
              <SettingRow
                icon={<Bell className="w-4 h-4" />}
                title="Notifications"
                subtitle={
                  notificationState === "loading"
                    ? "Enabling notifications..."
                    : notificationState === "enabled"
                    ? "Notifications are active"
                    : notificationState === "denied"
                    ? "Blocked by browser settings"
                    : notificationState === "unsupported"
                    ? "Not supported on this browser"
                    : "Get notified of new notes"
                }
                right={
                  <Toggle
                    value={notificationState === "enabled"}
                    disabled={notificationState === "loading"}
                    onChange={async (checked) => {
                      if (checked) {
                        if (notificationState === "idle") {
                          await handleEnableNotifications();
                        } else if (notificationState === "denied") {
                          alert("Notifications are blocked. Please enable them in your browser settings.");
                        } else if (notificationState === "unsupported") {
                          alert("Notifications are not supported on this browser/device.");
                        }
                      } else {
                        alert("To stop receiving notifications, please disable permission in your browser's site settings.");
                      }
                    }}
                  />
                }
              />
              <SettingRow
                icon={<span className="text-sm">📁</span>}
                title="Save Voice Notes"
                subtitle="Auto-save recordings locally"
                right={<Toggle value={storageSave} onChange={setStorageSave} />}
              />
              <SettingRow
                icon={<span className="text-sm">🔒</span>}
                title="Privacy Settings"
                right={<ChevronRight className="w-4 h-4" style={{ color: "var(--app-dimmed)" }} />}
              />
            </div>
          </div>

          {/* Danger Zone Actions */}
          <div className="px-6 mb-4 space-y-2">
            <button
              onClick={handleLogout}
              className="w-full rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
              }}
              type="button"
            >
              <LogOut className="w-4 h-4" style={{ color: "var(--app-danger)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--app-danger)" }}>Sign Out</span>
            </button>
            <button
              className="w-full rounded-2xl py-3.5 px-4 flex items-center justify-center gap-2 transition-all hover:opacity-80 active:scale-[0.98]"
              style={{
                background: "rgba(239,68,68,0.03)",
                border: "1px solid rgba(239,68,68,0.1)",
              }}
              type="button"
            >
              <Trash2 className="w-4 h-4 opacity-60" style={{ color: "var(--app-danger)" }} />
              <span className="text-sm font-semibold opacity-60" style={{ color: "var(--app-danger)" }}>Delete Account</span>
            </button>
          </div>

          {/* Version Footer */}
          <div className="text-center mt-6">
            <p className="text-[11px]" style={{ color: "var(--app-dimmed)" }}>
              CK Space v1.0.0 · Made with ❤️
            </p>
          </div>
        </div>

        {/* Bottom Nav */}
        <BottomNav activeTab="profile" />
      </div>
    </div>
  );
}
