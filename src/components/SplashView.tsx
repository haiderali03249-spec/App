import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, WifiOff, Radio, ChevronRight, FastForward } from 'lucide-react';

interface SplashViewProps {
  onFinish: () => void;
  onSkip?: () => void;
}

export const SplashView: React.FC<SplashViewProps> = ({ onFinish, onSkip }) => {
  const timerRef = useRef<any>(null);

  const handleSkip = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (onSkip) {
      onSkip();
    } else {
      onFinish();
    }
  };

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      onFinish();
    }, 3200);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#060B18] text-white px-6 py-8 overflow-hidden select-none"
    >
      {/* Background ambient liquid glass glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Bar with prominent Skip button */}
      <div className="w-full max-w-md flex items-center justify-between z-20">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-wider text-cyan-300">
            Offline P2P Mode
          </span>
        </div>

        {/* Top Skip Button */}
        <button
          onClick={handleSkip}
          className="px-3.5 py-1.5 rounded-xl liquid-glass text-xs font-semibold text-slate-200 hover:text-white hover:border-cyan-400/50 hover:bg-cyan-500/10 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
        >
          <span>Skip</span>
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
        </button>
      </div>

      {/* Center Cinematic Emblem & Identity */}
      <div className="flex flex-col items-center text-center max-w-sm my-auto z-10 space-y-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative"
        >
          <div className="relative w-28 h-28 rounded-3xl p-[2px] bg-gradient-to-tr from-cyan-400/40 via-blue-500/30 to-purple-600/40 shadow-[0_0_50px_rgba(0,210,255,0.25)]">
            <div className="w-full h-full rounded-[22px] overflow-hidden liquid-glass-elevated flex items-center justify-center relative">
              <img
                src="/src/assets/images/haider_logo_icon_1793634076635.jpg"
                alt="Haider Logo"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
              <span className="absolute inset-0 flex items-center justify-center font-display text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-cyan-200 via-blue-400 to-indigo-300 pointer-events-none">
                H
              </span>
            </div>
          </div>

          {/* Ambient pulse ring */}
          <div className="absolute inset-0 rounded-3xl border border-cyan-400/30 animate-pulse-ring pointer-events-none" />
        </motion.div>

        {/* Brand Text */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="space-y-1.5"
        >
          <h1 className="text-3xl font-display font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-300">
            HAIDER
          </h1>
          <p className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">
            Offline Messaging System
          </p>
          <p className="text-xs text-slate-400 font-medium">
            Connect Nearby. Message Freely.
          </p>
        </motion.div>

        {/* Searching Status Indicator with Sonar Pulse */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="pt-2 flex flex-col items-center gap-3 w-full"
        >
          <div className="flex items-center gap-2 text-xs font-medium text-cyan-300 bg-cyan-950/60 px-3.5 py-1.5 rounded-full border border-cyan-500/30 shadow-[0_0_15px_rgba(0,210,255,0.2)]">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Searching nearby devices...</span>
          </div>

          {/* Luminous Sweep Progress Bar */}
          <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="w-1/2 h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
            />
          </div>

          {/* Prominent Center Skip Button */}
          <button
            onClick={handleSkip}
            className="mt-3 px-6 py-2.5 rounded-2xl liquid-glass-elevated border border-cyan-400/40 text-white hover:text-cyan-200 hover:border-cyan-300 hover:bg-cyan-500/10 text-xs font-semibold tracking-wide transition-all shadow-[0_4px_25px_rgba(0,210,255,0.2)] active:scale-95 flex items-center gap-2 group"
          >
            <span>Skip Searching &amp; Open App</span>
            <ChevronRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </motion.div>
      </div>

      {/* Bottom Feature Badges */}
      <div className="flex items-center gap-5 text-[11px] text-slate-400 font-medium z-10">
        <span className="flex items-center gap-1.5">
          <WifiOff className="w-3.5 h-3.5 text-cyan-400" />
          <span>100% Offline</span>
        </span>
        <span className="text-slate-600">·</span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>E2EE Cryptography</span>
        </span>
      </div>
    </motion.div>
  );
};
