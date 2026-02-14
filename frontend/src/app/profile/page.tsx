"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft, Globe, Heart, Shield, Star, Flame, Trophy, Medal,
  Languages, MapPin, Calendar, Settings, LogOut, Edit, ChevronRight,
  Sparkles, Users, Award, Zap
} from "lucide-react";
import { LEVEL_NAMES } from "@/types";

const ACHIEVEMENTS = [
  { id: "first-bond", emoji: "🤝", name: "First Bond", desc: "Made your first connection", earned: true },
  { id: "polyglot", emoji: "🌐", name: "Polyglot", desc: "Chat in 3+ languages", earned: true },
  { id: "loyal-friend", emoji: "💎", name: "Loyal Friend", desc: "30-day streak with a bond", earned: true },
  { id: "culture-chef", emoji: "🍳", name: "Culture Chef", desc: "Share 5 recipes", earned: false },
  { id: "storyteller", emoji: "📖", name: "Storyteller", desc: "Share 10 cultural stories", earned: false },
  { id: "quiz-master", emoji: "🧠", name: "Quiz Master", desc: "Win 10 bond contests", earned: true },
  { id: "global-heart", emoji: "❤️", name: "Global Heart", desc: "Care score above 75", earned: true },
  { id: "world-family", emoji: "🌍", name: "World Family", desc: "Bonds in 5+ countries", earned: false },
];

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("familia_user");
    if (stored) setUser(JSON.parse(stored));
    else setUser({
      id: "demo", display_name: "Raj Patel", email: "raj@example.com",
      country: "India", city: "Mumbai", age: 22,
      languages: ["English", "Hindi", "Gujarati"],
      care_score: 45, reliability_score: 95, is_verified: true,
      total_bond_points: 213, joined: "2024-01-15",
    });
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 glass border-b border-white/5 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <motion.button className="p-2 rounded-lg hover:bg-white/5 transition" whileTap={{ scale: 0.95 }}>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>
            <h1 className="font-bold text-lg">My Profile</h1>
          </div>
          <Link href="/avatar">
            <motion.button
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-familia-500/10 to-heart-500/10 text-familia-400 text-xs flex items-center gap-1.5 hover:from-familia-500/20 hover:to-heart-500/20 transition border border-familia-500/20"
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles className="w-3 h-3" /> Edit Avatar
            </motion.button>
          </Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ── Profile Card ── */}
        <motion.div className="glass-card relative overflow-hidden mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="absolute inset-0 bg-gradient-to-br from-familia-500/5 via-transparent to-heart-500/5" />
          {/* Decorative top gradient */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-familia-500/[0.06] to-transparent rounded-t-2xl" />
          <div className="relative z-10 flex items-center gap-6">
            {/* Avatar with animated ring */}
            <Link href="/avatar">
              <div className="relative group cursor-pointer">
                <div className="avatar-ring">
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-4xl font-bold shadow-glow-sm group-hover:shadow-glow-md transition-shadow duration-300">
                    {user.display_name?.[0] || "R"}
                  </div>
                </div>
                {user.is_verified && (
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center border-2 border-[#1A1A2E]"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                  >
                    <Shield className="w-3.5 h-3.5 text-white" />
                  </motion.div>
                )}
                <div className="absolute inset-0 rounded-2xl bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Edit className="w-5 h-5" />
                </div>
              </div>
            </Link>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold">{user.display_name}</h2>
                {user.is_verified && <span className="badge-verified text-xs">✅ Verified</span>}
              </div>
              <div className="flex items-center gap-3 text-sm text-white/40 mb-2">
                <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.city}, {user.country}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined Jan 2024</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(user.languages || ["English", "Hindi"]).map((lang: string) => (
                  <span key={lang} className="text-[10px] px-2 py-1 rounded-full bg-familia-500/10 text-familia-300 border border-familia-500/20">
                    🌐 {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Care Score", value: user.care_score || 45, icon: <Heart className="w-4 h-4" />, color: "text-heart-400", bg: "bg-heart-500/10", border: "border-heart-500/10" },
            { label: "Bond Points", value: user.total_bond_points || 213, icon: <Zap className="w-4 h-4" />, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/10" },
            { label: "Reliability", value: `${user.reliability_score || 95}%`, icon: <Shield className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/10" },
            { label: "Best Streak", value: "12 days", icon: <Flame className="w-4 h-4" />, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/10" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className={`glass-card !p-4 text-center border ${stat.border}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
            >
              <div className={`w-10 h-10 mx-auto mb-2 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-white/30">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ── Active Bonds ── */}
        <motion.div className="glass-card mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-bond-400" /> Active Bonds
            </h3>
            <Link href="/matching" className="text-xs text-familia-400 hover:text-familia-300 flex items-center gap-1">
              Find more <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {[
              { name: "Maria Santos", country: "🇧🇷 Brazil", role: "mother", emoji: "👩", level: 3, streak: 12 },
              { name: "Kenji Tanaka", country: "🇯🇵 Japan", role: "mentor", emoji: "🧑‍🏫", level: 2, streak: 5 },
            ].map((bond, i) => (
              <Link key={i} href={`/chat/rel-${i + 1}`}>
                <motion.div
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition cursor-pointer group"
                  whileHover={{ x: 2 }}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-lg group-hover:shadow-glow-sm transition-shadow">
                    {bond.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{bond.name}</div>
                    <div className="text-xs text-white/30">{bond.country} • Your {bond.role}</div>
                  </div>
                  <div className="text-right">
                    <div className="badge-level text-[10px]">Lv.{bond.level} {LEVEL_NAMES[bond.level]}</div>
                    <div className="text-[10px] text-orange-400 flex items-center gap-1 justify-end mt-0.5">
                      <Flame className="w-3 h-3" /> {bond.streak}d
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ── Achievements ── */}
        <motion.div className="glass-card mb-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Trophy className="w-4 h-4 text-amber-400" /> Achievements
            <span className="text-xs text-white/30 ml-auto">{ACHIEVEMENTS.filter(a => a.earned).length}/{ACHIEVEMENTS.length}</span>
          </h3>
          <div className="grid grid-cols-4 gap-3">
            {ACHIEVEMENTS.map((ach, i) => (
              <motion.div
                key={ach.id}
                className={`text-center p-2 rounded-xl transition-all ${
                  ach.earned
                    ? "bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/10"
                    : "bg-white/[0.02] border border-white/5 opacity-40 grayscale"
                }`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: ach.earned ? 1 : 0.4, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                whileHover={ach.earned ? { scale: 1.05, y: -2 } : {}}
              >
                <div className="text-2xl mb-1">{ach.emoji}</div>
                <div className="text-[10px] font-medium">{ach.name}</div>
                <div className="text-[8px] text-white/30">{ach.desc}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ── Settings ── */}
        <motion.div className="glass-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h3 className="font-bold flex items-center gap-2 mb-4">
            <Settings className="w-4 h-4 text-white/40" /> Settings
          </h3>
          <div className="space-y-1">
            {[
              { icon: <Globe className="w-4 h-4" />, label: "Language Preferences" },
              { icon: <Shield className="w-4 h-4" />, label: "Privacy & Safety" },
              { icon: <Sparkles className="w-4 h-4" />, label: "Notification Settings" },
              { icon: <Languages className="w-4 h-4" />, label: "Translation Settings" },
            ].map((item) => (
              <button key={item.label} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition text-left group">
                <span className="text-white/40 group-hover:text-white/60 transition">{item.icon}</span>
                <span className="text-sm flex-1">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
              </button>
            ))}
            <Link href="/">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/5 transition text-left text-red-400/60 hover:text-red-400">
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Sign Out</span>
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
