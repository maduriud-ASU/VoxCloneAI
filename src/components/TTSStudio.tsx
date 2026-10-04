import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Languages,
  Sliders,
  Volume2,
  Wand2,
  Check,
  Radio,
  FileText,
  Zap,
  Layers,
  ChevronDown,
  Info,
  Mic,
} from 'lucide-react';
import { SupportedLanguage, PrebuiltVoice, VoiceCloneProfile, GenerationHistoryItem } from '../types';
import { WaveformVisualizer } from './WaveformVisualizer';

interface TTSStudioProps {
  languages: SupportedLanguage[];
  prebuiltVoices: PrebuiltVoice[];
  clonedVoices: VoiceCloneProfile[];
  activeCloneVoice: VoiceCloneProfile | null;
  onSelectCloneVoice: (voice: VoiceCloneProfile | null) => void;
  onOpenCloningLab: () => void;
  onAudioGenerated: (item: GenerationHistoryItem) => void;
  onOpenCompare: (clonedVoice: VoiceCloneProfile, generatedAudioUrl: string) => void;
}

const SAMPLE_SCRIPTS = [
  {
    title: 'Technology Keynote',
    text: 'Welcome everyone. Today we are introducing a breakthrough in neural acoustic synthesis that allows anyone to clone and personalize natural speech across languages with near-zero latency.',
  },
  {
    title: 'Storytelling & Fantasy',
    text: 'The ancient gates had remained sealed for centuries, covered in luminous moss. <breath> As the wind swept through the canyon, a low hum resonated from beneath the stone archway.',
  },
  {
    title: 'Conversational Dialogue',
    text: 'Hey there! |mhm| I was thinking we should review the latest audio engineering benchmarks before the team sync tomorrow.',
  },
  {
    title: 'Global Travel & Culture',
    text: 'Beneath the cherry blossoms of Kyoto, the morning light filters through ancient cedar pagodas as temple bells ring peacefully across the misty hills.',
  },
];

const EMOTION_PRESETS = [
  { id: 'natural', label: 'Natural / Neutral', desc: 'Balanced conversational tone' },
  { id: 'warm', label: 'Warm & Friendly', desc: 'Welcoming, approachable and empathetic' },
  { id: 'energetic', label: 'Energetic & Bright', desc: 'Upbeat, enthusiastic and animated' },
  { id: 'authoritative', label: 'Authoritative', desc: 'Commanding, confident and steady' },
  { id: 'storyteller', label: 'Storyteller / Dramatic', desc: 'Expressive audiobook narration' },
  { id: 'meditative', label: 'Meditative & Calm', desc: 'Gentle, soothing breath and relaxed' },
  { id: 'whisper', label: 'Whisper / Intimate', desc: 'Soft-spoken, close-mic whisper' },
  { id: 'professional', label: 'Broadcast News', desc: 'Crisp corporate and news delivery' },
];

export const TTSStudio: React.FC<TTSStudioProps> = ({
  languages,
  prebuiltVoices,
  clonedVoices,
  activeCloneVoice,
  onSelectCloneVoice,
  onOpenCloningLab,
  onAudioGenerated,
  onOpenCompare,
}) => {
  const [text, setText] = useState(
    'Welcome to VoxClone Studio! Enter your text here, pick any language, and synthesize natural speech with prebuilt models or your custom cloned voice persona.'
  );
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [voiceSource, setVoiceSource] = useState<'clone' | 'prebuilt'>(
    activeCloneVoice ? 'clone' : clonedVoices.length > 0 ? 'clone' : 'prebuilt'
  );
  const [selectedPrebuiltVoice, setSelectedPrebuiltVoice] = useState<string>('Kore');
  const [selectedEmotion, setSelectedEmotion] = useState<string>('natural');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<'normal' | 'deep' | 'high'>('normal');
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [useBackchanneling, setUseBackchanneling] = useState<boolean>(false);

  // Translation state
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [translationSuccess, setTranslationSuccess] = useState<boolean>(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [latestAudioUrl, setLatestAudioUrl] = useState<string | null>(null);
  const [generationMeta, setGenerationMeta] = useState<any | null>(null);

  // Translate text helper
  const handleTranslate = async () => {
    if (!text.trim()) return;
    setIsTranslating(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/tts/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLanguageCode: selectedLanguage,
        }),
      });
      const data = await res.json();
      if (data.success && data.translatedText) {
        setText(data.translatedText);
        setTranslationSuccess(true);
        setTimeout(() => setTranslationSuccess(false), 2500);
      }
    } catch (err: any) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  // Synthesize Speech
  const handleGenerate = async () => {
    if (!text.trim()) {
      setErrorMessage('Please enter text to synthesize.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    const isUsingClone = voiceSource === 'clone' && activeCloneVoice;
    const targetVoice = isUsingClone ? activeCloneVoice.recommendedBaseVoice : selectedPrebuiltVoice;

    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: selectedLanguage,
          voiceName: targetVoice,
          cloneProfile: isUsingClone ? activeCloneVoice : undefined,
          emotion: selectedEmotion,
          speed,
          pitch,
          stylePrompt,
          useAdvancedBackchanneling: useBackchanneling,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to synthesize speech');
      }

      setLatestAudioUrl(data.audioUrl);
      setGenerationMeta(data);

      const targetLang = languages.find((l) => l.code === selectedLanguage);
      const historyItem: GenerationHistoryItem = {
        id: 'gen_' + Date.now(),
        text,
        audioUrl: data.audioUrl,
        languageCode: selectedLanguage,
        languageName: targetLang ? targetLang.name : selectedLanguage,
        voiceName: isUsingClone ? activeCloneVoice.name : selectedPrebuiltVoice,
        isClonedVoice: !!isUsingClone,
        cloneProfileId: isUsingClone ? activeCloneVoice.id : undefined,
        emotion: selectedEmotion,
        speed,
        timestamp: Date.now(),
      };

      onAudioGenerated(historyItem);
    } catch (err: any) {
      console.error('TTS Generation error:', err);
      setErrorMessage(err.message || 'Error communicating with Speech synthesis service.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Insert vocal burst or tag into text
  const insertVocalTag = (tag: string) => {
    setText((prev) => prev + ` ${tag} `);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Active Cloned Voice Banner (if active) */}
      {voiceSource === 'clone' && activeCloneVoice && (
        <div className="bg-gradient-to-r from-purple-950/60 via-slate-900 to-purple-950/60 border border-purple-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Using Cloned Voice: {activeCloneVoice.name}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {activeCloneVoice.similarityScore}% match
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 line-clamp-1">{activeCloneVoice.timbre}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {latestAudioUrl && (
              <button
                onClick={() => onOpenCompare(activeCloneVoice, latestAudioUrl)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-purple-300 border border-purple-500/30 transition-colors"
              >
                Compare with Original
              </button>
            )}
            <button
              onClick={onOpenCloningLab}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-md transition-colors"
            >
              Manage Clones
            </button>
          </div>
        </div>
      )}

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Script & Input Area (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            {/* Header: Script area & Presets */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                Script / Text Input
              </h3>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-mono">{text.length} chars</span>
                <button
                  onClick={() => setText('')}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Quick Script Prompts */}
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs text-slate-500 py-1 flex items-center gap-1">
                <Wand2 className="w-3 h-3" /> Samples:
              </span>
              {SAMPLE_SCRIPTS.map((sample, i) => (
                <button
                  key={i}
                  onClick={() => setText(sample.text)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  {sample.title}
                </button>
              ))}
            </div>

            {/* Textarea */}
            <div className="relative mb-3">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Type or paste the words you want synthesized..."
                rows={6}
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-2xl p-4 text-sm text-slate-100 placeholder-slate-500 outline-none resize-none transition-all leading-relaxed font-sans"
              />
            </div>

            {/* Vocal burst tags helper */}
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
              <span className="text-slate-400">Insert Natural Directives:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => insertVocalTag('<breath>')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                  title="Insert breath pause"
                >
                  &lt;breath&gt;
                </button>
                <button
                  onClick={() => insertVocalTag('<laugh>')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                  title="Insert laughter inflection"
                >
                  &lt;laugh&gt;
                </button>
                <button
                  onClick={() => insertVocalTag('|mhm|')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                  title="Backchanneling affirmation"
                >
                  |mhm|
                </button>
                <button
                  onClick={() => insertVocalTag('|yeah|')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] border border-slate-700"
                  title="Backchanneling agreement"
                >
                  |yeah|
                </button>
              </div>
            </div>

            {/* Language & Translate Toolbar */}
            <div className="mt-5 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-emerald-400" />
                  Target Language (20+ supported)
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                >
                  {languages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name} ({lang.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleTranslate}
                  disabled={isTranslating || !text.trim()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
                >
                  {isTranslating ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Translating Script...</span>
                    </>
                  ) : translationSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Translated to Selected Language!</span>
                    </>
                  ) : (
                    <>
                      <Languages className="w-3.5 h-3.5" />
                      <span>Auto-Translate Text to Language</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generate Action Button */}
            <div className="mt-6">
              {errorMessage && (
                <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                  {errorMessage}
                </div>
              )}

              <button
                onClick={handleGenerate}
                disabled={isGenerating || !text.trim()}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm text-white shadow-xl transition-all active:scale-[0.99] flex items-center justify-center gap-3 disabled:opacity-50 ${
                  voiceSource === 'clone'
                    ? 'bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-600/25'
                    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-600/25'
                }`}
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synthesizing Audio via Gemini Audio Neural Engine...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>
                      Synthesize Speech {voiceSource === 'clone' ? `with Cloned Voice (${activeCloneVoice?.name})` : ''}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Waveform Output Player (if generated) */}
          {latestAudioUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Generated Speech Result
                </span>
                {generationMeta && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    Model: {generationMeta.modelUsed} • Voice: {generationMeta.voiceUsed}
                  </span>
                )}
              </div>

              <WaveformVisualizer
                audioUrl={latestAudioUrl}
                title="Synthesized Audio Clip"
                subtitle={`Language: ${selectedLanguage} • Voice: ${
                  voiceSource === 'clone' && activeCloneVoice ? activeCloneVoice.name : selectedPrebuiltVoice
                }`}
                accentColor={voiceSource === 'clone' ? 'purple' : 'emerald'}
                autoPlay={true}
              />
            </div>
          )}
        </div>

        {/* Right Column: Voice Selection & Acoustic Tuning (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/85 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-6">
            {/* Voice Source Switcher */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Voice Source Selection
              </label>
              <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
                <button
                  onClick={() => setVoiceSource('clone')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    voiceSource === 'clone'
                      ? 'bg-purple-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Cloned Voice ({clonedVoices.length})
                </button>
                <button
                  onClick={() => setVoiceSource('prebuilt')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    voiceSource === 'prebuilt'
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Prebuilt Voices
                </button>
              </div>
            </div>

            {/* TAB: CLONED VOICES SELECTION */}
            {voiceSource === 'clone' && (
              <div className="space-y-3">
                {clonedVoices.length === 0 ? (
                  <div className="p-5 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                    <p className="text-xs text-slate-400 mb-3">You haven't cloned any voices yet.</p>
                    <button
                      onClick={onOpenCloningLab}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md transition-colors"
                    >
                      + Clone a Voice from Audio Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Choose a Cloned Persona:</span>
                      <button
                        onClick={onOpenCloningLab}
                        className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                      >
                        + Clone Another Voice
                      </button>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {clonedVoices.map((voice) => {
                        const isSelected = activeCloneVoice?.id === voice.id;
                        return (
                          <div
                            key={voice.id}
                            onClick={() => onSelectCloneVoice(voice)}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-purple-950/40 border-purple-500/80 ring-1 ring-purple-500/50'
                                : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {voice.name}
                                {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                {voice.similarityScore}% match
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1">{voice.timbre}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB: PREBUILT VOICES SELECTION */}
            {voiceSource === 'prebuilt' && (
              <div className="space-y-2">
                <span className="text-xs text-slate-400">Select Acoustic Base Persona:</span>
                <div className="grid grid-cols-1 gap-2">
                  {prebuiltVoices.map((voice) => {
                    const isSelected = selectedPrebuiltVoice === voice.name;
                    return (
                      <div
                        key={voice.name}
                        onClick={() => setSelectedPrebuiltVoice(voice.name)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-950/30 border-emerald-500/80 ring-1 ring-emerald-500/50'
                            : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-white flex items-center gap-1.5">
                            {voice.name} ({voice.gender})
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </span>
                          <span className="text-[10px] text-slate-400">{voice.style}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {voice.tags.map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800/80 text-slate-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Emotion / Tone Presets */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Emotion & Expressiveness
              </label>
              <select
                value={selectedEmotion}
                onChange={(e) => setSelectedEmotion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              >
                {EMOTION_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label} — {preset.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Speaking Rate / Speed Control */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Speaking Speed</span>
                <span className="text-xs font-mono text-emerald-400">{speed.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={speed}
                onChange={(e) => setSpeed(parseFloat(e.target.value))}
                className="w-full bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500 h-1.5"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Rapid)</span>
              </div>
            </div>

            {/* Pitch Tuning */}
            <div className="pt-2 border-t border-slate-800">
              <span className="block text-xs font-medium text-slate-300 mb-2">Pitch Register Contour</span>
              <div className="grid grid-cols-3 gap-2">
                {(['deep', 'normal', 'high'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPitch(p)}
                    className={`py-1.5 text-xs font-medium rounded-xl capitalize transition-all border ${
                      pitch === p
                        ? 'bg-slate-800 text-white border-emerald-500/60'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Directorial Style Instruction */}
            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Custom Vocal Direction (Optional)
              </label>
              <input
                type="text"
                value={stylePrompt}
                onChange={(e) => setStylePrompt(e.target.value)}
                placeholder="e.g. Whispered with awe, suspenseful pauses"
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
