import React, { useState } from 'react';
import { X, User, Sliders, Info, Sparkles } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  onSaveName: (newName: string) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  userName,
  onSaveName,
}: SettingsModalProps) {
  const [tempName, setTempName] = useState(userName);
  const [activeTab, setActiveTab] = useState<'profile' | 'system'>('profile');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempName.trim()) {
      onSaveName(tempName.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 select-none">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#040405]/80 backdrop-blur-md transition-opacity duration-300"
      />

      {/* Dialog Frame */}
      <div className="relative w-full max-w-md rounded-2xl glass-panel shadow-[0_10px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col max-h-[90vh] z-10 animate-fade-in">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900/60 bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-primary" />
            <h2 className="font-extrabold text-sm text-zinc-100 tracking-wider uppercase">
              Control Panel
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-200 transition-colors cursor-pointer outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation tabs */}
        <div className="flex border-b border-zinc-900/60 bg-zinc-950/10 text-xs font-semibold select-none">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-primary text-white bg-primary/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            User Profile
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
              activeTab === 'system'
                ? 'border-primary text-white bg-primary/5'
                : 'border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            System Specs
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {activeTab === 'profile' ? (
            /* Profile Settings Form */
            <form onSubmit={handleSave} className="space-y-4 text-zinc-300">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                  Display Name
                </label>
                <div className="relative flex items-center">
                  <User className="absolute left-3 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    maxLength={20}
                    placeholder="Enter your name"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-primary/55 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 focus:outline-none transition-colors duration-200 font-semibold"
                  />
                </div>
                <p className="text-[10px] text-zinc-600 font-medium">
                  This customizes Aeva's conversational greeting to you on the dashboard.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-900/60 flex justify-end gap-3 select-none">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-transparent text-zinc-400 hover:text-zinc-300 text-xs font-bold transition-all cursor-pointer outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] outline-none active:scale-95"
                >
                  Save Changes
                </button>
              </div>
            </form>
          ) : (
            /* System Info Tab */
            <div className="space-y-5 text-zinc-300 text-sm">
              <div className="space-y-3 glass-panel-light p-4 rounded-xl">
                <div className="flex items-center gap-2.5 text-zinc-200 font-bold text-xs">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>Artificial Intelligence Core</span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-400 font-medium pl-6">
                  <p>Model: <strong className="text-zinc-200">Google Gemini 1.5 Flash</strong></p>
                  <p>Streaming Response: <strong className="text-zinc-200">Enabled</strong></p>
                  <p>Interruption capability: <strong className="text-zinc-200">Enabled (Stop stream)</strong></p>
                </div>
              </div>

              <div className="space-y-3 glass-panel-light p-4 rounded-xl">
                <div className="flex items-center gap-2.5 text-zinc-200 font-bold text-xs">
                  <Info className="w-4 h-4 text-indigo-400" />
                  <span>Branding & Design Specs</span>
                </div>
                <div className="text-xs space-y-1.5 text-zinc-400 font-medium pl-6">
                  <p>Theme: <strong className="text-zinc-200">Deep Obsidian</strong></p>
                  <p>Visual style: <strong className="text-zinc-200">Futuristic / Glassmorphic</strong></p>
                  <p>Storage: <strong className="text-zinc-200">Client Local Storage (v0.1)</strong></p>
                  <p>Release: <strong className="text-zinc-200">Aeva Conversation Core v0.1</strong></p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
