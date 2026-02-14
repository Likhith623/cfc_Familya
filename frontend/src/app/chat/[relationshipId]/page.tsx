'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Send, Globe, Heart, Smile, Gamepad2, Trophy, Info,
  Volume2, Languages, Sparkles, Star, Flame, ChevronDown, MoreVertical,
  Shield, Clock, Gift
} from 'lucide-react';
import { ROLE_EMOJIS, LEVEL_NAMES, LEVEL_FEATURES } from '@/types';

// ── Mock conversation data ─────────────────────
const MOCK_PARTNER = {
  display_name: 'Maria Santos',
  country: 'Brazil',
  status: 'active',
  care_score: 78,
  languages: ['pt', 'en'],
};

const INITIAL_MESSAGES = [
  {
    id: 'm1', sender_id: 'partner', content: 'Bom dia, meu filho! Como você está hoje?',
    translated_content: 'Good morning, my son! How are you today?',
    original_language: 'pt', is_translated: true, cultural_note: '"Meu filho" (my son) - a warm term of endearment used by Brazilian mothers',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'm2', sender_id: 'me', content: 'Good morning, Mãe! I\'m doing great. Just had chai.',
    translated_content: 'Bom dia, Mãe! Estou ótimo. Acabei de tomar chai.',
    original_language: 'en', is_translated: false, cultural_note: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: 'm3', sender_id: 'partner', content: 'Que bom! Aqui estou fazendo pão de queijo 🧀',
    translated_content: 'That\'s great! Here I\'m making cheese bread 🧀',
    original_language: 'pt', is_translated: true, cultural_note: 'Pão de queijo is a beloved Brazilian cheese bread made with cassava flour, often eaten for breakfast',
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
  {
    id: 'm4', sender_id: 'me', content: 'That sounds delicious! We have something similar called naan with cheese 🫓',
    translated_content: 'Isso parece delicioso! Temos algo parecido chamado naan com queijo 🫓',
    original_language: 'en', is_translated: false, cultural_note: null,
    created_at: new Date(Date.now() - 900000).toISOString(),
  },
  {
    id: 'm5', sender_id: 'partner', content: 'Seria incrível provar naan! Um dia vou aprender a fazer. Você pode me ensinar? 💕',
    translated_content: 'It would be amazing to try naan! One day I will learn to make it. Can you teach me? 💕',
    original_language: 'pt', is_translated: true, cultural_note: null,
    created_at: new Date(Date.now() - 300000).toISOString(),
  },
];

const RELATIONSHIP = {
  id: 'rel-1', my_role: 'son', partner_role: 'mother', level: 3,
  bond_points: 145, care_score: 78, streak_days: 12,
  messages_exchanged: 234, created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
};

export default function ChatPage({ params }: { params: { relationshipId: string } }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [showCulturalNote, setShowCulturalNote] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMsg = {
      id: `m${Date.now()}`,
      sender_id: 'me',
      content: input,
      translated_content: `[Tradução: ${input}]`,
      original_language: 'en',
      is_translated: false,
      cultural_note: null,
      created_at: new Date().toISOString(),
    };

    setMessages([...messages, newMsg]);
    setInput('');

    // Simulate partner typing & reply
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replies = [
        { content: 'Que legal! Eu adoraria isso! 😊', translated: 'How cool! I would love that! 😊', note: null },
        { content: 'Saudades de conversar com você, meu filho 💕', translated: 'I miss talking to you, my son 💕', note: '"Saudades" is a uniquely Portuguese word expressing deep longing and nostalgia that has no perfect English translation' },
        { content: 'Vamos fazer uma videochamada logo! Quero te mostrar o jardim novo 🌺', translated: 'Let\'s video call soon! I want to show you the new garden 🌺', note: null },
      ];
      const reply = replies[Math.floor(Math.random() * replies.length)];

      setMessages(prev => [...prev, {
        id: `m${Date.now()}`,
        sender_id: 'partner',
        content: reply.content,
        translated_content: reply.translated,
        original_language: 'pt',
        is_translated: true,
        cultural_note: reply.note,
        created_at: new Date().toISOString(),
      }]);
    }, 2000 + Math.random() * 2000);
  };

  const toggleTranslation = (msgId: string) => {
    setShowTranslation(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* ── Chat Header ────────────────── */}
      <div className="glass border-b border-white/5 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <motion.button className="p-2 rounded-lg hover:bg-white/5 transition" whileTap={{ scale: 0.95 }}>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-xl">
                {ROLE_EMOJIS[RELATIONSHIP.partner_role]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-[#1A1A2E]" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{MOCK_PARTNER.display_name}</span>
                <span className="text-xs text-white/30">🇧🇷</span>
                <span className="badge-verified text-[9px]">✅</span>
              </div>
              <div className="text-xs text-white/40 flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  Online
                </span>
                <span>•</span>
                <span>Your {RELATIONSHIP.partner_role}</span>
                <span>•</span>
                <span className="badge-level !text-[9px]">
                  Lv.{RELATIONSHIP.level} {LEVEL_NAMES[RELATIONSHIP.level]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-lg hover:bg-white/5 transition text-white/50 hover:text-white"
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowInfo(!showInfo)}
            >
              <Info className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Bond info panel */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-white/5"
            >
              <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-familia-400">{RELATIONSHIP.care_score}</div>
                  <div className="text-[10px] text-white/30">Care Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-bond-400">{RELATIONSHIP.bond_points}</div>
                  <div className="text-[10px] text-white/30">Bond Points</div>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="text-lg font-bold text-orange-400">{RELATIONSHIP.streak_days}</div>
                    <div className="text-[10px] text-white/30">Day Streak</div>
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-white/60">{RELATIONSHIP.messages_exchanged}</div>
                  <div className="text-[10px] text-white/30">Messages</div>
                </div>
              </div>

              {/* Level Features */}
              <div className="max-w-4xl mx-auto px-4 pb-3">
                <div className="text-xs text-white/30 mb-2">Unlocked at Level {RELATIONSHIP.level}:</div>
                <div className="flex flex-wrap gap-2">
                  {LEVEL_FEATURES[RELATIONSHIP.level]?.map((feature: string) => (
                    <span key={feature} className="text-[10px] px-2 py-1 rounded-full bg-familia-500/10 text-familia-300 border border-familia-500/20">
                      ✨ {feature}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Messages Area ──────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Relationship start badge */}
        <div className="text-center py-4">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 text-xs text-white/30"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Heart className="w-3 h-3 text-heart-400" />
            <span>Bond started 30 days ago • You chose {ROLE_EMOJIS[RELATIONSHIP.my_role]} {RELATIONSHIP.my_role} & {ROLE_EMOJIS[RELATIONSHIP.partner_role]} {RELATIONSHIP.partner_role}</span>
          </motion.div>
        </div>

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === 'me';
          const showTrans = showTranslation[msg.id];

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[60%]`}>
                <div className={`rounded-2xl p-3 ${
                  isMe
                    ? 'message-sent rounded-br-md'
                    : 'message-received rounded-bl-md'
                }`}>
                  {/* Original text */}
                  <p className="text-sm leading-relaxed">{msg.content}</p>

                  {/* Translation toggle */}
                  {msg.is_translated && (
                    <button
                      onClick={() => toggleTranslation(msg.id)}
                      className="flex items-center gap-1 mt-2 text-[10px] text-familia-400/60 hover:text-familia-400 transition"
                    >
                      <Languages className="w-3 h-3" />
                      {showTrans ? 'Hide translation' : 'Show translation'}
                    </button>
                  )}

                  {/* Translated text */}
                  <AnimatePresence>
                    {showTrans && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-white/5"
                      >
                        <p className="text-sm text-white/50 italic">{msg.translated_content}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cultural note */}
                  {msg.cultural_note && (
                    <button
                      onClick={() => setShowCulturalNote(showCulturalNote === msg.id ? null : msg.id)}
                      className="flex items-center gap-1 mt-1 text-[10px] text-amber-400/60 hover:text-amber-400 transition"
                    >
                      <Sparkles className="w-3 h-3" />
                      Cultural note
                    </button>
                  )}
                </div>

                {/* Cultural note popup */}
                <AnimatePresence>
                  {showCulturalNote === msg.id && msg.cultural_note && (
                    <motion.div
                      initial={{ opacity: 0, y: -5, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.95 }}
                      className="mt-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/70 leading-relaxed"
                    >
                      <div className="flex items-center gap-1 font-semibold text-amber-300 mb-1">
                        <Sparkles className="w-3 h-3" />
                        Cultural Note
                      </div>
                      {msg.cultural_note}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Timestamp */}
                <div className={`text-[10px] text-white/20 mt-1 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                  {formatTime(msg.created_at)}
                  {msg.is_translated && !isMe && (
                    <span className="ml-1">• 🌐 Translated from PT</span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center gap-2"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-sm">
                {ROLE_EMOJIS[RELATIONSHIP.partner_role]}
              </div>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* ── Actions Bar ────────────────── */}
      <div className="border-t border-white/5 glass">
        {/* Quick actions */}
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <Link href="/contests">
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs whitespace-nowrap hover:bg-amber-500/20 transition"
              whileTap={{ scale: 0.95 }}
            >
              <Trophy className="w-3 h-3" /> Challenge
            </motion.button>
          </Link>
          <Link href="/games">
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400 text-xs whitespace-nowrap hover:bg-purple-500/20 transition"
              whileTap={{ scale: 0.95 }}
            >
              <Gamepad2 className="w-3 h-3" /> Play Game
            </motion.button>
          </Link>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-heart-500/10 text-heart-400 text-xs whitespace-nowrap hover:bg-heart-500/20 transition"
            whileTap={{ scale: 0.95 }}
          >
            <Gift className="w-3 h-3" /> Send Gift
          </motion.button>
          <motion.button
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 text-white/40 text-xs whitespace-nowrap hover:bg-white/10 transition"
            whileTap={{ scale: 0.95 }}
          >
            <Globe className="w-3 h-3" /> Auto-translate: ON
          </motion.button>
        </div>

        {/* Message input */}
        <div className="max-w-4xl mx-auto px-4 pb-[env(safe-area-inset-bottom,16px)] pt-1 flex items-center gap-3">
          <motion.button
            className="p-2 rounded-lg hover:bg-white/5 transition text-white/40 hover:text-white"
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type a message..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-familia-500/30 placeholder:text-white/20"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-white/20 flex items-center gap-1">
              <Languages className="w-3 h-3" />
              EN → PT
            </div>
          </div>

          <motion.button
            onClick={sendMessage}
            disabled={!input.trim()}
            className={`p-3 rounded-xl transition ${
              input.trim()
                ? 'bg-gradient-to-br from-familia-500 to-heart-500 text-white'
                : 'bg-white/5 text-white/20'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
