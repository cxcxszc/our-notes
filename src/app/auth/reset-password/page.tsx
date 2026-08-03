"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch {
      setError("Failed to send reset email. Check the address and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, rgba(248,200,220,0.15), rgba(232,132,158,0.1))", border: "1px solid rgba(248,200,220,0.12)" }}>
          <span className="text-3xl">🔐</span>
        </div>
        <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "26px", fontWeight: 500, color: "#F5F0F2" }}>Reset Password</h1>
        <p style={{ color: "#6B5F64", fontSize: "13px", marginTop: "6px" }}>We'll send you a reset link.</p>
      </div>

      {sent ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4">
          <div className="text-4xl">📬</div>
          <p style={{ color: "#A89BA2", fontSize: "14px" }}>Check your inbox! A reset link has been sent to <strong style={{ color: "#F5F0F2" }}>{email}</strong></p>
          <Link href="/auth/login" className="btn-ghost inline-block mt-4">Back to Login</Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-xl px-4 py-3 text-sm" style={{ background: "rgba(232,132,158,0.1)", border: "1px solid rgba(232,132,158,0.2)", color: "#F4A6C1" }}>
              {error}
            </div>
          )}
          <div>
            <label style={{ display: "block", fontSize: "13px", color: "#A89BA2", marginBottom: "8px" }}>Email Address</label>
            <input className="input-base focus-ring" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
          <Link href="/auth/login" className="btn-ghost w-full block text-center mt-2">Cancel</Link>
        </form>
      )}
    </motion.div>
  );
}
