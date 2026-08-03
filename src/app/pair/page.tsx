"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function PairPage() {
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const router = useRouter();
  const [partnerCode, setPartnerCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) { router.replace("/auth/login"); return; }
    if (userProfile?.pairId) { router.replace("/dashboard"); }
  }, [user, userProfile, router]);

  const copyCode = () => {
    if (!userProfile?.pairCode) return;
    navigator.clipboard.writeText(userProfile.pairCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePair = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = partnerCode.trim().toUpperCase();

    if (code === userProfile?.pairCode) {
      setError("That's your own code! Share it with your partner.");
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, "users"), where("pairCode", "==", code));
      const snap = await getDocs(q);

      if (snap.empty) {
        setError("Code not found. Double-check with your partner.");
        setLoading(false);
        return;
      }

      const partnerDoc = snap.docs[0];
      const partnerData = partnerDoc.data();
      const partnerId = partnerDoc.id;

      // If partner already has a pairId, check if it's with the current user
      if (partnerData.pairId) {
        const existingPairSnap = await getDoc(doc(db, "pairs", partnerData.pairId));
        if (existingPairSnap.exists()) {
          const pairData = existingPairSnap.data();
          const alreadyPairedWithMe =
            pairData.user1Id === user!.uid || pairData.user2Id === user!.uid;

          if (alreadyPairedWithMe) {
            // Just fix current user's missing pairId and redirect
            await updateDoc(doc(db, "users", user!.uid), {
              pairId: partnerData.pairId,
              partnerId: partnerId,
            });
            await refreshProfile();
            router.replace("/dashboard");
            return;
          }
        }
        setError("This person is already paired with someone else.");
        setLoading(false);
        return;
      }

      // Create new pair
      const pairRef = await addDoc(collection(db, "pairs"), {
        user1Id: user!.uid,
        user2Id: partnerId,
        pairCode: code,
        createdAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user!.uid), {
        pairId: pairRef.id,
        partnerId: partnerId,
      });
      await updateDoc(doc(db, "users", partnerId), {
        pairId: pairRef.id,
        partnerId: user!.uid,
      });

      await refreshProfile();
      router.replace("/dashboard");
    } catch (err) {
      console.error("Pairing error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!userProfile) return null;

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "#0F0F0F" }}>
      <div className="ambient-bg" />
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="relative z-10 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">💑</div>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 500, color: "#F5F0F2" }}>
            Connect With Your Partner
          </h1>
          <p style={{ color: "#6B5F64", fontSize: "13px", marginTop: "8px" }}>Share your code or enter theirs to begin.</p>
        </div>

        <div className="card mb-4">
          <p style={{ fontSize: "12px", color: "#6B5F64", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "10px" }}>Your Pair Code</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-xl px-4 py-3 text-center" style={{ background: "#222", border: "1px solid rgba(248,200,220,0.15)", letterSpacing: "0.15em", fontSize: "22px", fontFamily: "DM Mono, monospace", color: "#F8C8DC", fontWeight: 500 }}>
              {userProfile.pairCode}
            </div>
            <button onClick={copyCode} className="btn-ghost" style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <p style={{ fontSize: "12px", color: "#6B5F64", marginTop: "8px" }}>Share this with your partner</p>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div style={{ flex: 1, height: "1px", background: "#2E2E2E" }} />
          <span style={{ color: "#6B5F64", fontSize: "12px" }}>or</span>
          <div style={{ flex: 1, height: "1px", background: "#2E2E2E" }} />
        </div>

        <form onSubmit={handlePair} className="space-y-4">
          {error && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(232,132,158,0.1)", border: "1px solid rgba(232,132,158,0.2)", color: "#F4A6C1" }}>
              {error}
            </motion.div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#A89BA2", marginBottom: "8px" }}>Partner's Code</label>
            <input
              className="input-base focus-ring"
              style={{ textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", fontSize: "18px", fontFamily: "DM Mono, monospace" }}
              type="text"
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
              placeholder="XXXXXXXX"
              maxLength={8}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Connecting…" : "Connect ❤️"}
          </button>
        </form>

        <button onClick={logout} className="w-full mt-6 text-center" style={{ color: "#6B5F64", fontSize: "12px", background: "none", border: "none", cursor: "pointer" }}>
          Sign out
        </button>
      </motion.div>
    </div>
  );
}