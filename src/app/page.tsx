"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/auth/login");
    } else if (!userProfile?.pairId) {
      router.replace("/pair");
    } else {
      router.replace("/dashboard");
    }
  }, [user, userProfile, loading, router]);

  return (
    <div className="min-h-dvh flex items-center justify-center" style={{ background: "#0F0F0F" }}>
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full animate-pulse"
          style={{ background: "linear-gradient(135deg, #F8C8DC, #E8849E)" }}
        />
        <p style={{ color: "#A89BA2", fontSize: "14px", fontFamily: "DM Sans, sans-serif" }}>
          Loading…
        </p>
      </div>
    </div>
  );
}
