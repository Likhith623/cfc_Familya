'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Gamepad2, Trophy, Star, Heart, Users, Clock,
  Sparkles, Play, Zap, ChevronRight, RotateCcw
} from 'lucide-react';

const GAMES = [
  {
    id: 'mood-mirror', emoji: '🪞', name: 'Mood Mirror', category: 'Empathy',
    desc: "Guess your partner's current mood from clues", bond_points: 5,
    color: 'from-pink-500 to-rose-500', players: '2 Players', time: '3-5 min',
  },
  {
    id: 'emotion-charades', emoji: '🎭', name: 'Emotion Charades', category: 'Expression',
    desc: 'Act out emotions across cultures', bond_points: 10,
    color: 'from-purple-500 to-violet-500', players: '2 Players', time: '5-10 min',
  },
  {
    id: 'cultural-trivia', emoji: '🧠', name: 'Cultural Trivia', category: 'Knowledge',
    desc: 'Test your knowledge of each other\'s cultures', bond_points: 8,
    color: 'from-blue-500 to-indigo-500', players: '2 Players', time: '5 min',
  },
  {
    id: 'would-you-rather', emoji: '🤔', name: 'Would You Rather', category: 'Fun',
    desc: 'Cross-cultural dilemma questions', bond_points: 5,
    color: 'from-amber-500 to-orange-500', players: '2+ Players', time: '3-5 min',
  },
  {
    id: 'story-builder', emoji: '📖', name: 'Story Builder', category: 'Creativity',
    desc: 'Build a story together, one sentence at a time', bond_points: 15,
    color: 'from-green-500 to-emerald-500', players: '2+ Players', time: '10-15 min',
  },
  {
    id: 'recipe-swap', emoji: '🍳', name: 'Recipe Swap', category: 'Culture',
    desc: 'Share and compare traditional recipes', bond_points: 12,
    color: 'from-red-500 to-orange-500', players: '2 Players', time: '10 min',
  },
  {
    id: 'word-exchange', emoji: '📝', name: 'Word Exchange', category: 'Language',
    desc: 'Teach each other words in your languages', bond_points: 8,
    color: 'from-familia-500 to-bond-500', players: '2 Players', time: '5 min',
  },
  {
    id: 'gratitude-chain', emoji: '🙏', name: 'Gratitude Chain', category: 'Bonding',
    desc: 'Take turns sharing what you appreciate about each other', bond_points: 20,
    color: 'from-heart-500 to-pink-500', players: '2 Players', time: '5-10 min',
  },
];

// Simple "Would You Rather" demo game
const WYR_QUESTIONS = [
  { a: 'Live in Brazil for a year 🇧🇷', b: 'Live in Japan for a year 🇯🇵' },
  { a: 'Learn 5 languages at basic level', b: 'Master 1 foreign language perfectly' },
  { a: 'Cook a traditional meal from another culture', b: 'Teach someone your family recipe' },
  { a: 'Have a pen pal in every continent', b: 'Have one lifelong cross-cultural best friend' },
  { a: 'Celebrate Holi in India 🎨', b: 'Celebrate Carnival in Brazil 🎉' },
];

type GameState = 'catalog' | 'playing' | 'results';

export default function GamesPage() {
  const [state, setState] = useState<GameState>('catalog');
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [myChoices, setMyChoices] = useState<string[]>([]);
  const [partnerChoices, setPartnerChoices] = useState<string[]>([]);
  const [showPartnerChoice, setShowPartnerChoice] = useState(false);

  const startGame = (gameId: string) => {
    setSelectedGame(gameId);
    setState('playing');
    setCurrentQ(0);
    setMyChoices([]);
    setPartnerChoices([]);
  };

  const handleChoice = (choice: 'a' | 'b') => {
    setMyChoices([...myChoices, choice]);
    setShowPartnerChoice(true);

    // Simulate partner choice
    const partnerChoice = Math.random() > 0.5 ? 'a' : 'b';
    setPartnerChoices([...partnerChoices, partnerChoice]);

    setTimeout(() => {
      setShowPartnerChoice(false);
      if (currentQ < WYR_QUESTIONS.length - 1) {
        setCurrentQ(currentQ + 1);
      } else {
        setState('results');
      }
    }, 2000);
  };

  const matchCount = myChoices.filter((c, i) => c === partnerChoices[i]).length;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 glass border-b border-white/5 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/dashboard">
            <motion.button className="p-2 rounded-lg hover:bg-white/5 transition" whileTap={{ scale: 0.95 }}>
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
          </Link>
          <h1 className="font-bold text-lg flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-purple-400" />
            Bonding Games
          </h1>
          {state === 'catalog' && (
            <div className="ml-auto flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-full ring-1 ring-amber-500/20">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-amber-400">83 pts</span>
            </div>
          )}
          {state === 'playing' && (
            <motion.button
              onClick={() => { setState('catalog'); setSelectedGame(null); setCurrentQ(0); setMyChoices([]); setPartnerChoices([]); setShowPartnerChoice(false); }}
              className="ml-auto text-xs text-white/40 hover:text-white/60 transition flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full hover:bg-white/10"
              whileTap={{ scale: 0.95 }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Exit Game
            </motion.button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ── Game Catalog ─────────────────── */}
          {state === 'catalog' && (
            <motion.div key="catalog" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <motion.h2 className="text-2xl font-bold mb-2" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  Play & Bond Together <span className="inline-block animate-bounce">🎮</span>
                </motion.h2>
                <p className="text-white/40 text-sm">Games designed to deepen your cross-cultural connection</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {GAMES.map((game, i) => (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div
                      className="rounded-2xl p-[1px] bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:from-purple-500/30 hover:to-pink-500/20 transition-all duration-300 cursor-pointer group"
                      onClick={() => startGame(game.id)}
                    >
                      <div className="glass-card !rounded-[15px] relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${game.color} opacity-40 group-hover:opacity-100 transition-opacity`} />
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 group-hover:shadow-lg transition-all duration-200`}>
                          {game.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold group-hover:text-white transition-colors">{game.name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-white/30 group-hover:bg-purple-500/10 group-hover:text-purple-300 transition-colors">
                              {game.category}
                            </span>
                          </div>
                          <p className="text-xs text-white/40 mb-2">{game.desc}</p>
                          <div className="flex items-center gap-3 text-[10px] text-white/25">
                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {game.players}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {game.time}</span>
                            <span className="flex items-center gap-1 text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-full font-medium"><Star className="w-3 h-3" /> +{game.bond_points} pts</span>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                      </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Playing (Would You Rather demo) ── */}
          {state === 'playing' && (
            <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="text-center mb-8">
                <motion.div className="text-5xl mb-3" animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>🤔</motion.div>
                <h2 className="text-2xl font-bold mb-1 gradient-text">Would You Rather</h2>
                <p className="text-sm text-white/40">Question {currentQ + 1} of {WYR_QUESTIONS.length}</p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-2 mb-8 max-w-md mx-auto">
                {WYR_QUESTIONS.map((_, i) => (
                  <motion.div
                    key={i}
                    className={`flex-1 h-2 rounded-full transition-all ${
                      i < currentQ ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                      i === currentQ ? 'bg-purple-400 shadow-[0_0_8px_rgba(168,85,247,0.5)]' :
                      'bg-white/10'
                    }`}
                    initial={i === currentQ ? { scale: 0.8 } : {}}
                    animate={i === currentQ ? { scale: 1 } : {}}
                  />
                ))}
              </div>

              {/* Question */}
              <div className="max-w-lg mx-auto px-2 sm:px-0">
                <motion.div
                  key={`q-${currentQ}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <motion.button
                    onClick={() => !showPartnerChoice && handleChoice('a')}
                    disabled={showPartnerChoice}
                    className={`w-full p-8 sm:p-10 rounded-2xl text-center transition-all duration-300 border-2 relative overflow-hidden ${
                      showPartnerChoice && myChoices[currentQ] === 'a'
                        ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]'
                    }`}
                    whileHover={!showPartnerChoice ? { scale: 1.03, y: -2 } : {}}
                    whileTap={!showPartnerChoice ? { scale: 0.97 } : {}}
                  >
                    {showPartnerChoice && myChoices[currentQ] === 'a' && <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />}
                    <div className="relative z-10">
                      <div className="text-lg sm:text-xl font-semibold">{WYR_QUESTIONS[currentQ].a}</div>
                      {showPartnerChoice && partnerChoices[currentQ] === 'a' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full"
                        >
                          ✨ Maria also chose this! 🎉
                        </motion.div>
                      )}
                      {showPartnerChoice && partnerChoices[currentQ] !== 'a' && myChoices[currentQ] === 'a' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-white/30">Your choice</motion.div>
                      )}
                    </div>
                  </motion.button>

                  <div className="text-center">
                    <span className="text-white/20 font-bold text-sm bg-white/5 px-4 py-1.5 rounded-full">OR</span>
                  </div>

                  <motion.button
                    onClick={() => !showPartnerChoice && handleChoice('b')}
                    disabled={showPartnerChoice}
                    className={`w-full p-8 sm:p-10 rounded-2xl text-center transition-all duration-300 border-2 relative overflow-hidden ${
                      showPartnerChoice && myChoices[currentQ] === 'b'
                        ? 'border-purple-500/60 bg-purple-500/10 shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]'
                        : 'border-white/5 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/5 hover:shadow-[0_0_20px_-5px_rgba(168,85,247,0.2)]'
                    }`}
                    whileHover={!showPartnerChoice ? { scale: 1.03, y: -2 } : {}}
                    whileTap={!showPartnerChoice ? { scale: 0.97 } : {}}
                  >
                    {showPartnerChoice && myChoices[currentQ] === 'b' && <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />}
                    <div className="relative z-10">
                      <div className="text-lg sm:text-xl font-semibold">{WYR_QUESTIONS[currentQ].b}</div>
                      {showPartnerChoice && partnerChoices[currentQ] === 'b' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 inline-flex items-center gap-1.5 text-sm text-green-400 bg-green-500/10 px-3 py-1 rounded-full"
                        >
                          ✨ Maria also chose this! 🎉
                        </motion.div>
                      )}
                      {showPartnerChoice && partnerChoices[currentQ] !== 'b' && myChoices[currentQ] === 'b' && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 text-xs text-white/30">Your choice</motion.div>
                      )}
                    </div>
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ── Results ──────────────────────── */}
          {state === 'results' && (
            <motion.div
              key="results"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                className="text-7xl mb-6"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.4, 1], rotate: 0 }}
                transition={{ type: 'spring', duration: 1 }}
              >
                {matchCount >= 4 ? '🎉' : matchCount >= 3 ? '😄' : '🤝'}
              </motion.div>

              <motion.h2 className="text-3xl font-bold mb-2 gradient-text" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                {matchCount >= 4 ? 'You think alike!' : matchCount >= 3 ? 'Great connection!' : 'Interesting differences!'}
              </motion.h2>
              <motion.p className="text-white/40 mb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
                You and Maria matched on {matchCount} out of {WYR_QUESTIONS.length} questions
              </motion.p>

              <div className="relative max-w-sm mx-auto mb-8 rounded-2xl p-[1px] bg-gradient-to-br from-purple-500/40 via-pink-500/20 to-amber-500/40">
                <div className="glass-card !rounded-[15px]">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 }}>
                    <div className="text-3xl font-bold text-purple-400">{matchCount}/{WYR_QUESTIONS.length}</div>
                    <div className="text-xs text-white/30 mt-1">Matches</div>
                  </motion.div>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.5 }}>
                    <div className="text-3xl font-bold text-amber-400">+8</div>
                    <div className="text-xs text-white/30 mt-1">Bond Points</div>
                  </motion.div>
                </div>

                {/* Comparison */}
                <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                  {WYR_QUESTIONS.map((q, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        myChoices[i] === partnerChoices[i] ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white/20'
                      }`}>
                        {myChoices[i] === partnerChoices[i] ? '✓' : '✗'}
                      </span>
                      <span className="text-white/40 truncate flex-1">Q{i + 1}</span>
                      <span className="text-familia-400">{myChoices[i] === 'a' ? 'A' : 'B'}</span>
                      <span className="text-white/20">vs</span>
                      <span className="text-green-400">{partnerChoices[i] === 'a' ? 'A' : 'B'}</span>
                    </div>
                  ))}
                </div>
                </div>
              </div>

              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => { setState('catalog'); setSelectedGame(null); }}
                  className="btn-primary flex items-center gap-2"
                >
                  <Gamepad2 className="w-4 h-4" /> More Games
                </button>
                <Link href="/chat/rel-1">
                  <motion.button className="px-5 py-3 rounded-xl border border-white/10 text-white/40 hover:text-white/60 hover:border-white/20 transition text-sm flex items-center gap-2" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    💬 Back to Chat
                  </motion.button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
