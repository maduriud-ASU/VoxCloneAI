import React from 'react';
import { Mic, Waves, History, Sparkles, Radio } from 'lucide-react';
import { VoiceCloneProfile } from '../types';

interface NavbarProps {
  currentTab: 'studio' | 'clone' | 'history';
  onSelectTab: (tab: 'studio' | 'clone' | 'history') => void;
  activeCloneVoice: VoiceCloneProfile | null;
  historyCount: number;
  clonedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  activeCloneVoice,
  historyCount,
  clonedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-white">VoxClone</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                STUDIO AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Multilingual TTS & Acoustic Voice Cloning</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onSelectTab('studio')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'studio'
                ? 'bg-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>

          <button
            onClick={() => onSelectTab('clone')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'clone'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Voice Cloning Lab</span>
            {clonedCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  currentTab === 'clone' ? 'bg-purple-800 text-white' : 'bg-slate-800 text-purple-400'
                }`}
              >
                {clonedCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              currentTab === 'history'
                ? 'bg-slate-800 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Library</span>
            {historyCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  currentTab === 'history' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {historyCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right status badge */}
        <div className="hidden md:flex items-center gap-3">
          {activeCloneVoice ? (
            <div
              onClick={() => onSelectTab('clone')}
              className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 text-xs hover:border-purple-500/60 transition-colors"
            >
              <Radio className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span className="font-medium truncate max-w-[120px]">{activeCloneVoice.name}</span>
            </div>
          ) : (
            <div
              onClick={() => onSelectTab('clone')}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs hover:text-slate-200 transition-colors"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span>Clone Voice</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
