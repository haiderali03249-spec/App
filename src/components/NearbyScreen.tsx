import React, { useState } from 'react';
import {
  Radio,
  WifiOff,
  ShieldCheck,
  Smartphone,
  Signal,
  CheckCircle2,
  XCircle,
  Unlink,
  QrCode,
  Sparkles,
  Info,
  X,
} from 'lucide-react';
import QRCode from 'qrcode';
import { useApp } from '../context/AppContext';
import { DiscoveredDevice } from '../types';

interface NearbyScreenProps {
  onStartChatWithPeer: (peer: DiscoveredDevice) => void;
}

export const NearbyScreen: React.FC<NearbyScreenProps> = ({ onStartChatWithPeer }) => {
  const {
    nearbyDevices,
    isScanning,
    startScanning,
    stopScanning,
    requestConnection,
    acceptConnection,
    rejectConnection,
    disconnectDevice,
    userProfile,
  } = useApp();

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const generatePairingQr = async () => {
    if (!userProfile) return;
    const payload = JSON.stringify({
      id: userProfile.deviceId,
      name: userProfile.name,
      pk: userProfile.publicKey,
      fp: userProfile.fingerprint,
    });
    try {
      const url = await QRCode.toDataURL(payload, {
        margin: 2,
        color: {
          dark: '#00D2FF',
          light: '#060B18',
        },
      });
      setQrCodeDataUrl(url);
      setShowQrModal(true);
    } catch (err) {
      console.error('Failed generating QR code', err);
    }
  };

  const getStatusBadge = (status: DiscoveredDevice['status']) => {
    switch (status) {
      case 'SCANNING':
        return (
          <span className="text-[10px] font-mono text-cyan-300 bg-cyan-500/15 px-2 py-0.5 rounded border border-cyan-400/20">
            SCANNING
          </span>
        );
      case 'DEVICE_FOUND':
        return (
          <span className="text-[10px] font-mono text-blue-300 bg-blue-500/15 px-2 py-0.5 rounded border border-blue-400/20">
            DEVICE FOUND
          </span>
        );
      case 'CONNECTING':
        return (
          <span className="text-[10px] font-mono text-amber-300 bg-amber-500/15 px-2 py-0.5 rounded border border-amber-400/20 animate-pulse">
            CONNECTING...
          </span>
        );
      case 'CONNECTED':
        return (
          <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded border border-emerald-400/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            CONNECTED
          </span>
        );
      case 'DISCONNECTED':
        return (
          <span className="text-[10px] font-mono text-slate-400 bg-slate-500/15 px-2 py-0.5 rounded border border-slate-400/20">
            DISCONNECTED
          </span>
        );
      case 'CONNECTION_FAILED':
        return (
          <span className="text-[10px] font-mono text-red-300 bg-red-500/15 px-2 py-0.5 rounded border border-red-400/20">
            CONNECTION FAILED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-28 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-30 px-5 pt-6 pb-4 liquid-glass-elevated border-b border-white/[0.08]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold tracking-tight text-white flex items-center gap-2">
              Nearby Devices
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                P2P Mesh
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Wi-Fi Direct & Bluetooth discovery via Nearby Connections API
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generatePairingQr}
              className="p-2 rounded-xl liquid-glass text-slate-300 hover:text-cyan-300 transition-colors"
              title="Show Offline QR Code for direct pairing"
            >
              <QrCode className="w-5 h-5" />
            </button>

            <button
              onClick={isScanning ? stopScanning : startScanning}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isScanning
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'liquid-glass-button text-white'
              }`}
            >
              <Radio className={`w-4 h-4 ${isScanning ? 'animate-pulse' : ''}`} />
              <span>{isScanning ? 'Stop Scan' : 'Start Scan'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto w-full px-4 pt-4 space-y-6 flex-1">
        {/* Animated Radar Visualizer */}
        <div className="liquid-glass rounded-3xl p-6 relative overflow-hidden border border-white/[0.08] shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col items-center">
          <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center my-2">
            {/* Concentric distance rings */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20" />
            <div className="absolute inset-8 rounded-full border border-cyan-500/15" />
            <div className="absolute inset-16 rounded-full border border-cyan-500/10" />
            <div className="absolute inset-24 rounded-full border border-cyan-500/10" />

            {/* Crosshairs */}
            <div className="absolute inset-x-0 top-1/2 h-px bg-cyan-500/15" />
            <div className="absolute inset-y-0 left-1/2 w-px bg-cyan-500/15" />

            {/* Rotating sonar radar beam */}
            {isScanning && (
              <div className="absolute inset-0 rounded-full animate-radar origin-center pointer-events-none">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-400/30 via-transparent to-transparent rounded-tl-full" />
              </div>
            )}

            {/* Center Device Beacon (You) */}
            <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 border border-cyan-300/50 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(0,210,255,0.5)]">
              <Smartphone className="w-6 h-6 text-white" />
              <span className="text-[9px] font-bold text-cyan-200 mt-0.5">YOU</span>
            </div>

            {/* Floating nearby device blips on radar */}
            {nearbyDevices.map((dev, index) => {
              const angles = [45, 135, 220, 310, 85, 190];
              const angle = angles[index % angles.length];
              const distanceRad = (dev.distanceApproxMeters || 4) * 8 + 30; // 30 to 110 px from center
              const rad = (angle * Math.PI) / 180;
              const x = Math.cos(rad) * distanceRad;
              const y = Math.sin(rad) * distanceRad;

              const isConnected = dev.status === 'CONNECTED';

              return (
                <div
                  key={dev.deviceId}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                  }}
                  className="absolute z-20 transition-all duration-500 flex flex-col items-center cursor-pointer group"
                  onClick={() => onStartChatWithPeer(dev)}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-transform group-hover:scale-125 ${
                      isConnected
                        ? 'bg-emerald-500 text-slate-950 border border-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.7)]'
                        : 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_10px_rgba(0,210,255,0.4)]'
                    }`}
                  >
                    {dev.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-[9px] font-semibold text-slate-300 mt-1 bg-black/60 px-1 rounded truncate max-w-[60px]">
                    {dev.name.split(' ')[0]}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Radar bottom status info */}
          <div className="w-full flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isScanning ? 'bg-cyan-400 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span className="font-medium text-slate-200">
                {isScanning ? 'Radar sweep in progress (300-400m target)' : 'Radar idle'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px]">
              <span className="font-semibold text-cyan-400">{nearbyDevices.length}</span>
              <span>peer(s) in reach</span>
            </div>
          </div>
        </div>

        {/* Hardware Status Strip */}
        <div className="liquid-glass rounded-2xl p-3.5 border border-white/[0.08] flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-white">Direct Device-to-Device P2P Transport</p>
              <p className="text-[11px] text-slate-400 truncate">
                NIST P-256 ECDH Key Agreement • Wi-Fi Direct &amp; BLE Cluster Topology
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/10 border border-cyan-400/20 text-[11px] font-mono text-cyan-300 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>Encrypted Mesh</span>
          </div>
        </div>

        {/* Nearby Devices List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Discovered Devices</h2>
            <span className="text-xs text-slate-400 tabular-nums">
              {nearbyDevices.length} available
            </span>
          </div>

          {nearbyDevices.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-6 text-center space-y-2 border border-white/[0.06]">
              <Radio className="w-8 h-8 text-slate-500 mx-auto animate-pulse" />
              <p className="text-xs font-semibold text-white">No Haider devices detected nearby</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Tap &quot;Start Scan&quot; above to search for nearby Android devices within direct Bluetooth and Wi-Fi Direct range.
              </p>
            </div>
          ) : (
            nearbyDevices.map((device) => {
              const isConnected = device.status === 'CONNECTED';
              const isConnecting = device.status === 'CONNECTING';

              return (
                <div
                  key={device.deviceId}
                  className="liquid-glass-card rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-400/30 flex items-center justify-center font-display font-bold text-lg text-cyan-200 shrink-0">
                      {device.name.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-white truncate">
                          {device.name}
                        </span>
                        {getStatusBadge(device.status)}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                        <span className="text-[11px] text-cyan-400">{device.fingerprint}</span>
                        <span>·</span>
                        <span className="flex items-center gap-1 text-[11px]">
                          <Signal className="w-3 h-3 text-cyan-400" />
                          {device.rssi ? `${device.rssi} dBm` : '-55 dBm'} (~
                          {device.distanceApproxMeters || 5}m)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions depending on connection status */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {device.isIncomingRequest ? (
                      <>
                        <button
                          onClick={() => acceptConnection(device.deviceId)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs font-semibold flex items-center gap-1 hover:bg-emerald-500/30"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Accept</span>
                        </button>
                        <button
                          onClick={() => rejectConnection(device.deviceId)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-300 border border-red-400/40 text-xs font-semibold flex items-center gap-1 hover:bg-red-500/30"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    ) : isConnected ? (
                      <>
                        <button
                          onClick={() => onStartChatWithPeer(device)}
                          className="px-3.5 py-1.5 rounded-xl liquid-glass-button text-xs font-semibold text-white"
                        >
                          Open Chat
                        </button>
                        <button
                          onClick={() => disconnectDevice(device.deviceId)}
                          className="p-1.5 rounded-xl liquid-glass text-slate-400 hover:text-red-400"
                          title="Disconnect"
                        >
                          <Unlink className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => requestConnection(device.deviceId)}
                        disabled={isConnecting}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                          isConnecting
                            ? 'bg-white/10 text-slate-400 cursor-not-allowed'
                            : 'liquid-glass text-slate-200 hover:text-white hover:border-cyan-400/40'
                        }`}
                      >
                        {isConnecting ? 'Connecting...' : 'Connect'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Offline Pairing QR Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="liquid-glass-elevated max-w-sm w-full rounded-3xl p-6 border border-cyan-400/30 text-center space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <QrCode className="w-5 h-5 text-cyan-400" />
                Offline Device Pairing
              </h3>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Have another physical Android phone scan this QR code to establish a direct zero-server E2EE channel.
            </p>

            <div className="p-4 rounded-2xl bg-[#060B18] border border-cyan-500/30 inline-block shadow-[0_0_30px_rgba(0,210,255,0.2)]">
              {qrCodeDataUrl ? (
                <img src={qrCodeDataUrl} alt="Pairing QR Code" className="w-48 h-48 mx-auto" />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-xs text-slate-400">
                  Generating QR...
                </div>
              )}
            </div>

            <div className="text-[11px] font-mono text-cyan-400/90 break-all">
              Fingerprint: {userProfile?.fingerprint}
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl liquid-glass text-xs font-semibold text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
