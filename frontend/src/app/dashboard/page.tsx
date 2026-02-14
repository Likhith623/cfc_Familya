'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Globe, Heart, Users, Trophy, Gamepad2, MessageCircle, Bell, Settings,
  Search, Star, Flame, Shield, Sparkles, ChevronRight, Home, User, LogOut
} from 'lucide-react';
import { ROLE_EMOJIS, LEVEL_NAMES } from '@/types';

// Mock data for demo
const MOCK_RELATIONSHIPS = [
  {
    id: 'rel-1', partner: { display_name: 'Maria Santos', country: 'Brazil', status: 'active', care_score: 78 },
    my_role: 'son', partner_role: 'mother', level: 3, bond_points: 145, care_score: 78,
    streak_days: 12, messages_exchanged: 234, last_interaction_at: new Date().toISOString()
  },
  {
    id: 'rel-2', partner: { display_name: 'Kenji Tanaka', country: 'Japan', status: 'busy', care_score: 52 },
    my_role: 'student', partner_role: 'mentor', level: 2, bond_points: 68, care_score: 52,
    streak_days: 5, messages_exchanged: 87, last_interaction_at: new Date(Date.now() - 3600000).toISOString()
  },
];

const MOCK_NOTIFICATIONS = [
  { id: '1', type: 'contest_ready', title: '🏆 Contest Ready!', body: 'Weekly bond challenge with Maria', is_read: false, created_at: new Date().toISOString() },
  { id: '2', type: 'new_message', title: '💬 New from Kenji', body: 'Sent you a voice note', is_read: false, created_at: new Date(Date.now() - 1800000).toISOString() },
  { id: '3', type: 'achievement_unlocked', title: '🎉 Achievement!', body: 'You earned "Loyal Friend" badge', is_read: true, created_at: new Date(Date.now() - 86400000).toISOString() },
];

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('familia_user');
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser({
        id: 'demo', display_name: 'Raj Patel', country: 'India',
        care_score: 45, reliability_score: 95, is_verified: true,
        total_bond_points: 213
      });
    }
  }, []);

  if (!user) return null;

  return (
    <div className="min-h-screen pb-24">
      {/* ── Top Navigation ─────────────────── */}
      <nav className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-familia-500 to-heart-500 flex items-center justify-center">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">Familia</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg hover:bg-white/5 transition"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-heart-500 rounded-full text-[10px] flex items-center justify-center font-bold">
                2
              </span>
            </button>
            <Link href="/profile" className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-sm font-bold">
                {user.display_name?.[0] || 'U'}
              </div>
            </Link>
          </div>
        </div>

        {/* Notifications dropdown */}
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-4 top-full mt-2 w-80 glass-card !p-0 overflow-hidden z-50"
          >
            <div className="p-3 border-b border-white/10 font-semibold text-sm">Notifications</div>
            {MOCK_NOTIFICATIONS.map((notif) => (
              <div
                key={notif.id}
                className={`p-3 border-b border-white/5 hover:bg-white/5 transition cursor-pointer ${!notif.is_read ? 'bg-familia-500/5' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{notif.title}</div>
                  {!notif.is_read && <div className="w-2 h-2 rounded-full bg-familia-400" />}
                </div>
                <div className="text-xs text-white/40 mt-0.5">{notif.body}</div>
              </div>
            ))}
          </motion.div>
        )}
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* ── Welcome Banner ───────────────── */}
        <motion.div
          className="glass-card mb-8 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-familia-500/10 via-transparent to-bond-500/10" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold mb-1">
                  Welcome back, <span className="gradient-text">{user.display_name || 'Friend'}</span> 👋
                </h1>
                <p className="text-white/40 text-sm">Your global family is waiting</p>
              </div>
              <div className="flex items-center gap-4 sm:gap-6">
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-familia-400">{user.care_score || 45}</div>
                  <div className="text-[10px] text-white/30">Care Score</div>
                </div>
                <div className="w-px h-8 bg-white/5 hidden sm:block" />
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-bond-400">{user.total_bond_points || 213}</div>
                  <div className="text-[10px] text-white/30">Bond Points</div>
                </div>
                <div className="w-px h-8 bg-white/5 hidden sm:block" />
                <div className="text-center flex items-center gap-1.5">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-400" />
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-orange-400">12</div>
                    <div className="text-[10px] text-white/30">Day Streak</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Quick Actions ────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { icon: <Search className="w-6 h-6" />, label: 'Find Match', href: '/matching', color: 'from-familia-500 to-heart-500' },
            { icon: <Trophy className="w-6 h-6" />, label: 'Contests', href: '/contests', color: 'from-amber-500 to-orange-500' },
            { icon: <Gamepad2 className="w-6 h-6" />, label: 'Games', href: '/games', color: 'from-purple-500 to-violet-500' },
            { icon: <Users className="w-6 h-6" />, label: 'Family Rooms', href: '/family-rooms', color: 'from-bond-500 to-cyan-500' },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link href={action.href}>
                <div className="glass-card !p-4 text-center card-hover cursor-pointer group">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    {action.icon}
                  </div>
                  <div className="font-medium text-sm">{action.label}</div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Active Relationships ─────────── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Heart className="w-5 h-5 text-heart-400" />
              Your Bonds
            </h2>
            <Link href="/matching" className="text-sm text-familia-400 hover:text-familia-300 flex items-center gap-1">
              Find new <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {MOCK_RELATIONSHIPS.map((rel, i) => (
              <motion.div
                key={rel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/chat/${rel.id}`}>
                  <div className="glass-card card-hover cursor-pointer">
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-2xl">
                          {ROLE_EMOJIS[rel.partner_role] || '🤝'}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#1A1A2E] ${
                          rel.partner.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'
                        }`} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate">{rel.partner.display_name}</span>
                          <span className="badge-verified text-[10px]">✅</span>
                        </div>
                        <div className="text-xs text-white/40 flex items-center gap-2">
                          <span>Your {rel.partner_role}</span>
                          <span>•</span>
                          <span>{rel.partner.country}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="badge-level text-[10px]">
                            Lv.{rel.level} {LEVEL_NAMES[rel.level]}
                          </span>
                          <span className="text-xs text-white/30 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-orange-400" />
                            {rel.streak_days}d
                          </span>
                        </div>
                      </div>

                      {/* Care Score Circle */}
                      <div className="text-center">
                        <div className="relative w-12 h-12">
                          <svg className="w-12 h-12 progress-ring" viewBox="0 0 44 44">
                            <circle cx="22" cy="22" r="18" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                            <circle
                              cx="22" cy="22" r="18" fill="none"
                              stroke={`url(#care-grad-${i})`}
                              strokeWidth="3"
                              strokeDasharray={`${(rel.care_score / 100) * 113} 113`}
                              strokeLinecap="round"
                              className="progress-ring__circle"
                            />
                            <defs>
                              <linearGradient id={`care-grad-${i}`}>
                                <stop offset="0%" stopColor="#FF6B35" />
                                <stop offset="100%" stopColor="#F43F5E" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                            {rel.care_score}
                          </div>
                        </div>
                        <div className="text-[10px] text-white/30 mt-0.5">Care</div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Recent Activity & Games ─────── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upcoming Contest */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold">Next Contest</h3>
            </div>
            <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
              <div className="text-sm font-medium mb-1">Weekly Bond Challenge with Maria 🇧🇷</div>
              <div className="text-xs text-white/40 mb-3">5 questions • 10 min limit • 50 max points</div>
              <Link href="/contests">
                <motion.button
                  className="btn-primary text-sm !py-2"
                  whileHover={{ scale: 1.02 }}
                >
                  Start Contest 🏆
                </motion.button>
              </Link>
            </div>
          </motion.div>

          {/* Quick Games */}
          <motion.div
            className="glass-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <h3 className="font-bold">Quick Games</h3>
            </div>
            <div className="space-y-2">
              {[
                { emoji: '🪞', name: 'Mood Mirror', desc: "Guess Maria's mood", points: 5 },
                { emoji: '🎭', name: 'Emotion Charades', desc: 'Play with Kenji', points: 10 },
                { emoji: '🤔', name: 'Would You Rather', desc: 'Quick fun round', points: 8 },
              ].map((game) => (
                <Link key={game.name} href="/games">
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition cursor-pointer">
                    <span className="text-2xl">{game.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{game.name}</div>
                      <div className="text-xs text-white/40">{game.desc}</div>
                    </div>
                    <span className="text-xs text-familia-400">+{game.points} pts</span>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom Navigation ──────────────── */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/5 z-50 safe-area-bottom">
        <div className="max-w-md mx-auto flex items-center justify-around py-2 pb-[env(safe-area-inset-bottom,8px)]">
          {[
            { icon: <Home className="w-5 h-5" />, label: 'Home', href: '/dashboard', active: true },
            { icon: <MessageCircle className="w-5 h-5" />, label: 'Chat', href: '/chat/rel-1', active: false },
            { icon: <Search className="w-5 h-5" />, label: 'Match', href: '/matching', active: false },
            { icon: <Gamepad2 className="w-5 h-5" />, label: 'Games', href: '/games', active: false },
            { icon: <User className="w-5 h-5" />, label: 'Profile', href: '/profile', active: false },
          ].map((item) => (
            <Link key={item.label} href={item.href}>
              <div className={`relative flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-xl transition-all duration-200 ${
                item.active
                  ? 'text-familia-400 bg-familia-500/10'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/5'
              }`}>
                {item.active && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-familia-400" />
                )}
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
