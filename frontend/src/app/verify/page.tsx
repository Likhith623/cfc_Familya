'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Video, Mic, Shield, CheckCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function VerifyPage() {
  const [method, setMethod] = useState<'video' | 'voice' | null>(null);
  const [recording, setRecording] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState<'choose' | 'record' | 'intent' | 'done'>('choose');

  const startRecording = () => {
    setRecording(true);
    // Simulate recording for demo
    setTimeout(() => {
      setRecording(false);
      setStep('intent');
    }, 3000);
  };

  const recordIntent = () => {
    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      setCompleted(true);
      setStep('done');
      // Update local storage
      const user = JSON.parse(localStorage.getItem('familia_user') || '{}');
      user.is_verified = true;
      localStorage.setItem('familia_user', JSON.stringify(user));
    }, 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12">
      <motion.div
        className="w-full max-w-lg"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-center mb-8">
          <motion.div
            className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Shield className="w-10 h-10 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold mb-2">Human Verification</h1>
          <p className="text-white/50">Prove you&apos;re real. No bots allowed in Familia.</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {['choose', 'record', 'intent', 'done'].map((s, i) => (
            <div
              key={s}
              className={`h-1.5 flex-1 rounded-full transition-all ${
                ['choose', 'record', 'intent', 'done'].indexOf(step) >= i
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                  : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div
              key="choose"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <h2 className="text-xl font-semibold text-center mb-6">Choose Verification Method</h2>

              <motion.button
                onClick={() => { setMethod('video'); setStep('record'); }}
                className="glass-card w-full text-left flex items-center gap-4 cursor-pointer"
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0">
                  <Video className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-semibold">Video Intro</div>
                  <div className="text-sm text-white/50">30-second video about your favorite memory</div>
                  <div className="text-xs text-green-400 mt-1">⭐ Recommended</div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => { setMethod('voice'); setStep('record'); }}
                className="glass-card w-full text-left flex items-center gap-4 cursor-pointer"
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center flex-shrink-0">
                  <Mic className="w-7 h-7" />
                </div>
                <div>
                  <div className="font-semibold">Voice Intro + Photo</div>
                  <div className="text-sm text-white/50">Record your voice and upload a photo</div>
                </div>
              </motion.button>
            </motion.div>
          )}

          {step === 'record' && (
            <motion.div
              key="record"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card text-center"
            >
              <h2 className="text-xl font-semibold mb-4">
                {method === 'video' ? '📹 Video Intro Challenge' : '🎙️ Voice Intro'}
              </h2>
              <p className="text-white/50 mb-8">
                {method === 'video'
                  ? 'Tell us about your favorite childhood memory (30 seconds)'
                  : 'Record a short voice note about yourself'
                }
              </p>

              <div className="relative w-48 h-48 mx-auto mb-8">
                <motion.div
                  className={`w-full h-full rounded-full flex items-center justify-center ${
                    recording
                      ? 'bg-gradient-to-br from-red-500 to-pink-500'
                      : 'bg-gradient-to-br from-familia-500 to-heart-500'
                  }`}
                  animate={recording ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  {recording ? (
                    <div className="text-center">
                      <div className="text-4xl mb-2">🔴</div>
                      <div className="text-sm font-medium">Recording...</div>
                    </div>
                  ) : (
                    <div className="text-6xl">
                      {method === 'video' ? '📹' : '🎙️'}
                    </div>
                  )}
                </motion.div>

                {recording && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-red-500/30"
                    animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>

              {!recording && (
                <motion.button
                  onClick={startRecording}
                  className="btn-primary inline-flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Start Recording
                  <Mic className="w-4 h-4" />
                </motion.button>
              )}
            </motion.div>
          )}

          {step === 'intent' && (
            <motion.div
              key="intent"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="glass-card text-center"
            >
              <h2 className="text-xl font-semibold mb-4">🎯 Intent Voice Note</h2>
              <p className="text-white/50 mb-2">
                This becomes your &quot;Bio&quot; that potential matches will hear
              </p>
              <p className="text-sm text-familia-400 mb-8">
                Say: &quot;I want to be a digital [role] because...&quot;
              </p>

              <div className="glass rounded-xl p-4 mb-6 text-left">
                <div className="text-sm text-white/60 mb-3">💡 Example prompts:</div>
                <ul className="space-y-2 text-sm text-white/40">
                  <li>• &quot;I want to be a digital mother because I love nurturing young minds across cultures...&quot;</li>
                  <li>• &quot;I&apos;m looking for a mentor because I want to learn from someone with different experiences...&quot;</li>
                  <li>• &quot;I want to be a friend because I believe connection knows no borders...&quot;</li>
                </ul>
              </div>

              <motion.button
                onClick={recordIntent}
                className={`btn-primary inline-flex items-center gap-2 ${recording ? 'bg-red-500' : ''}`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {recording ? (
                  <>
                    <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                    Recording your intent...
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    Record Your Intent Bio
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {step === 'done' && (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-2xl font-bold mb-2">✅ Verified Human!</h2>
              <p className="text-white/50 mb-6">
                You&apos;re now a verified member of Familia. Time to find your global family!
              </p>

              <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-medium mb-8 border border-green-500/30">
                <CheckCircle className="w-4 h-4" />
                Verified Human Badge Earned
              </div>

              <div className="space-y-3">
                <motion.a
                  href="/dashboard"
                  className="btn-primary w-full flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <Sparkles className="w-4 h-4" />
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
