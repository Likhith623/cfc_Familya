'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import {
  ArrowLeft, Send, Globe, Heart, Smile, Gamepad2, Trophy, Info,
  Languages, Sparkles, Flame, Gift, Loader2
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import { ROLE_EMOJIS, LEVEL_NAMES, LEVEL_FEATURES, Message, Relationship, Profile } from '@/types';
import toast from 'react-hot-toast';

interface ChatData {
  relationship: Relationship;
  partner: Profile;
  my_role: string;
  partner_role: string;
  features_unlocked: Record<string, boolean>;
}

export default function ChatPage() {
  const params = useParams();
  const relationshipId = params.relationshipId as string;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [showTranslation, setShowTranslation] = useState<Record<string, boolean>>({});
  const [showCulturalNote, setShowCulturalNote] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [autoTranslate, setAutoTranslate] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load chat data and messages
  useEffect(() => {
    const loadChat = async () => {
      try {
        setIsLoading(true);
        const [relData, msgData] = await Promise.all([
          api.getRelationship(relationshipId),
          api.getMessages(relationshipId, 50)
        ]);
        setChatData(relData);
        setMessages(msgData.messages || []);
      } catch (err: any) {
        console.error('Failed to load chat:', err);
        toast.error(err.message || 'Failed to load chat');
      } finally {
        setIsLoading(false);
      }
    };

    if (relationshipId) {
      loadChat();
    }
  }, [relationshipId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isSending || !user) return;

    const messageText = input.trim();
    setInput('');
    setIsSending(true);

    // Optimistic update
    const optimisticMsg: Message = {
      id: `temp-${Date.now()}`,
      relationship_id: relationshipId,
      sender_id: user.id,
      content_type: 'text',
      original_text: messageText,
      original_language: 'en',
      has_idiom: false,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      const result = await api.sendMessage({
        relationship_id: relationshipId,
        original_text: messageText,
        content_type: 'text',
      });

      // Replace optimistic message with real one
      setMessages(prev => 
        prev.map(m => m.id === optimisticMsg.id ? result.message : m)
      );
    } catch (err: any) {
      console.error('Failed to send message:', err);
      toast.error(err.message || 'Failed to send message');
      // Remove optimistic message on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id));
      setInput(messageText); // Restore input
    } finally {
      setIsSending(false);
    }
  };

  const toggleTranslation = (msgId: string) => {
    setShowTranslation(prev => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return d.toLocaleDateString();
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-familia-400 mb-4" />
          <p className="text-muted">Loading conversation...</p>
        </div>
      </div>
    );
  }

  // No data state
  if (!chatData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center glass-card max-w-md">
          <Heart className="w-12 h-12 mx-auto mb-4 text-muted opacity-30" />
          <h2 className="text-xl font-bold mb-2">Conversation Not Found</h2>
          <p className="text-muted mb-6">This conversation doesn't exist or you don't have access.</p>
          <Link href="/chat"><button className="btn-primary">Back to Conversations</button></Link>
        </div>
      </div>
    );
  }

  const { relationship, partner, my_role, partner_role, features_unlocked } = chatData;

  return (
    <div className="h-screen flex flex-col">
      {/* Chat Header */}
      <div className="glass border-b border-themed z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/chat">
              <motion.button className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition" whileTap={{ scale: 0.95 }}>
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            </Link>

            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-xl">
                {ROLE_EMOJIS[partner_role] || '🤝'}
              </div>
              <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[var(--bg-primary)] ${
                partner?.status === 'active' ? 'bg-green-500' : 
                partner?.status === 'busy' ? 'bg-yellow-500' : 'bg-gray-500'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{partner?.display_name || 'Partner'}</span>
                {partner?.country && <span className="text-xs text-muted">{partner.country}</span>}
                {partner?.is_verified && <span className="text-green-500 text-xs">✓</span>}
              </div>
              <div className="text-xs text-muted flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    partner?.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-gray-400'
                  }`} />
                  {partner?.status === 'active' ? 'Online' : 'Offline'}
                </span>
                <span>•</span>
                <span>Your {partner_role}</span>
                <span>•</span>
                <span className="badge-level !text-[9px]">
                  Lv.{relationship.level} {LEVEL_NAMES[relationship.level]}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition text-muted hover:text-[var(--text-primary)]"
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
              className="overflow-hidden border-t border-themed"
            >
              <div className="max-w-4xl mx-auto px-4 py-3 grid grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-familia-400">{relationship.care_score || 0}</div>
                  <div className="text-[10px] text-muted">Care Score</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-bond-400">{relationship.bond_points || 0}</div>
                  <div className="text-[10px] text-muted">Bond Points</div>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <div>
                    <div className="text-lg font-bold text-orange-400">{relationship.streak_days || 0}</div>
                    <div className="text-[10px] text-muted">Day Streak</div>
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-muted">{relationship.messages_exchanged || messages.length}</div>
                  <div className="text-[10px] text-muted">Messages</div>
                </div>
              </div>

              {/* Level Features */}
              {LEVEL_FEATURES[relationship.level] && (
                <div className="max-w-4xl mx-auto px-4 pb-3">
                  <div className="text-xs text-muted mb-2">Unlocked at Level {relationship.level}:</div>
                  <div className="flex flex-wrap gap-2">
                    {LEVEL_FEATURES[relationship.level]?.map((feature: string) => (
                      <span key={feature} className="text-[10px] px-2 py-1 rounded-full bg-familia-500/10 text-familia-300 border border-familia-500/20">
                        ✨ {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Relationship start badge */}
        {relationship.matched_at && (
          <div className="text-center py-4">
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--bg-card)] text-xs text-muted"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Heart className="w-3 h-3 text-heart-400" />
              <span>Bond started {formatDate(relationship.matched_at)} • {ROLE_EMOJIS[my_role]} {my_role} & {ROLE_EMOJIS[partner_role]} {partner_role}</span>
            </motion.div>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 mx-auto mb-4 text-familia-400 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">Start the conversation!</h3>
            <p className="text-muted text-sm">Say hello to your new family member</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const isMe = msg.sender_id === user?.id;
          const showTrans = showTranslation[msg.id];
          const hasTranslation = msg.translated_text && msg.translated_text !== msg.original_text;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] md:max-w-[60%]`}>
                <div className={`rounded-2xl p-3 ${
                  isMe
                    ? 'message-sent rounded-br-md'
                    : 'message-received rounded-bl-md'
                }`}>
                  {/* Original text */}
                  <p className="text-sm leading-relaxed">{msg.original_text}</p>

                  {/* Translation toggle */}
                  {hasTranslation && !isMe && (
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
                    {showTrans && hasTranslation && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-[var(--bg-card-hover)]"
                      >
                        <p className="text-sm text-muted italic">{msg.translated_text}</p>
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

                {/* Idiom explanation */}
                {msg.has_idiom && msg.idiom_explanation && (
                  <div className="mt-2 p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-300">
                    <span className="font-semibold">💡 Idiom:</span> {msg.idiom_explanation}
                  </div>
                )}

                {/* Timestamp */}
                <div className={`text-[10px] text-muted mt-1 ${isMe ? 'text-right' : 'text-left'} px-1`}>
                  {formatTime(msg.created_at)}
                  {hasTranslation && !isMe && (
                    <span className="ml-1">• 🌐 Translated</span>
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
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-familia-500 to-bond-500 flex items-center justify-center text-sm">
                {ROLE_EMOJIS[partner_role]}
              </div>
              <div className="typing-indicator">
                <span /><span /><span />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Actions Bar */}
      <div className="border-t border-themed glass">
        {/* Quick actions */}
        <div className="max-w-4xl mx-auto px-4 py-2 flex items-center gap-2 overflow-x-auto">
          <Link href={`/contests?relationship=${relationshipId}`}>
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
            onClick={() => toast('Gift feature coming soon!', { icon: '🎁' })}
          >
            <Gift className="w-3 h-3" /> Send Gift
          </motion.button>
          <motion.button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition ${
              autoTranslate 
                ? 'bg-familia-500/10 text-familia-400 hover:bg-familia-500/20' 
                : 'bg-[var(--bg-card)] text-muted hover:bg-[var(--bg-card-hover)]'
            }`}
            whileTap={{ scale: 0.95 }}
            onClick={() => setAutoTranslate(!autoTranslate)}
          >
            <Globe className="w-3 h-3" /> Auto-translate: {autoTranslate ? 'ON' : 'OFF'}
          </motion.button>
        </div>

        {/* Message input */}
        <div className="max-w-4xl mx-auto px-4 pb-[env(safe-area-inset-bottom,16px)] pt-1 flex items-center gap-3">
          <motion.button
            className="p-2 rounded-lg hover:bg-[var(--bg-card-hover)] transition text-muted hover:text-[var(--text-primary)]"
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="w-5 h-5" />
          </motion.button>

          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Type a message..."
              className="input-familia w-full !pr-16"
              disabled={isSending}
            />
            {autoTranslate && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted flex items-center gap-1">
                <Languages className="w-3 h-3" />
                Auto
              </div>
            )}
          </div>

          <motion.button
            onClick={sendMessage}
            disabled={!input.trim() || isSending}
            className={`p-3 rounded-xl transition ${
              input.trim() && !isSending
                ? 'bg-gradient-to-br from-familia-500 to-heart-500 text-white'
                : 'bg-[var(--bg-card)] text-muted'
            }`}
            whileTap={{ scale: 0.95 }}
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
