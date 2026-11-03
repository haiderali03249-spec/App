import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Palette,
  Volume2,
  VolumeX,
  Vibrate,
  ShieldCheck,
  Key,
  RotateCcw,
  Smartphone,
  PhoneCall,
  Download,
  Info,
  Check,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AccentColor, ChatWallpaper, FontSize, ThemeMode } from '../types';
import { AndroidProjectExporter } from './AndroidProjectExporter';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const SettingsScreen: React.FC = () => {
  const {
    settings,
    updateSettings,
    userProfile,
    updateProfileName,
    resetKeys,
  } = useApp();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(userProfile?.name || '');
  const [copiedFp, setCopiedFp] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  const handleSaveName = async () => {
    if (editedName.trim()) {
      await updateProfileName(editedName.trim());
      setIsEditingName(false);
    }
  };

  const copyFingerprint = () => {
    if (userProfile?.fingerprint) {
      navigator.clipboard.writeText(userProfile.fingerprint);
      setCopiedFp(true);
      setTimeout(() => setCopiedFp(false), 2000);
    }
  };

  const accentColors: { id: AccentColor; name: string; bgClass: string; hex: string }[] = [
    { id: 'cyan', name: 'Electric Cyan', bgClass: 'bg-[#00D2FF]', hex: '#00D2FF' },
    { id: 'blue', name: 'Cyber Blue', bgClass: 'bg-[#0066FF]', hex: '#0066FF' },
    { id: 'purple', name: 'Neon Violet', bgClass: 'bg-[#8B5CF6]', hex: '#8B5CF6' },
    { id: 'emerald', name: 'Emerald Frost', bgClass: 'bg-[#10B981]', hex: '#10B981' },
    { id: 'amber', name: 'Solar Amber', bgClass: 'bg-[#F59E0B]', hex: '#F59E0B' },
  ];

  const wallpapers: { id: ChatWallpaper; name: string; preview: string }[] = [
    { id: 'cosmic', name: 'Deep Cosmic', preview: 'from-slate-950 via-[#060B18] to-slate-900' },
    { id: 'grid', name: 'Electric Grid', preview: 'from-blue-950 via-[#060B18] to-cyan-950' },
    { id: 'frosted', name: 'Frosted Midnight', preview: 'from-indigo-950 via-slate-900 to-black' },
    { id: 'aurora', name: 'Aurora Glass', preview: 'from-cyan-950 via-[#060B18] to-purple-950' },
  ];

  return (
    <div className="flex flex-col min-h-screen pb-32 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 px-5 pt-6 pb-4 liquid-glass-elevated border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              Settings &amp; Appearance
            </h1>
            <p className="text-xs text-slate-400">
              Customize Liquid Glass UI, crypto identities, and offline mesh
            </p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-5 flex-1">
        {/* Device Cryptographic Identity Card */}
        <section className="liquid-glass rounded-3xl p-5 border border-white/[0.08] space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Device Authenticated Identity</span>
            </h2>

            <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-400/20">
              ECDH P-256 Active
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center font-display font-bold text-xl text-cyan-200 shrink-0">
              {userProfile?.name?.charAt(0).toUpperCase() || 'H'}
            </div>

            <div className="flex-1 min-w-0">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="py-1 px-2.5 text-sm rounded-lg liquid-glass-input text-white focus:outline-none w-full"
                  />
                  <button
                    onClick={handleSaveName}
                    className="px-3 py-1 rounded-lg bg-cyan-500 text-slate-950 font-bold text-xs"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setIsEditingName(false)}
                    className="px-2 py-1 text-xs text-slate-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-base text-white truncate">
                    {userProfile?.name}
                  </span>
                  <button
                    onClick={() => {
                      setEditedName(userProfile?.name || '');
                      setIsEditingName(true);
                    }}
                    className="p-1 text-slate-400 hover:text-cyan-400"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate">
                ID: {userProfile?.deviceId}
              </p>
            </div>
          </div>

          {/* Fingerprint block */}
          <div className="p-3 rounded-2xl bg-[#030712] border border-white/[0.06] flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">
                Cryptographic Fingerprint (SHA-256)
              </span>
              <span className="font-mono text-cyan-300 truncate block">
                {userProfile?.fingerprint}
              </span>
            </div>

            <button
              onClick={copyFingerprint}
              className="px-2.5 py-1 rounded-lg liquid-glass text-slate-300 hover:text-white text-xs shrink-0 flex items-center gap-1"
            >
              {copiedFp ? <Check className="w-3 h-3 text-emerald-400" /> : null}
              <span>{copiedFp ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </section>

        {/* Theme & Visual Customization */}
        <section className="liquid-glass rounded-3xl p-5 border border-white/[0.08] space-y-4">
          <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Theme &amp; Liquid Glass Appearance</span>
          </h2>

          {/* Theme mode */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300">Theme Mode</span>
            <div className="grid grid-cols-3 gap-2">
              {(['dark', 'light', 'system'] as ThemeMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => updateSettings({ theme: mode })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                    settings.theme === mode
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                      : 'liquid-glass text-slate-400 hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Accent Color */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300">Accent Glow</span>
            <div className="flex items-center gap-3">
              {accentColors.map((color) => (
                <button
                  key={color.id}
                  onClick={() => updateSettings({ accentColor: color.id })}
                  className={`w-9 h-9 rounded-full ${color.bgClass} flex items-center justify-center transition-transform ${
                    settings.accentColor === color.id
                      ? 'scale-110 ring-4 ring-white/20 shadow-lg'
                      : 'hover:scale-105 opacity-80'
                  }`}
                  title={color.name}
                >
                  {settings.accentColor === color.id && (
                    <Check className="w-4 h-4 text-slate-950 font-bold" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Wallpaper selection */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300">Chat Wallpaper</span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {wallpapers.map((wp) => (
                <button
                  key={wp.id}
                  onClick={() => updateSettings({ wallpaper: wp.id })}
                  className={`h-14 rounded-xl bg-gradient-to-br ${wp.preview} border p-2 flex flex-col justify-end text-left transition-all ${
                    settings.wallpaper === wp.id
                      ? 'border-cyan-400 shadow-[0_0_15px_rgba(0,210,255,0.3)]'
                      : 'border-white/[0.08] hover:border-white/20 opacity-70 hover:opacity-100'
                  }`}
                >
                  <span className="text-[11px] font-semibold text-white drop-shadow truncate">
                    {wp.name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <span className="text-xs font-medium text-slate-300">Text Scaling</span>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'default', 'large'] as FontSize[]).map((size) => (
                <button
                  key={size}
                  onClick={() => updateSettings({ fontSize: size })}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold capitalize transition-all ${
                    settings.fontSize === size
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                      : 'liquid-glass text-slate-400 hover:text-white'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Audio & Haptic Notifications */}
        <section className="liquid-glass rounded-3xl p-5 border border-white/[0.08] space-y-3">
          <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            <span>Sound &amp; Vibrations</span>
          </h2>

          <div className="flex items-center justify-between py-1">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Message Alert Sounds</span>
              <p className="text-[11px] text-slate-400">Play tone on received message</p>
            </div>
            <button
              onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.soundEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.soundEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-1 border-t border-white/[0.06]">
            <div className="space-y-0.5">
              <span className="text-xs font-semibold text-white">Haptic Feedback</span>
              <p className="text-[11px] text-slate-400">Vibrate when typing and on delivery</p>
            </div>
            <button
              onClick={() => updateSettings({ vibrationEnabled: !settings.vibrationEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.vibrationEnabled ? 'bg-cyan-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vibrationEnabled ? 'right-0.5' : 'left-0.5'
                }`}
              />
            </button>
          </div>
        </section>

        {/* PWA Home Screen Installation */}
        <section className="liquid-glass rounded-3xl p-5 border border-white/[0.08] space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Offline Mobile App (PWA)</span>
            </h2>
            <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded">
              Installable
            </span>
          </div>

          <p className="text-xs text-slate-300">
            Install Haider Offline Messaging directly to your Android device for a full-screen, standalone offline experience without app store downloads.
          </p>

          <div className="pt-1">
            {isInstalled ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Running as Installed Standalone Application</span>
              </div>
            ) : isInstallable ? (
              <button
                onClick={install}
                className="w-full py-2.5 rounded-xl liquid-glass-button text-xs font-bold text-white flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Install Haider on Android Device</span>
              </button>
            ) : isIOS ? (
              <button
                onClick={() => setShowIOSModal(true)}
                className="w-full py-2.5 rounded-xl liquid-glass text-xs font-bold text-slate-200 hover:text-white"
              >
                Install on iPhone / iPad Guide
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-white/[0.04] text-[11px] text-slate-400">
                Tip: Tap browser menu &quot;Add to Home Screen&quot; or &quot;Install App&quot; to run offline.
              </div>
            )}
          </div>
        </section>

        {/* Android Studio Native Project Export Section */}
        <AndroidProjectExporter />

        {/* Reset / Clear Data */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (
                window.confirm(
                  'Are you sure you want to regenerate cryptographic keys and reset all local chat data?'
                )
              ) {
                resetKeys();
              }
            }}
            className="w-full py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/25 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Identity &amp; Clear Local Messages</span>
          </button>
        </div>

        {/* STRICT REQUIREMENT: Contact Section at the very bottom */}
        {/* Contact Number: 03249192862, Show only at the bottom of Settings, Tap-to-call */}
        <footer className="pt-6 pb-4 border-t border-white/[0.08] text-center space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
              Support &amp; Contact
            </span>
          </div>

          <div>
            <a
              href="tel:03249192862"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl liquid-glass-elevated border border-cyan-400/40 text-cyan-300 hover:text-white hover:border-cyan-300 font-mono font-bold text-sm tracking-widest shadow-[0_4px_20px_rgba(0,210,255,0.2)] transition-all active:scale-95"
            >
              <PhoneCall className="w-4 h-4 text-cyan-400" />
              <span>03249192862</span>
            </a>
          </div>

          <p className="text-[11px] text-slate-500 pt-1">
            Haider Offline Messaging System • Tap number above to place a direct phone call.
          </p>
        </footer>
      </main>

      {/* iOS Install Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-elevated max-w-sm w-full rounded-3xl p-6 border border-white/[0.12] space-y-4">
            <h3 className="text-base font-bold text-white">Install on iPhone / iPad</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. Tap the <strong>Share</strong> icon in the Safari navigation bar.<br />
              2. Scroll down and choose <strong>Add to Home Screen</strong>.<br />
              3. Launch Haider from your home screen for full offline peer messaging.
            </p>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 rounded-xl liquid-glass text-xs font-bold text-white"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
