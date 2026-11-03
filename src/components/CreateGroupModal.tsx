import React, { useState } from 'react';
import { Users, X, Check, ShieldCheck, Radio } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (groupId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated,
}) => {
  const { nearbyDevices, createGroup, userProfile } = useApp();

  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDevices, setSelectedDevices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const toggleSelectDevice = (deviceId: string) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId) ? prev.filter((id) => id !== deviceId) : [...prev, deviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const groupId = await createGroup(groupName.trim(), description.trim(), selectedDevices);
      setIsSubmitting(false);
      setGroupName('');
      setDescription('');
      setSelectedDevices([]);
      onClose();
      if (onGroupCreated) onGroupCreated(groupId);
    } catch (err) {
      console.error('Error creating group', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="liquid-glass-elevated max-w-md w-full rounded-3xl p-6 border border-white/[0.12] space-y-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center text-purple-300">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Create Offline Group</h3>
              <p className="text-xs text-slate-400">Zero-server encrypted mesh</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Group Name *</label>
            <input
              type="text"
              required
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Field Operation Alpha"
              className="w-full py-2.5 px-3.5 text-sm rounded-xl liquid-glass-input text-white placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Private team communication channel..."
              className="w-full py-2 px-3.5 text-sm rounded-xl liquid-glass-input text-white placeholder:text-slate-500 focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">Invite Nearby Devices</span>
              <span className="text-slate-400 tabular-nums">
                {selectedDevices.length} selected
              </span>
            </div>

            {nearbyDevices.length === 0 ? (
              <div className="p-4 rounded-xl liquid-glass text-center text-xs text-slate-400 space-y-1">
                <p>No nearby devices found in discovery range.</p>
                <p className="text-[11px] text-slate-500">
                  You can still create the group now and invite members anytime later!
                </p>
              </div>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
                {nearbyDevices.map((dev) => {
                  const isSelected = selectedDevices.includes(dev.deviceId);
                  return (
                    <div
                      key={dev.deviceId}
                      onClick={() => toggleSelectDevice(dev.deviceId)}
                      className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border-purple-400/40 text-white'
                          : 'liquid-glass border-white/[0.08] text-slate-300 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs text-purple-300">
                          {dev.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate">{dev.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono truncate">
                            {dev.fingerprint}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-purple-500 text-white'
                            : 'border border-slate-600 bg-white/5'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl liquid-glass text-xs font-medium text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!groupName.trim() || isSubmitting}
              className="px-5 py-2 rounded-xl liquid-glass-button text-xs font-bold text-white flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating Group...' : 'Create & Encrypt'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
