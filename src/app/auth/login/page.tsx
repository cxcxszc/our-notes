"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, userProfile } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // redirect happens via root page
      router.replace("/");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed";
      if (msg.includes("user-not-found") || msg.includes("wrong-password") || msg.includes("invalid-credential")) {
        setError("Invalid email or password.");
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
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4" style={{ background: "linear-gradient(135deg, rgba(248,200,220,0.15), rgba(232,132,158,0.1))", border: "1px solid rgba(248,200,220,0.12)" }}>
          <span className="text-3xl">💌</span>
        </div>
        <h1 className="text-glow" style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", fontWeight: 500, color: "#F5F0F2", letterSpacing: "-0.02em" }}>
          Our Notes
        </h1>
        <p style={{ color: "#6B5F64", fontSize: "13px", marginTop: "6px" }}>Welcome back, love.</p>
      </div>

      {/* Form */}
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={loading}
        >
          {loading ? "Signing in…" : "Sign In"}
        </button>
      </form>

      <div className="mt-6 space-y-3 text-center">
        <Link
          href="/auth/reset-password"
          style={{ display: "block", color: "#6B5F64", fontSize: "13px" }}
          className="hover:text-pink-baby transition-colors"
        >
          Forgot password?
        </Link>
        <p style={{ color: "#6B5F64", fontSize: "13px" }}>
          No account?{" "}
          <Link href="/auth/register" style={{ color: "#F4A6C1" }} className="hover:underline">
            Create one
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
