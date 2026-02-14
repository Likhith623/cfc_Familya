'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft, Users, Globe, Heart, Plus, MessageCircle, Calendar,
  Sparkles, Star, ChefHat, Music, BookOpen, Search, Crown
} from 'lucide-react';

const MOCK_ROOMS = [
  {
    id: 'room-1', name: 'World Kitchen 🍳', theme: 'cooking', member_count: 12,
    description: 'Share recipes from your culture and cook together!',
    languages: ['English', 'Portuguese', 'Hindi', 'Japanese'],
    is_joined: true, last_message: 'Maria: Just made feijoada! 🇧🇷',
    last_activity: '2 min ago',
  },
  {
    id: 'room-2', name: 'Language Learners 📚', theme: 'language', member_count: 28,
    description: 'Practice languages together with your global family',
    languages: ['English', 'Spanish', 'Korean', 'French'],
    is_joined: true, last_message: 'Carlos: Como se dice...?',
    last_activity: '15 min ago',
  },
  {
    id: 'room-3', name: 'Cultural Music Vibes 🎵', theme: 'music', member_count: 15,
    description: 'Share music from your heritage and discover new sounds',
    languages: ['English', 'Arabic', 'Portuguese', 'Hindi'],
    is_joined: false, last_message: 'Amira: This Bollywood song is 🔥',
    last_activity: '1 hr ago',
  },
  {
    id: 'room-4', name: 'Storytelling Circle 📖', theme: 'stories', member_count: 9,
    description: 'Share folk tales and stories from your culture',
    languages: ['English', 'Japanese', 'Spanish', 'French'],
    is_joined: false, last_message: 'Kenji: In Japan we have a tale...',
    last_activity: '3 hr ago',
  },
];

const ROOM_MESSAGES = [
  {
    id: 'rm1', sender: 'Maria Santos', country: '🇧🇷', content: 'I just made feijoada for the first time in my new kitchen! Look! 🍲',
    translated: null, time: '2 min ago',
  },
  {
    id: 'rm2', sender: 'Raj Patel', country: '🇮🇳', content: 'That looks amazing! Reminds me of dal makhani 😍',
    translated: null, time: '1 min ago',
  },
  {
    id: 'rm3', sender: 'Yuki Tanaka', country: '🇯🇵', content: 'とても美味しそう！レシピを教えてください！',
    translated: 'That looks so delicious! Please share the recipe!', time: '30 sec ago',
  },
  {
    id: 'rm4', sender: 'Maria Santos', country: '🇧🇷', content: 'Claro! O segredo é o feijão preto e a linguiça 🤤',
    translated: 'Of course! The secret is the black beans and sausage 🤤', time: 'just now',
  },
];

const POTLUCK_EVENTS = [
  { id: 'p1', name: 'Global Breakfast Challenge 🌅', date: 'This Saturday', participants: 8, description: 'Everyone makes their traditional breakfast dish and shares photos!' },
  { id: 'p2', name: 'Festival of Lights Celebration 🪔', date: 'Next week', participants: 15, description: 'Diwali x Christmas x Hanukkah - sharing light traditions from every culture' },
];

type RoomView = 'list' | 'chat' | 'create';

export default function FamilyRoomsPage() {
  const [view, setView] = useState<RoomView>('list');
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [msgInput, setMsgInput] = useState('');
  const [messages, setMessages] = useState(ROOM_MESSAGES);

  const sendMessage = () => {
    if (!msgInput.trim()) return;
    setMessages([...messages, {
      id: `rm-${Date.now()}`,
      sender: 'You',
      country: '🇮🇳',
      content: msgInput,
      translated: null,
      time: 'just now',
    }]);
    setMsgInput('');
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 backdrop-blur-2xl bg-[#0A0A1A]/80 border-b border-white/[0.06] shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          {view !== 'list' ? (
            <motion.button
              className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200"
              onClick={() => setView('list')}
              whileHover={{ x: -2 }}
              whileTap={{ scale: 0.92 }}
            >
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </motion.button>
          ) : (
            <Link href="/dashboard">
              <motion.button className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all duration-200" whileHover={{ x: -2 }} whileTap={{ scale: 0.92 }}>
                <ArrowLeft className="w-5 h-5 text-white/70" />
              </motion.button>
            </Link>
          )}
          <div className="flex-1">
            <h1 className="font-bold text-lg flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-bond-500/20 to-familia-500/20">
                <Users className="w-4 h-4 text-bond-400" />
              </div>
              {view === 'chat' ? selectedRoom?.name : 'Family Rooms'}
            </h1>
            {view === 'chat' && selectedRoom && (
              <div className="text-[10px] text-white/30 ml-9 mt-0.5">
                {selectedRoom.member_count} members • {selectedRoom.languages.length} languages
              </div>
            )}
          </div>
          {view === 'list' && (
            <motion.button
              onClick={() => setView('create')}
              className="ml-auto flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-familia-500/20 to-bond-500/20 text-familia-300 hover:from-familia-500/30 hover:to-bond-500/30 border border-familia-500/20 transition-all duration-200 text-xs font-medium"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create</span>
            </motion.button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ── Room List ────────────────────── */}
          {view === 'list' && (
            <motion.div key="list" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              {/* My Rooms */}
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="p-1 rounded-md bg-heart-500/10">
                  <Heart className="w-4 h-4 text-heart-400" />
                </div>
                My Rooms
                <span className="text-xs text-white/20 font-normal ml-1">({MOCK_ROOMS.filter(r => r.is_joined).length})</span>
              </h3>
              <div className="space-y-3 mb-8">
                {MOCK_ROOMS.filter(r => r.is_joined).map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, ease: 'easeOut' }}
                  >
                    <div
                      className="relative group glass-card card-hover cursor-pointer overflow-hidden border border-white/[0.06] hover:border-familia-500/30 transition-all duration-300"
                      onClick={() => { setSelectedRoom(room); setView('chat'); }}
                    >
                      {/* Gradient accent top border */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-bond-500 via-familia-500 to-heart-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                      <div className="flex items-center gap-4">
                        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-bond-500/20 to-familia-500/20 border border-white/[0.08] flex items-center justify-center text-xl shadow-lg">
                          {room.theme === 'cooking' ? '🍳' : room.theme === 'language' ? '📚' : room.theme === 'music' ? '🎵' : '📖'}
                          {/* Active pulse indicator */}
                          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-50" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-[#0A0A1A]" />
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {room.name}
                            <MessageCircle className="w-3 h-3 text-white/20 group-hover:text-familia-400 transition-colors" />
                          </div>
                          <div className="text-xs text-white/40 truncate mt-0.5">{room.last_message}</div>
                          {/* Member avatar row */}
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex -space-x-1.5">
                              {room.languages.slice(0, 4).map((lang, li) => (
                                <div key={li} className="w-5 h-5 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center text-[8px]">
                                  {lang.slice(0, 2)}
                                </div>
                              ))}
                              {room.member_count > 4 && (
                                <div className="w-5 h-5 rounded-full bg-familia-500/20 border border-familia-500/30 flex items-center justify-center text-[8px] text-familia-300">
                                  +{room.member_count - 4}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-white/25">
                              <Users className="w-3 h-3" /> {room.member_count}
                              <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                              <Globe className="w-3 h-3" /> {room.languages.length} langs
                              <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                              <span className="text-green-400/60">{room.last_activity}</span>
                            </div>
                          </div>
                        </div>
                        <ArrowLeft className="w-4 h-4 text-white/10 rotate-180 group-hover:text-white/30 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Discover */}
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="p-1 rounded-md bg-white/5">
                  <Search className="w-4 h-4 text-white/40" />
                </div>
                Discover Rooms
                <span className="text-xs text-white/20 font-normal ml-1">({MOCK_ROOMS.filter(r => !r.is_joined).length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                {MOCK_ROOMS.filter(r => !r.is_joined).map((room, i) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.07, ease: 'easeOut' }}
                  >
                    <div className="relative group glass-card h-full border border-white/[0.06] hover:border-bond-500/20 transition-all duration-300 overflow-hidden">
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-white/10 via-bond-500/40 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="flex flex-col gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] flex items-center justify-center text-xl shrink-0">
                            {room.theme === 'cooking' ? '🍳' : room.theme === 'language' ? '📚' : room.theme === 'music' ? '🎵' : '📖'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm">{room.name}</div>
                            <div className="text-xs text-white/35 mt-0.5 line-clamp-2">{room.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[10px] text-white/25">
                            <Users className="w-3 h-3" /> {room.member_count}
                            <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
                            <div className="flex gap-1">
                              {room.languages.slice(0, 3).map((l, li) => (
                                <span key={li} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[9px]">{l.slice(0, 3)}</span>
                              ))}
                              {room.languages.length > 3 && <span className="text-white/20">+{room.languages.length - 3}</span>}
                            </div>
                          </div>
                          <motion.button
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-familia-500/15 to-bond-500/15 text-familia-300 text-xs font-medium hover:from-familia-500/25 hover:to-bond-500/25 border border-familia-500/20 transition-all duration-200"
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                          >
                            Join
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Cultural Potlucks */}
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <div className="p-1 rounded-md bg-amber-500/10">
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                Upcoming Potluck Events
                <Sparkles className="w-3 h-3 text-amber-400/50 ml-1" />
              </h3>
              <div className="space-y-3">
                {POTLUCK_EVENTS.map((event, i) => (
                  <motion.div
                    key={event.id}
                    className="relative group glass-card overflow-hidden border border-white/[0.06] hover:border-amber-500/20 transition-all duration-300"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, ease: 'easeOut' }}
                  >
                    {/* Left accent gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-amber-400 via-warm-500 to-heart-500 rounded-full" />
                    {/* Subtle glow background */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/[0.04] rounded-full blur-2xl group-hover:bg-amber-500/[0.08] transition-colors" />
                    <div className="relative pl-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="font-semibold text-sm mb-1 flex items-center gap-2">
                            {event.name}
                          </div>
                          <div className="text-xs text-white/40 mb-3 leading-relaxed">{event.description}</div>
                          <div className="flex items-center gap-3 text-[10px]">
                            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-500/10 text-amber-300/70">
                              <Calendar className="w-3 h-3" /> {event.date}
                            </span>
                            <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-white/[0.04] text-white/30">
                              <Users className="w-3 h-3" /> {event.participants} joined
                            </span>
                          </div>
                        </div>
                        <motion.button
                          className="shrink-0 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 to-warm-500/15 text-amber-300 text-xs font-medium border border-amber-500/20 hover:from-amber-500/25 hover:to-warm-500/25 transition-all"
                          whileHover={{ scale: 1.04 }}
                          whileTap={{ scale: 0.96 }}
                        >
                          RSVP
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Room Chat ────────────────────── */}
          {view === 'chat' && selectedRoom && (
            <motion.div key="chat" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              {/* Room info */}
              <div className="relative glass-card !p-3 mb-4 overflow-hidden border border-white/[0.06]">
                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-bond-500/30 to-transparent" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-white/30">
                    <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/[0.04]">
                      <Users className="w-3 h-3" /> {selectedRoom.member_count} members
                    </span>
                    <div className="flex gap-1">
                      {selectedRoom.languages.map((lang: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 rounded bg-white/[0.04] text-[10px] text-white/25">{lang.slice(0, 3)}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-40" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    <span className="text-green-400/70 text-[11px]">{Math.floor(selectedRoom.member_count * 0.6)} online</span>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="space-y-4 mb-4">
                {messages.map((msg, i) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-3"
                  >
                    <div className={`w-9 h-9 rounded-xl ${msg.sender === 'You' ? 'bg-gradient-to-br from-familia-500/30 to-bond-500/30 border border-familia-500/30' : 'bg-gradient-to-br from-white/[0.08] to-white/[0.03] border border-white/[0.08]'} flex items-center justify-center text-sm shrink-0 shadow-lg`}>
                      {msg.country}
                    </div>
                    <div className={`flex-1 ${msg.sender === 'You' ? 'items-end' : ''}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-sm font-medium ${msg.sender === 'You' ? 'text-familia-300' : 'text-white/80'}`}>{msg.sender}</span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-white/[0.04] text-white/20">{msg.country}</span>
                        <span className="text-[10px] text-white/15 ml-auto">{msg.time}</span>
                      </div>
                      <div className={`rounded-2xl rounded-tl-sm p-3 ${msg.sender === 'You' ? 'bg-gradient-to-br from-familia-500/10 to-bond-500/10 border border-familia-500/10' : 'bg-white/[0.04] border border-white/[0.05]'}`}>
                        <p className="text-sm leading-relaxed">{msg.content}</p>
                        {msg.translated && (
                          <div className="flex items-start gap-1.5 mt-2 pt-2 border-t border-white/[0.06]">
                            <Globe className="w-3 h-3 text-bond-400/50 mt-0.5 shrink-0" />
                            <p className="text-xs text-white/35 italic leading-relaxed">
                              {msg.translated}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Input */}
              <div className="relative flex items-center gap-3 mt-4 p-2 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                <input
                  value={msgInput}
                  onChange={(e) => setMsgInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Say something to the family..."
                  className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-white/20"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!msgInput.trim()}
                  className={`p-2.5 rounded-xl transition-all duration-200 ${
                    msgInput.trim()
                      ? 'bg-gradient-to-br from-familia-500 to-bond-500 text-white shadow-lg shadow-familia-500/20'
                      : 'bg-white/[0.04] text-white/20'
                  }`}
                  whileHover={msgInput.trim() ? { scale: 1.05 } : {}}
                  whileTap={{ scale: 0.92 }}
                >
                  <MessageCircle className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── Create Room ──────────────────── */}
          {view === 'create' && (
            <motion.div key="create" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
              <div className="text-center mb-8">
                <motion.div
                  className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-familia-500/10 to-bond-500/10 border border-white/[0.06] mb-4"
                  initial={{ scale: 0.8, rotate: -5 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                >
                  <span className="text-4xl">🏠</span>
                </motion.div>
                <h2 className="text-2xl font-bold gradient-text">Create a Family Room</h2>
                <p className="text-white/40 text-sm mt-1">Build a space where cultures come together</p>
              </div>

              <div className="relative glass-card max-w-md mx-auto space-y-5 border border-white/[0.06] overflow-hidden">
                {/* Top accent */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-familia-500 via-bond-500 to-heart-500" />
                <div>
                  <label className="block text-xs font-medium mb-2 text-white/50 uppercase tracking-wider">Room Name</label>
                  <input
                    placeholder="e.g., World Cooking Club 🍳"
                    className="input-familia w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-2 text-white/50 uppercase tracking-wider">Description</label>
                  <textarea
                    placeholder="What brings your room together?"
                    rows={3}
                    className="input-familia w-full resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-3 text-white/50 uppercase tracking-wider">Choose a Theme</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { icon: '🍳', label: 'Cooking', color: 'from-amber-500/15 to-orange-500/15 border-amber-500/20 hover:border-amber-500/40' },
                      { icon: '📚', label: 'Language', color: 'from-blue-500/15 to-indigo-500/15 border-blue-500/20 hover:border-blue-500/40' },
                      { icon: '🎵', label: 'Music', color: 'from-purple-500/15 to-pink-500/15 border-purple-500/20 hover:border-purple-500/40' },
                      { icon: '📖', label: 'Stories', color: 'from-emerald-500/15 to-teal-500/15 border-emerald-500/20 hover:border-emerald-500/40' },
                      { icon: '🎨', label: 'Art', color: 'from-rose-500/15 to-red-500/15 border-rose-500/20 hover:border-rose-500/40' },
                      { icon: '🏋️', label: 'Wellness', color: 'from-green-500/15 to-lime-500/15 border-green-500/20 hover:border-green-500/40' },
                      { icon: '🎮', label: 'Gaming', color: 'from-cyan-500/15 to-blue-500/15 border-cyan-500/20 hover:border-cyan-500/40' },
                      { icon: '🌍', label: 'General', color: 'from-familia-500/15 to-bond-500/15 border-familia-500/20 hover:border-familia-500/40' },
                    ].map((theme) => (
                      <motion.button
                        key={theme.label}
                        className={`p-3 rounded-xl bg-gradient-to-br ${theme.color} transition-all duration-200 text-center border`}
                        whileHover={{ scale: 1.06, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="text-xl mb-1">{theme.icon}</div>
                        <div className="text-[10px] text-white/50 font-medium">{theme.label}</div>
                      </motion.button>
                    ))}
                  </div>
                </div>
                <motion.button
                  className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Sparkles className="w-4 h-4" />
                  Create Room
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
