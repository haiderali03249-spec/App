import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Send,
  Paperclip,
  Smile,
  Mic,
  Square,
  Image as ImageIcon,
  FileText,
  Video,
  FileArchive,
  Music,
  Check,
  CheckCheck,
  Clock,
  Reply,
  Copy,
  Trash2,
  RefreshCw,
  Download,
  ShieldCheck,
  Users,
  Play,
  Pause,
  X,
  Lock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DeviceAttachment, DeviceMessage, DiscoveredDevice, GroupChat } from '../types';

interface ChatScreenProps {
  onBack: () => void;
  onOpenGroupDetails?: () => void;
}

const COMMON_EMOJIS = ['👍', '❤️', '😊', '🔥', '🎉', '👏', '😂', '🤝', '🔒', '🚀', '✨', '⚡'];

export const ChatScreen: React.FC<ChatScreenProps> = ({ onBack, onOpenGroupDetails }) => {
  const {
    currentChatId,
    currentChatType,
    messages,
    sendMessage,
    deleteMessage,
    conversations,
    groups,
    nearbyDevices,
    userProfile,
  } = useApp();

  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<DeviceMessage | null>(null);
  const [activeMediaPreview, setActiveMediaPreview] = useState<DeviceAttachment | null>(null);

  // Voice note recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<any>(null);

  // Audio playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAttachments, setPendingAttachments] = useState<DeviceAttachment[]>([]);

  // Find recipient / group info
  const privatePeer: DiscoveredDevice | undefined =
    currentChatType === 'private'
      ? nearbyDevices.find((d) => d.deviceId === currentChatId) ||
        conversations.find((c) => c.id === currentChatId)?.participantDevice
      : undefined;

  const currentGroup: GroupChat | undefined =
    currentChatType === 'group' ? groups.find((g) => g.id === currentChatId) : undefined;

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    };
  }, []);

  const handleSend = async () => {
    if (!inputText.trim() && pendingAttachments.length === 0) return;
    const textToSend = inputText;
    const attachToSend = [...pendingAttachments];
    const replyTarget = replyingTo || undefined;

    setInputText('');
    setPendingAttachments([]);
    setReplyingTo(null);
    setShowEmojiPicker(false);
    setShowAttachMenu(false);

    await sendMessage(textToSend, attachToSend, replyTarget);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- Voice Note Recording using Web MediaRecorder ---
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const voiceAttachment: DeviceAttachment = {
            id: `audio_${Date.now()}`,
            name: `Voice_Note_${new Date().toLocaleTimeString().replace(/:/g, '-')}.webm`,
            type: 'audio',
            mimeType: 'audio/webm',
            sizeBytes: audioBlob.size,
            dataUrl: base64data,
            isVoiceNote: true,
            durationSeconds: recordingSeconds,
          };
          setPendingAttachments((prev) => [...prev, voiceAttachment]);
        };
        reader.readAsDataURL(audioBlob);

        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Microphone permission not granted or unavailable, creating mock voice note', err);
      // Fallback voice memo simulation
      const mockAttachment: DeviceAttachment = {
        id: `audio_${Date.now()}`,
        name: `Voice_Memo_${Date.now().toString().slice(-4)}.webm`,
        type: 'audio',
        mimeType: 'audio/webm',
        sizeBytes: 32400,
        isVoiceNote: true,
        durationSeconds: 5,
      };
      setPendingAttachments((prev) => [...prev, mockAttachment]);
    }
  };

  const stopVoiceRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const cancelVoiceRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  // --- File Attachment Handler ---
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      let type: DeviceAttachment['type'] = 'file';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';
      else if (file.type === 'application/pdf') type = 'pdf';
      else if (file.name.endsWith('.doc') || file.name.endsWith('.docx')) type = 'doc';
      else if (file.name.endsWith('.zip') || file.name.endsWith('.rar')) type = 'archive';

      const reader = new FileReader();
      reader.onload = () => {
        const attach: DeviceAttachment = {
          id: `file_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type,
          mimeType: file.type || 'application/octet-stream',
          sizeBytes: file.size,
          dataUrl: reader.result as string,
        };
        setPendingAttachments((prev) => [...prev, attach]);
      };
      reader.readAsDataURL(file);
    });

    setShowAttachMenu(false);
  };

  // Trigger file picker with accept filter
  const triggerPicker = (accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.click();
    }
  };

  // Audio Playback
  const togglePlayAudio = (attachmentId: string, dataUrl?: string) => {
    if (playingAudioId === attachmentId) {
      audioElementRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
      }
      if (dataUrl) {
        const audio = new Audio(dataUrl);
        audioElementRef.current = audio;
        audio.onended = () => setPlayingAudioId(null);
        audio.play();
        setPlayingAudioId(attachmentId);
      }
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#060B18] text-slate-100 overflow-hidden relative">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        multiple
        className="hidden"
      />

      {/* Header */}
      <header className="sticky top-0 z-30 px-4 py-3.5 liquid-glass-elevated border-b border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {currentChatType === 'private' ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative shrink-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-400/40 flex items-center justify-center font-display font-bold text-cyan-200">
                  {privatePeer?.name?.charAt(0).toUpperCase() || 'P'}
                </div>
                {privatePeer?.status === 'CONNECTED' && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#060B18]" />
                )}
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{privatePeer?.name || 'Private Chat'}</span>
                  <Lock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <span
                    className={
                      privatePeer?.status === 'CONNECTED' ? 'text-emerald-400 font-medium' : ''
                    }
                  >
                    {privatePeer?.status === 'CONNECTED'
                      ? 'Direct P2P Link Active'
                      : 'Offline Encrypted'}
                  </span>
                  <span>·</span>
                  <span className="font-mono text-[10px] text-cyan-400/80">
                    {privatePeer?.fingerprint || 'E2EE'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div
              onClick={onOpenGroupDetails}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600/30 to-indigo-600/30 border border-purple-400/40 flex items-center justify-center font-display font-bold text-purple-200">
                <Users className="w-5 h-5 text-purple-300" />
              </div>

              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-white truncate flex items-center gap-1.5">
                  <span className="truncate">{currentGroup?.name || 'Group Chat'}</span>
                  <span className="text-[10px] font-mono bg-purple-500/20 text-purple-300 px-1 rounded">
                    Group
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400 truncate">
                  {currentGroup?.members.length || 0} members · Tap for info
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Security / Encryption Verification Pill */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/20 text-[11px] text-cyan-300">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span>P-256 + AES-GCM</span>
          </div>

          {currentChatType === 'group' && onOpenGroupDetails && (
            <button
              onClick={onOpenGroupDetails}
              className="px-2.5 py-1 rounded-lg liquid-glass text-xs text-slate-300 hover:text-white"
            >
              Members
            </button>
          )}
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {/* Security reassurance banner */}
        <div className="text-center py-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] text-slate-400">
            <ShieldCheck className="w-3 h-3 text-cyan-400" />
            Messages are end-to-end encrypted locally. No server involved.
          </span>
        </div>

        {messages.map((msg) => {
          const isMe = msg.senderId === userProfile?.deviceId;

          return (
            <div
              key={msg.id}
              className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
            >
              {/* Group sender name */}
              {currentChatType === 'group' && !isMe && (
                <span className="text-[11px] font-medium text-purple-400 ml-3 mb-1">
                  {msg.senderName}
                </span>
              )}

              <div
                className={`relative max-w-[85%] sm:max-w-md rounded-2xl p-3 shadow-lg transition-all ${
                  isMe
                    ? 'bg-gradient-to-br from-cyan-600/30 to-blue-600/35 border border-cyan-400/30 text-white rounded-tr-sm'
                    : 'liquid-glass border border-white/[0.12] text-slate-100 rounded-tl-sm'
                }`}
              >
                {/* Quoted Reply snippet */}
                {msg.replyToSnippet && (
                  <div className="mb-2 p-1.5 rounded-lg bg-black/25 border-l-2 border-cyan-400 text-xs text-slate-300">
                    <p className="truncate opacity-80">{msg.replyToSnippet}</p>
                  </div>
                )}

                {/* Attachments rendering */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {msg.attachments.map((att) => (
                      <div key={att.id} className="rounded-xl overflow-hidden bg-black/20">
                        {att.type === 'image' && att.dataUrl ? (
                          <img
                            src={att.dataUrl}
                            alt={att.name}
                            className="max-h-60 w-full object-cover rounded-xl cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setActiveMediaPreview(att)}
                          />
                        ) : att.type === 'video' && att.dataUrl ? (
                          <video src={att.dataUrl} controls className="max-h-60 w-full rounded-xl" />
                        ) : att.type === 'audio' ? (
                          <div className="p-2.5 flex items-center gap-3">
                            <button
                              onClick={() => togglePlayAudio(att.id, att.dataUrl)}
                              className="w-9 h-9 rounded-full bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 flex items-center justify-center shrink-0 hover:bg-cyan-500/30 transition-colors"
                            >
                              {playingAudioId === att.id ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4 ml-0.5" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">{att.name}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                <span>{att.durationSeconds ? `${att.durationSeconds}s` : 'Voice note'}</span>
                                <span>·</span>
                                <span>{formatFileSize(att.sizeBytes)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Document / Archive / PDF
                          <div className="p-2.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-300 shrink-0">
                                {att.type === 'pdf' ? (
                                  <FileText className="w-4 h-4" />
                                ) : att.type === 'archive' ? (
                                  <FileArchive className="w-4 h-4" />
                                ) : (
                                  <FileText className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-medium text-white truncate">{att.name}</p>
                                <span className="text-[10px] text-slate-400">
                                  {formatFileSize(att.sizeBytes)}
                                </span>
                              </div>
                            </div>

                            {att.dataUrl && (
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                className="w-8 h-8 rounded-lg liquid-glass flex items-center justify-center text-cyan-400 hover:text-white shrink-0"
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Message Text */}
                {msg.text && (
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {msg.text}
                  </p>
                )}

                {/* Bottom Metadata: Timestamp + Delivery Receipt Check */}
                <div className="flex items-center justify-end gap-1.5 mt-1 text-[10px] text-slate-400">
                  <span className="tabular-nums">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>

                  {isMe && (
                    <span>
                      {msg.status === 'sending' && <Clock className="w-3 h-3 text-slate-400" />}
                      {msg.status === 'sent' && <Check className="w-3 h-3 text-slate-400" />}
                      {msg.status === 'delivered' && (
                        <CheckCheck className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      {msg.status === 'read' && (
                        <CheckCheck className="w-3.5 h-3.5 text-cyan-400" />
                      )}
                      {msg.status === 'failed' && (
                        <span className="text-red-400 font-bold">!</span>
                      )}
                    </span>
                  )}
                </div>

                {/* Hover Action Strip */}
                <div
                  className={`absolute -top-7 ${
                    isMe ? 'right-0' : 'left-0'
                  } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 p-1 rounded-xl liquid-glass shadow-md z-10`}
                >
                  <button
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 hover:text-cyan-400 text-slate-400"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>
                  {msg.text && (
                    <button
                      onClick={() => copyToClipboard(msg.text)}
                      className="p-1 hover:text-cyan-400 text-slate-400"
                      title="Copy text"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    className="p-1 hover:text-red-400 text-slate-400"
                    title="Delete locally"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingTo && (
        <div className="px-4 py-2 liquid-glass-elevated border-t border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Reply className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-cyan-300">
                Replying to {replyingTo.senderName}
              </span>
              <p className="text-slate-400 truncate text-[11px]">{replyingTo.text}</p>
            </div>
          </div>
          <button
            onClick={() => setReplyingTo(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Pending Attachments Strip */}
      {pendingAttachments.length > 0 && (
        <div className="px-4 py-2 liquid-glass-elevated border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto">
          {pendingAttachments.map((att, idx) => (
            <div
              key={att.id}
              className="relative p-2 rounded-xl liquid-glass border border-cyan-400/30 flex items-center gap-2 text-xs text-white shrink-0"
            >
              <span className="font-medium truncate max-w-[120px]">{att.name}</span>
              <button
                onClick={() =>
                  setPendingAttachments((prev) => prev.filter((_, i) => i !== idx))
                }
                className="text-slate-400 hover:text-red-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker Popover */}
      {showEmojiPicker && (
        <div className="px-4 py-2.5 liquid-glass-elevated border-t border-white/[0.08] flex items-center gap-2 overflow-x-auto">
          {COMMON_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                setInputText((prev) => prev + emoji);
              }}
              className="text-xl p-1.5 hover:bg-white/[0.08] rounded-xl transition-transform active:scale-125"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Attachment Menu Drawer */}
      {showAttachMenu && (
        <div className="px-4 py-3 liquid-glass-elevated border-t border-white/[0.08] grid grid-cols-5 gap-2 text-center text-[11px]">
          <button
            onClick={() => triggerPicker('image/*')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-cyan-300"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
              <ImageIcon className="w-5 h-5" />
            </div>
            <span>Image</span>
          </button>

          <button
            onClick={() => triggerPicker('video/*')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-blue-300"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
              <Video className="w-5 h-5" />
            </div>
            <span>Video</span>
          </button>

          <button
            onClick={() => triggerPicker('.pdf,.doc,.docx,.txt')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-purple-300"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-400/30 flex items-center justify-center text-purple-400">
              <FileText className="w-5 h-5" />
            </div>
            <span>Document</span>
          </button>

          <button
            onClick={() => triggerPicker('audio/*')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-emerald-300"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Music className="w-5 h-5" />
            </div>
            <span>Audio</span>
          </button>

          <button
            onClick={() => triggerPicker('.zip,.rar,.tar,.gz')}
            className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-white/[0.08] text-slate-300 hover:text-amber-300"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <FileArchive className="w-5 h-5" />
            </div>
            <span>ZIP File</span>
          </button>
        </div>
      )}

      {/* Floating Translucent Message Input Dock */}
      <footer className="p-3 liquid-glass-elevated border-t border-white/[0.08] z-30">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {/* Attachment Toggle */}
          <button
            onClick={() => setShowAttachMenu((prev) => !prev)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              showAttachMenu
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          {/* Emoji Toggle */}
          <button
            onClick={() => setShowEmojiPicker((prev) => !prev)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
              showEmojiPicker
                ? 'text-cyan-400 bg-white/[0.08]'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
            }`}
            title="Emoji"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Text Input / Voice Recorder Bar */}
          {isRecording ? (
            <div className="flex-1 flex items-center justify-between px-4 py-2 rounded-xl bg-red-500/15 border border-red-500/40 text-red-200 animate-pulse text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                <span className="font-semibold">Recording voice note... ({recordingSeconds}s)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelVoiceRecording}
                  className="text-slate-400 hover:text-white underline text-[11px]"
                >
                  Cancel
                </button>
                <button
                  onClick={stopVoiceRecording}
                  className="px-2.5 py-1 rounded-lg bg-red-500 text-white font-bold"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type encrypted message..."
              className="flex-1 py-2.5 px-4 text-sm rounded-xl liquid-glass-input text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          )}

          {/* Mic or Send Button */}
          {!inputText.trim() && pendingAttachments.length === 0 ? (
            <button
              onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
              }`}
              title="Voice note"
            >
              {isRecording ? <Square className="w-4 h-4" /> : <Mic className="w-5 h-5" />}
            </button>
          ) : (
            <button
              onClick={handleSend}
              className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-[0_0_15px_rgba(0,210,255,0.4)] hover:opacity-95 transition-transform active:scale-95"
              title="Send"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          )}
        </div>
      </footer>

      {/* Fullscreen Image Preview Modal */}
      {activeMediaPreview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="relative max-w-2xl w-full max-h-[80vh] flex flex-col items-center">
            <button
              onClick={() => setActiveMediaPreview(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-cyan-400"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={activeMediaPreview.dataUrl}
              alt={activeMediaPreview.name}
              className="max-h-[75vh] w-auto rounded-2xl object-contain shadow-2xl"
            />
            <div className="mt-3 text-center">
              <p className="text-sm font-semibold text-white">{activeMediaPreview.name}</p>
              <a
                href={activeMediaPreview.dataUrl}
                download={activeMediaPreview.name}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl liquid-glass-button text-xs text-white"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save to Device</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
