import React, { useState } from 'react';
import { X, Volume2, Sparkles, Radio, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import { VoiceCloneProfile } from '../types';
import { WaveformVisualizer } from './WaveformVisualizer';

interface VoiceComparisonModalProps {
  clonedVoice: VoiceCloneProfile;
  generatedAudioUrl: string;
  onClose: () => void;
}

export const VoiceComparisonModal: React.FC<VoiceComparisonModalProps> = ({
  clonedVoice,
  generatedAudioUrl,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Acoustic Verification
          </div>
          <h3 className="text-xl font-bold text-white">Side-by-Side Voice Comparison</h3>
          <p className="text-xs text-slate-300 mt-1">
            Compare your original input sample with the neural synthesized output generated using{' '}
            <strong className="text-purple-400">{clonedVoice.name}</strong>.
          </p>
        </div>

        {/* Side-by-side Players */}
        <div className="space-y-5">
          {/* Reference Audio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                1. Original Reference Voice Sample
              </span>
              <span className="text-[11px] text-slate-400">Anchor: {clonedVoice.recommendedBaseVoice}</span>
            </div>
            {clonedVoice.sampleAudioUrl ? (
              <WaveformVisualizer
                audioUrl={clonedVoice.sampleAudioUrl}
                title="Original Source Sample"
                subtitle="Captured via upload / microphone"
                accentColor="cyan"
              />
            ) : (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 text-center">
                Original reference waveform preview not saved for this sample.
              </div>
            )}
          </div>

          {/* Cloned Output Audio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                2. Neural Cloned Speech Output
              </span>
              <span className="text-[11px] font-mono text-emerald-400">
                {clonedVoice.similarityScore}% Match Confidence
              </span>
            </div>
            <WaveformVisualizer
              audioUrl={generatedAudioUrl}
              title="Synthesized Audio Clip"
              subtitle="Generated with VoxClone neural acoustic profile"
              accentColor="purple"
            />
          </div>
        </div>

        {/* Acoustic Match Breakdown */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Timbre</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Replicated
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Pitch</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Matched
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Cadence</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
              <Check className="w-3 h-3" /> Aligned
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">Fidelity</span>
            <span className="text-xs font-mono font-bold text-purple-400 mt-0.5 block">
              {clonedVoice.similarityScore}%
            </span>
          </div>
        </div>

        {/* Close Action */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
