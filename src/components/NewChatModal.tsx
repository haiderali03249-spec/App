import React from 'react';
import { MessageSquarePlus, X, Radio, Smartphone, ChevronRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DiscoveredDevice } from '../types';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPeer: (peer: DiscoveredDevice) => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose, onSelectPeer }) => {
  const { nearbyDevices, isScanning, startScanning } = useApp();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass-elevated max-w-md w-full rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <MessageSquarePlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Start Private Chat</h3>
              <p className="text-xs text-slate-400">Select a discovered nearby device</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-300 pt-1">
          <span>Nearby Devices ({nearbyDevices.length})</span>
          <button
            onClick={startScanning}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1"
          >
            <Radio className={`w-3.5 h-3.5 ${isScanning ? 'animate-pulse' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Rescan'}</span>
          </button>
        </div>

        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {nearbyDevices.length === 0 ? (
            <div className="p-6 rounded-2xl liquid-glass text-center space-y-2.5 border border-white/[0.06]">
              <Radio className="w-8 h-8 text-cyan-400 mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-white">No devices in direct range</p>
              <p className="text-[11px] text-slate-400">
                Ensure another device has Haider active within Wi-Fi Direct or Bluetooth distance.
              </p>
              <button
                onClick={startScanning}
                className="mt-1 px-4 py-2 rounded-xl liquid-glass-button text-xs font-semibold text-white inline-flex items-center gap-1.5"
              >
                <Radio className="w-3.5 h-3.5" />
                <span>Start Discovery</span>
              </button>
            </div>
          ) : (
            nearbyDevices.map((dev) => (
              <div
                key={dev.deviceId}
                onClick={() => {
                  onSelectPeer(dev);
                  onClose();
                }}
                className="liquid-glass-card rounded-2xl p-3 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center font-bold text-cyan-200 shrink-0">
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white truncate">{dev.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {dev.fingerprint}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-400/20">
                    {dev.status}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl liquid-glass text-xs font-medium text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
