"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email, password, displayName);
      router.replace("/pair");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      if (msg.includes("email-already-in-use")) {
        setError("This email is already registered.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, rgba(248,200,220,0.15), rgba(232,132,158,0.1))", border: "1px solid rgba(248,200,220,0.12)" }}>
          <span className="text-3xl">💌</span>
        </div>
        <h1 className="text-glow" style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 500, color: "#F5F0F2", letterSpacing: "-0.02em" }}>
          Our Notes
        </h1>
        <p style={{ color: "#6B5F64", fontSize: "13px", marginTop: "6px" }}>Create your private space.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-xl px-4 py-3 text-sm"
            style={{ background: "rgba(232,132,158,0.1)", border: "1px solid rgba(232,132,158,0.2)", color: "#F4A6C1" }}
          >
            {error}
          </motion.div>
        )}
        <div>
          <label style={{ display: "block", fontSize: "13px", color: "#A89BA2", marginBottom: "8px" }}>Your Name</label>
          <input
            className="input-base focus-ring"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="What should they call you?"
            required
            autoComplete="name"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", color: "#A89BA2", marginBottom: "8px" }}>Email</label>
          <input
            className="input-base focus-ring"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label style={{ display: "block", fontSize: "13px", color: "#A89BA2", marginBottom: "8px" }}>Password</label>
          <input
            className="input-base focus-ring"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 6 characters"
            required
            autoComplete="new-password"
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>

      <p className="mt-6 text-center" style={{ color: "#6B5F64", fontSize: "13px" }}>
        Already have an account?{" "}
        <Link href="/auth/login" style={{ color: "#F4A6C1" }} className="hover:underline">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
