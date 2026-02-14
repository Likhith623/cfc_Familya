"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { Globe, Eye, EyeOff, ArrowRight, Shield, Heart, Sparkles } from "lucide-react";

const FLOATING_FLAGS = ["🇮🇳", "🇧🇷", "🇯🇵", "🇰🇪", "🇩🇪", "🇲🇽"];

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      localStorage.setItem("familia_token", "demo-token-" + Date.now());
      localStorage.setItem(
        "familia_user",
        JSON.stringify({
          id: "demo-user-1",
          display_name: "Demo User",
          email: form.email,
          country: "India",
          is_verified: true,
          care_score: 45,
          reliability_score: 95,
          total_bond_points: 213,
        })
      );
      window.location.href = "/dashboard";
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    localStorage.setItem("familia_token", "demo-token-" + Date.now());
    localStorage.setItem(
      "familia_user",
      JSON.stringify({
        id: "demo-user-1",
        display_name: "Raj Patel",
        email: "raj@example.com",
        country: "India",
        city: "Mumbai",
        is_verified: true,
        care_score: 45,
        reliability_score: 95,
        total_bond_points: 213,
        languages: ["English", "Hindi", "Gujarati"],
      })
    );
    window.location.href = "/dashboard";
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Floating flags */}
      {FLOATING_FLAGS.map((flag, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-[0.08] pointer-events-none select-none"
          style={{
            left: `${10 + i * 15}%`,
            top: `${15 + (i % 3) * 25}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, i % 2 === 0 ? 10 : -10, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {flag}
        </motion.div>
      ))}

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo & Heading */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6 group">
            <motion.div
              className="w-11 h-11 rounded-xl bg-gradient-to-br from-familia-500 to-heart-500 flex items-center justify-center shadow-lg shadow-familia-500/20 group-hover:shadow-familia-500/30 transition-shadow"
              whileHover={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Globe className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-2xl font-bold tracking-tight">Familia</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Welcome Back 👋</h1>
          <p className="text-white/40">Your global family is waiting for you</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="glass-card space-y-5">
          <div>
            <label className="text-sm text-white/50 mb-1.5 block font-medium">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="your@email.com"
              className="input-familia"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-white/50 font-medium">Password</label>
              <button type="button" className="text-xs text-familia-400 hover:text-familia-300 transition">
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Your password"
                className="input-familia pr-12"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-primary w-full flex items-center justify-center gap-2 !py-3.5"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Sign In <ArrowRight className="w-4 h-4" />
              </>
            )}
          </motion.button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.06]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#12121f] text-white/25">or try instantly</span>
            </div>
          </div>

          {/* Demo button */}
          <motion.button
            type="button"
            onClick={handleDemo}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.05] text-white/60 hover:text-white/80 transition-all text-sm font-medium"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Sparkles className="w-4 h-4 text-familia-400" />
            Explore Demo (as Raj Patel 🇮🇳)
          </motion.button>
        </form>

        {/* Social proof */}
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-white/25">
          <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> Verified humans only</span>
          <span className="flex items-center gap-1.5"><Heart className="w-3 h-3" /> 12K+ bonds formed</span>
        </div>

        <p className="text-center text-white/35 text-sm mt-6">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-familia-400 hover:text-familia-300 font-medium transition">
            Join Familia
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
