'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  ArrowLeft, Globe, Heart, Search, Sparkles, Users, Star, Shield,
  ChevronRight, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_EMOJIS } from '@/types';
import toast from 'react-hot-toast';

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

type MatchState = 'select-role' | 'select-partner-role' | 'searching' | 'found' | 'not-found';

interface MatchResult {
  relationship: any;
  partner: any;
  match_score: number;
}

export default function MatchingPage() {
  const { user, refreshRelationships } = useAuth();
  const [step, setStep] = useState<MatchState>('select-role');
  const [myRole, setMyRole] = useState('');
  const [partnerRole, setPartnerRole] = useState('');
  const [searchTime, setSearchTime] = useState(0);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'searching') {
      timer = setInterval(() => setSearchTime(t => t + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  const startSearch = async () => {
    if (!user) {
      toast.error('Please log in to find a match');
      return;
    }

    setStep('searching');
    setIsSearching(true);
    setSearchTime(0);

    try {
      const result = await api.searchMatch({
        seeking_role: partnerRole,
        offering_role: myRole,
        preferred_age_min: 18,
        preferred_age_max: 100,
        preferred_countries: [],
        language_priority: 'ease',
      });

      if (result.status === 'matched') {
        setMatchResult({
          relationship: result.relationship,
          partner: result.partner,
          match_score: result.match_score,
        });
        setStep('found');
        await refreshRelationships();
      } else {
        // Keep polling for a match
        let attempts = 0;
        const pollForMatch = async () => {
          if (attempts >= 10) {
            setStep('not-found');
            return;
          }
          
          attempts++;
          await new Promise(r => setTimeout(r, 2000));
          
          const queueResult = await api.checkQueue(user.id);
          if (queueResult.status === 'not_in_queue') {
            // Match found via background process
            await refreshRelationships();
            setStep('not-found'); // No match available now, user can try again
          } else {
            // Keep waiting
            await pollForMatch();
          }
        };
        
        await pollForMatch();
      }
    } catch (err: any) {
      console.error('Matching error:', err);
      toast.error(err.message || 'Failed to find match');
      setStep('select-partner-role');
    } finally {
      setIsSearching(false);
    }
  };

  const cancelSearch = async () => {
    if (user) {
      try {
        await api.cancelMatching(user.id);
      } catch (e) {
        // Ignore
      }
    }
    setStep('select-partner-role');
    setSearchTime(0);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card max-w-md">
          <Search className="w-12 h-12 mx-auto mb-4 text-familia-400" />
          <h2 className="text-xl font-bold mb-2">Find Your Match</h2>
          <p className="text-muted mb-6">Please log in to find your global family</p>
          <Link href="/login"><button className="btn-primary w-full">Log In</button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="sticky top-0 glass border-b border-themed z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard">
            <motion.button className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition" whileTap={{ scale: 0.95 }}>
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
        <div className="flex items-center justify-center gap-2 mb-8">
          {(['Your Role', 'Partner', 'Searching', 'Matched'] as const).map((label, i) => {
            const stepNum = step === 'select-role' ? 1 : step === 'select-partner-role' ? 2 : step === 'searching' ? 3 : 4;
            return (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 transition ${i + 1 <= stepNum ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    i + 1 < stepNum ? 'bg-familia-500 text-white' :
                    i + 1 === stepNum ? 'bg-gradient-to-r from-familia-500 to-bond-500 text-white' :
                    'border border-themed text-muted'
                  }`}>
                    {i + 1 < stepNum ? '✓' : i + 1}
                  </div>
                  <span className="text-xs hidden sm:inline">{label}</span>
                </div>
                {i < 3 && <div className={`w-8 h-px ${i + 1 < stepNum ? 'bg-familia-500' : 'bg-[var(--bg-card-hover)]'}`} />}
              </div>
            );
          })}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Your Role */}
          {step === 'select-role' && (
            <motion.div key="select-role" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🌍</div>
                <h2 className="text-2xl font-bold mb-2">Who do you want to be?</h2>
                <p className="text-muted">Choose the role you want to play in this cross-cultural bond</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ROLES.map((role, index) => (
                  <motion.button
                    key={role.id}
                    onClick={() => { setMyRole(role.id); setStep('select-partner-role'); }}
                    className="glass-card !p-4 text-center card-hover group"
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl group-hover:scale-110 transition`}>
                      {role.emoji}
                    </div>
                    <div className="font-semibold text-sm mb-1">{role.label}</div>
                    <div className="text-[10px] text-muted">{role.desc}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Select Partner Role */}
          {step === 'select-partner-role' && (
            <motion.div key="select-partner" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="text-4xl">{ROLE_EMOJIS[myRole]}</div>
                  <Heart className="w-6 h-6 text-heart-400" />
                  <div className="text-4xl">❓</div>
                </div>
                <h2 className="text-2xl font-bold mb-2">Who are you looking for?</h2>
                <p className="text-muted">
                  As a <span className="text-familia-400 font-medium">{myRole}</span>, who would complete your family?
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {ROLES.filter(r => r.id !== myRole).map((role, index) => (
                  <motion.button
                    key={role.id}
                    onClick={() => { setPartnerRole(role.id); startSearch(); }}
                    className="glass-card !p-4 text-center card-hover group"
                    whileTap={{ scale: 0.97 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                  >
                    <div className={`w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br ${role.color} flex items-center justify-center text-2xl group-hover:scale-110 transition`}>
                      {role.emoji}
                    </div>
                    <div className="font-semibold text-sm mb-1">{role.label}</div>
                    <div className="text-[10px] text-muted">{role.desc}</div>
                  </motion.button>
                ))}
              </div>

              <button onClick={() => { setMyRole(''); setStep('select-role'); }} className="mt-6 text-sm text-muted hover:text-[var(--text-primary)] transition mx-auto block">
                ← Change my role
              </button>
            </motion.div>
          )}

          {/* Step 3: Searching */}
          {step === 'searching' && (
            <motion.div key="searching" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <div className="relative w-56 h-56 mx-auto mb-10">
                <motion.div
                  className="absolute inset-0 rounded-full bg-gradient-to-br from-familia-500/15 to-bond-500/15 border border-familia-500/20"
                  animate={{ scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 2.5 }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    className="text-6xl"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                  >
                    🌍
                  </motion.div>
                </div>
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                  <motion.div
                    key={angle}
                    className="absolute text-xl"
                    style={{ left: '50%', top: '50%' }}
                    animate={{
                      x: [Math.cos((angle) * Math.PI / 180) * 100 - 12, Math.cos((angle + 360) * Math.PI / 180) * 100 - 12],
                      y: [Math.sin((angle) * Math.PI / 180) * 100 - 12, Math.sin((angle + 360) * Math.PI / 180) * 100 - 12],
                    }}
                    transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  >
                    {['👩', '👨', '👧', '👦', '🧑‍🏫', '🤝'][i]}
                  </motion.div>
                ))}
              </div>

              <h2 className="text-2xl font-bold mb-2">Searching the globe...</h2>
              <p className="text-muted mb-3">
                Finding you the perfect <span className="text-familia-400 font-medium">{partnerRole}</span>
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-card)] border border-themed text-sm text-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                {searchTime}s elapsed
              </div>

              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-xs text-muted px-3 py-1.5 rounded-full bg-[var(--bg-card)]">
                  <Shield className="w-3.5 h-3.5 text-green-400" /> Only verified humans
                </div>
                <div className="flex items-center gap-2 text-xs text-muted px-3 py-1.5 rounded-full bg-[var(--bg-card)]">
                  <Sparkles className="w-3.5 h-3.5 text-familia-400" /> AI-powered matching
                </div>
              </div>

              <button onClick={cancelSearch} className="mt-8 text-sm text-muted hover:text-[var(--text-primary)] transition">
                Cancel search
              </button>
            </motion.div>
          )}

          {/* Step 4: Match Found */}
          {step === 'found' && matchResult && (
            <motion.div key="found" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
              <div className="relative inline-block mb-6">
                <motion.div
                  className="absolute -inset-8 rounded-full bg-gradient-to-br from-familia-500/20 to-heart-500/20 blur-2xl"
                  animate={{ opacity: [0, 0.8, 0.4], scale: [0, 1.5, 1] }}
                  transition={{ duration: 1.2 }}
                />
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: [0, 1.5, 1], rotate: [-180, 20, 0] }}
                  transition={{ duration: 1, type: 'spring' }}
                  className="text-6xl relative"
                >
                  ✨
                </motion.div>
              </div>

              <h2 className="text-3xl font-bold mb-3 gradient-text">Match Found!</h2>
              <p className="text-muted mb-8">The universe connected you across borders ✦</p>

              <div className="glass-card max-w-md mx-auto">
                <div className="flex items-center justify-center gap-4 mb-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-3xl mx-auto mb-1">
                      {ROLE_EMOJIS[myRole]}
                    </div>
                    <div className="text-xs text-muted">You ({myRole})</div>
                  </div>
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Heart className="w-8 h-8 text-heart-400" />
                  </motion.div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-3xl mx-auto mb-1">
                      {ROLE_EMOJIS[partnerRole]}
                    </div>
                    <div className="text-xs text-muted">{matchResult.partner?.display_name}</div>
                  </div>
                </div>

                <div className="space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-lg">{matchResult.partner?.display_name || 'New Match'}</span>
                    {matchResult.partner?.is_verified && <span className="badge-verified text-xs">✅ Verified</span>}
                  </div>
                  <div className="text-sm text-muted">{matchResult.partner?.country}</div>
                  <div className="text-sm">{matchResult.partner?.bio || 'Excited to connect!'}</div>

                  <div className="grid grid-cols-3 gap-3 pt-4 border-t border-themed">
                    <div className="text-center p-3 rounded-xl bg-familia-500/10">
                      <div className="text-xl font-bold text-familia-400">{matchResult.partner?.care_score || 50}</div>
                      <div className="text-xs text-muted">Care Score</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-green-500/10">
                      <div className="text-xl font-bold text-green-400">A+</div>
                      <div className="text-xs text-muted">Reliability</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-amber-500/10">
                      <div className="text-xl font-bold text-amber-400">{Math.round(matchResult.match_score)}%</div>
                      <div className="text-xs text-muted">Match</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                <Link href={`/chat/${matchResult.relationship?.id}`}>
                  <motion.button className="btn-primary flex items-center gap-2 px-8 py-3" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Heart className="w-4 h-4" />
                    Start Bonding
                    <ChevronRight className="w-4 h-4" />
                  </motion.button>
                </Link>
                <button onClick={() => { setStep('select-role'); setMatchResult(null); }} className="px-5 py-3 rounded-xl border border-themed text-muted hover:text-[var(--text-primary)] transition text-sm">
                  Search again
                </button>
              </div>
            </motion.div>
          )}

          {/* Not Found State */}
          {step === 'not-found' && (
            <motion.div key="not-found" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <div className="text-6xl mb-6">🌏</div>
              <h2 className="text-2xl font-bold mb-3">No Matches Right Now</h2>
              <p className="text-muted mb-6 max-w-md mx-auto">
                We couldn't find a perfect match at this moment, but don't worry! 
                More people are joining every minute. Try again or wait for someone to find you.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button onClick={() => startSearch()} className="btn-primary flex items-center gap-2 px-6 py-3">
                  <Search className="w-4 h-4" />
                  Try Again
                </button>
                <Link href="/dashboard">
                  <button className="px-5 py-3 rounded-xl border border-themed text-muted hover:text-[var(--text-primary)] transition text-sm">
                    Back to Dashboard
                  </button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
