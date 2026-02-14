'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Globe, Heart, Search, Sparkles, Users, Star, Shield,
  ChevronRight, Loader2, Zap
} from 'lucide-react';
import { ROLE_EMOJIS } from '@/types';

const ROLES = [
  { id: 'mother', label: 'Mother', emoji: '👩', desc: 'A nurturing soul from another culture', color: 'from-pink-500 to-rose-500' },
  { id: 'father', label: 'Father', emoji: '👨', desc: 'A guiding presence across borders', color: 'from-blue-500 to-indigo-500' },
  { id: 'son', label: 'Son', emoji: '👦', desc: 'An eager learner from far away', color: 'from-green-500 to-emerald-500' },
  { id: 'daughter', label: 'Daughter', emoji: '👧', desc: 'A curious explorer of cultures', color: 'from-purple-500 to-violet-500' },
  { id: 'sibling', label: 'Sibling', emoji: '🧑', desc: 'A companion across the world', color: 'from-orange-500 to-amber-500' },
  { id: 'grandparent', label: 'Grandparent', emoji: '👴', desc: 'Wisdom from another heritage', color: 'from-amber-500 to-yellow-500' },
  { id: 'grandchild', label: 'Grandchild', emoji: '🧒', desc: 'Youth bridging generations & cultures', color: 'from-cyan-500 to-teal-500' },
  { id: 'mentor', label: 'Mentor', emoji: '🧑‍🏫', desc: 'A guide in a new cultural journey', color: 'from-familia-500 to-bond-500' },
  { id: 'student', label: 'Student', emoji: '🧑‍🎓', desc: 'Ready to learn from another world', color: 'from-emerald-500 to-green-500' },
  { id: 'friend', label: 'Friend', emoji: '🤝', desc: 'A genuine cross-cultural bond', color: 'from-heart-500 to-pink-500' },
  { id: 'penpal', label: 'Pen Pal', emoji: '✉️', desc: 'Exchange letters across the globe', color: 'from-violet-500 to-purple-500' },
];

type MatchState = 'select-role' | 'select-partner-role' | 'searching' | 'found' | 'ready';

const MOCK_MATCH = {
  display_name: 'Maria Santos',
  country: 'Brazil',
  languages: ['Portuguese', 'English', 'Spanish'],
  care_score: 78,
  is_verified: true,
  bio: 'Mother of 3, love cooking and sharing Brazilian culture with the world 🇧🇷💕',
};

export default function MatchingPage() {
  const [step, setStep] = useState<MatchState>('select-role');
  const [myRole, setMyRole] = useState('');
  const [partnerRole, setPartnerRole] = useState('');
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    if (step === 'searching') {
      const timer = setInterval(() => setSearchTime(t => t + 1), 1000);
      const found = setTimeout(() => setStep('found'), 4000 + Math.random() * 3000);
      return () => { clearInterval(timer); clearTimeout(found); };
    }
  }, [step]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 glass border-b border-white/5 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard">
            <motion.button className="p-2 rounded-lg hover:bg-white/5 transition" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Search className="w-5 h-5 text-familia-400" />
            Find Your Match
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-8">
          {(['Your Role', 'Partner', 'Searching', 'Matched'] as const).map((label, i) => {
            const stepNum = step === 'select-role' ? 1 : step === 'select-partner-role' ? 2 : step === 'searching' ? 3 : 4;
            return (
              <div key={label} className="flex items-center gap-1.5 sm:gap-2">
                <div className={`flex items-center gap-1 sm:gap-1.5 transition-all duration-500 ${i + 1 <= stepNum ? 'opacity-100' : 'opacity-30'}`}>
                  <motion.div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold transition-all duration-500 ${
                      i + 1 < stepNum ? 'bg-familia-500 text-white shadow-lg shadow-familia-500/25' :
                      i + 1 === stepNum ? 'bg-gradient-to-r from-familia-500 to-bond-500 text-white ring-2 ring-familia-400/30 shadow-lg shadow-familia-500/20' :
                      'border border-white/15 text-white/40'
                    }`}
                    animate={i + 1 === stepNum ? { scale: [1, 1.1, 1] } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    {i + 1 < stepNum ? '✓' : i + 1}
                  </motion.div>
                  <span className={`text-[10px] sm:text-xs hidden sm:inline transition-colors duration-300 ${i + 1 === stepNum ? 'text-white/70 font-medium' : 'text-white/30'}`}>{label}</span>
                </div>
                {i < 3 && <div className={`w-5 sm:w-10 h-px transition-colors duration-500 ${i + 1 < stepNum ? 'bg-gradient-to-r from-familia-500 to-bond-500' : 'bg-white/10'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Select Your Role ───────── */}
          {step === 'select-role' && (
            <motion.div
              key="select-role"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8 sm:mb-10">
                <div className="relative inline-block mb-4">
                  <motion.div
                    className="text-5xl sm:text-6xl"
                    animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                  >
                    🌍
                  </motion.div>
                  <motion.div
                    className="absolute -inset-3 rounded-full bg-gradient-to-br from-familia-500/15 to-bond-500/15 blur-xl"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 3 }}
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight">Who do you want to be?</h2>
                <p className="text-white/50 text-sm sm:text-base">Choose the role you want to play in this cross-cultural bond</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {ROLES.map((role, index) => (
                  <motion.button
                    key={role.id}
                    onClick={() => { setMyRole(role.id); setStep('select-partner-role'); }}
                    className="glass-card !p-4 sm:!p-5 text-center cursor-pointer group relative overflow-hidden border border-white/5 hover:border-transparent transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    {/* Gradient border glow on hover */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{ padding: '1px' }}>
                      <div className="w-full h-full rounded-2xl bg-[#0A0A1A]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/[0.03] group-hover:to-transparent transition-all duration-500 rounded-2xl" />
                    <div className="relative z-10">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        {role.emoji}
                      </div>
                      <div className="font-semibold text-sm sm:text-base mb-1">{role.label}</div>
                      <div className="text-[10px] sm:text-[11px] text-white/40 leading-tight">{role.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Step 2: Select Partner Role ────── */}
          {step === 'select-partner-role' && (
            <motion.div
              key="select-partner"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="text-4xl">{ROLE_EMOJIS[myRole]}</div>
                  <Heart className="w-6 h-6 text-heart-400" />
                  <div className="text-4xl">❓</div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Who are you looking for?</h2>
                <p className="text-white/40">
                  As a <span className="text-familia-400 font-medium">{myRole}</span>, who would complete your family?
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {ROLES.filter(r => r.id !== myRole).map((role, index) => (
                  <motion.button
                    key={role.id}
                    onClick={() => {
                      setPartnerRole(role.id);
                      setStep('searching');
                    }}
                    className="glass-card !p-4 sm:!p-5 text-center cursor-pointer group relative overflow-hidden border border-white/5 hover:border-transparent transition-all duration-300"
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    {/* Gradient border glow on hover */}
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${role.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} style={{ padding: '1px' }}>
                      <div className="w-full h-full rounded-2xl bg-[#0A0A1A]" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/[0.03] group-hover:to-transparent transition-all duration-500 rounded-2xl" />
                    <div className="relative z-10">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl sm:text-3xl group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                        {role.emoji}
                      </div>
                      <div className="font-semibold text-sm sm:text-base mb-1">{role.label}</div>
                      <div className="text-[10px] sm:text-[11px] text-white/40 leading-tight">{role.desc}</div>
                    </div>
                  </motion.button>
                ))}
              </div>

              <button
                onClick={() => { setMyRole(''); setStep('select-role'); }}
                className="mt-6 text-sm text-white/30 hover:text-white/50 transition mx-auto block"
              >
                ← Change my role
              </button>
            </motion.div>
          )}

          {/* ── Step 3: Searching Animation ────── */}
          {step === 'searching' && (
            <motion.div
              key="searching"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20"
            >
              {/* Animated globe with orbiting emojis */}
              <div className="relative w-56 h-56 sm:w-72 sm:h-72 mx-auto mb-10">
                {/* Outermost pulsing ring */}
                <motion.div
                  className="absolute -inset-4 rounded-full border border-familia-500/10"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                />
                {/* Outer ring */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-familia-500/15 to-bond-500/15 border border-familia-500/20 shadow-[0_0_60px_rgba(139,92,246,0.08)]"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                />
                {/* Inner ring */}
                <motion.div
                  className="absolute inset-4 sm:inset-5 rounded-full bg-gradient-to-br from-familia-500/10 to-bond-500/10 border border-familia-500/10"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5, delay: 0.4, ease: 'easeInOut' }}
                />
                {/* Innermost glow */}
                <motion.div
                  className="absolute inset-10 sm:inset-12 rounded-full bg-gradient-to-br from-familia-500/5 to-heart-500/5"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                />
                {/* Globe */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-6xl sm:text-7xl drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                  >
                    🌍
                  </motion.div>
                </div>

                {/* Orbiting role emojis */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={angle}
                    className="absolute text-xl sm:text-2xl drop-shadow-lg"
                    style={{
                      left: '50%', top: '50%',
                    }}
                    animate={{
                      x: [Math.cos((angle + 0) * Math.PI / 180) * 110 - 12,
                          Math.cos((angle + 360) * Math.PI / 180) * 110 - 12],
                      y: [Math.sin((angle + 0) * Math.PI / 180) * 110 - 12,
                          Math.sin((angle + 360) * Math.PI / 180) * 110 - 12],
                      opacity: [0.7, 1, 0.7],
                    }}
                    transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  >
                    {['👩', '👨', '👧', '👦', '🧑‍🏫', '🤝'][i]}
                  </motion.div>
                ))}
              </div>

              <motion.h2
                className="text-2xl sm:text-3xl font-bold mb-2 tracking-tight"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                Searching the globe
                <motion.span
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >...</motion.span>
              </motion.h2>
              <p className="text-white/50 mb-3 text-sm sm:text-base">
                Finding you the perfect <span className="text-familia-400 font-medium">{partnerRole}</span> from another culture
              </p>
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/40"
                animate={{ borderColor: ['rgba(255,255,255,0.1)', 'rgba(139,92,246,0.2)', 'rgba(255,255,255,0.1)'] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <Loader2 className="w-3 h-3 animate-spin" />
                {searchTime}s elapsed
              </motion.div>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2 text-xs text-white/30 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                  <Shield className="w-3.5 h-3.5 text-green-400/60" /> Only verified humans
                </div>
                <div className="flex items-center gap-2 text-xs text-white/30 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5">
                  <Sparkles className="w-3.5 h-3.5 text-familia-400/60" /> AI-powered matching
                </div>
              </div>

              <button
                onClick={() => { setStep('select-partner-role'); setSearchTime(0); }}
                className="mt-8 text-sm text-white/30 hover:text-white/50 transition"
              >
                Cancel search
              </button>
            </motion.div>
          )}

          {/* ── Step 4: Match Found ────────────── */}
          {step === 'found' && (
            <motion.div
              key="found"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              {/* Celebration burst */}
              <div className="relative inline-block mb-6">
                <motion.div
                  className="absolute -inset-8 sm:-inset-12 rounded-full bg-gradient-to-br from-familia-500/20 via-heart-500/10 to-bond-500/20 blur-2xl"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: [0, 0.8, 0.4], scale: [0, 1.5, 1] }}
                  transition={{ duration: 1.2 }}
                />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: [0, 1.5, 1], rotate: [-180, 20, 0] }}
                  transition={{ duration: 1, type: 'spring', bounce: 0.5 }}
                  className="text-6xl sm:text-7xl relative"
                >
                  ✨
                </motion.div>
              </div>

              <motion.h2
                className="text-3xl sm:text-4xl font-bold mb-3 gradient-text tracking-tight"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Match Found!
              </motion.h2>
              <motion.p
                className="text-white/50 mb-8 sm:mb-10 text-sm sm:text-base"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                The universe connected you across borders ✦
              </motion.p>

              {/* Match card */}
              <motion.div
                className="glass-card max-w-md mx-auto relative overflow-hidden"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-familia-500/5 to-heart-500/5" />
                <div className="relative z-10">
                  {/* Role pairing */}
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-3xl mx-auto mb-1">
                        {ROLE_EMOJIS[myRole]}
                      </div>
                      <div className="text-xs text-white/40">You ({myRole})</div>
                    </div>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Heart className="w-8 h-8 text-heart-400" />
                    </motion.div>
                    <div className="text-center">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl mx-auto mb-1">
                        {ROLE_EMOJIS[partnerRole]}
                      </div>
                      <div className="text-xs text-white/40">{MOCK_MATCH.display_name}</div>
                    </div>
                  </div>

                  {/* Partner info */}
                  <div className="space-y-3 text-left">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-lg">{MOCK_MATCH.display_name}</span>
                      <span className="badge-verified text-xs">✅ Verified</span>
                    </div>
                    <div className="text-sm text-white/40">🇧🇷 {MOCK_MATCH.country}</div>
                    <div className="text-sm text-white/60">{MOCK_MATCH.bio}</div>

                    <div className="flex flex-wrap gap-2">
                      {MOCK_MATCH.languages.map(lang => (
                        <span key={lang} className="text-xs px-2 py-1 rounded-full bg-familia-500/10 text-familia-300 border border-familia-500/20">
                          🌐 {lang}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/5">
                      <motion.div
                        className="text-center p-3 rounded-xl bg-familia-500/[0.08] border border-familia-500/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <div className="text-xl sm:text-2xl font-bold text-familia-400">{MOCK_MATCH.care_score}</div>
                        <div className="text-[10px] sm:text-xs text-white/40 mt-0.5">Care Score</div>
                      </motion.div>
                      <motion.div
                        className="text-center p-3 rounded-xl bg-green-500/[0.08] border border-green-500/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        <div className="text-xl sm:text-2xl font-bold text-green-400">A+</div>
                        <div className="text-[10px] sm:text-xs text-white/40 mt-0.5">Reliability</div>
                      </motion.div>
                      <motion.div
                        className="text-center p-3 rounded-xl bg-amber-500/[0.08] border border-amber-500/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.9 }}
                      >
                        <div className="text-xl sm:text-2xl font-bold text-amber-400">95%</div>
                        <div className="text-[10px] sm:text-xs text-white/40 mt-0.5">Compatibility</div>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Actions */}
              <motion.div
                className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-8 sm:mt-10"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
              >
                <Link href="/chat/rel-1">
                  <motion.button
                    className="btn-primary flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 text-base shadow-lg shadow-familia-500/20"
                    whileHover={{ scale: 1.05, boxShadow: '0 10px 40px rgba(139,92,246,0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Heart className="w-4 h-4" />
                    Accept & Start Bonding
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </motion.button>
                </Link>
                <button
                  onClick={() => { setStep('searching'); setSearchTime(0); }}
                  className="px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 hover:bg-white/[0.03] transition-all duration-300 text-sm"
                >
                  Search again
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
