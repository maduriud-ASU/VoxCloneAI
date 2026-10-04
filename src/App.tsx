import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { TTSStudio } from './components/TTSStudio';
import { VoiceCloningLab } from './components/VoiceCloningLab';
import { AudioHistory } from './components/AudioHistory';
import { VoiceComparisonModal } from './components/VoiceComparisonModal';
import {
  SupportedLanguage,
  PrebuiltVoice,
  VoiceCloneProfile,
  GenerationHistoryItem,
} from './types';

const INITIAL_LANGUAGES: SupportedLanguage[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'es-MX', name: 'Spanish (Latin America)', flag: '🇲🇽' },
  { code: 'fr-FR', name: 'French', flag: '🇫🇷' },
  { code: 'de-DE', name: 'German', flag: '🇩🇪' },
  { code: 'it-IT', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt-BR', name: 'Portuguese (Brazil)', flag: '🇧🇷' },
  { code: 'ja-JP', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko-KR', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)', flag: '🇨🇳' },
  { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
  { code: 'ar-SA', name: 'Arabic', flag: '🇸🇦' },
  { code: 'ru-RU', name: 'Russian', flag: '🇷🇺' },
  { code: 'nl-NL', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl-PL', name: 'Polish', flag: '🇵🇱' },
  { code: 'tr-TR', name: 'Turkish', flag: '🇹🇷' },
  { code: 'sv-SE', name: 'Swedish', flag: '🇸🇪' },
  { code: 'vi-VN', name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'id-ID', name: 'Indonesian', flag: '🇮🇩' },
];

const INITIAL_PREBUILT_VOICES: PrebuiltVoice[] = [
  {
    id: 'Kore',
    name: 'Kore',
    gender: 'Female',
    style: 'Warm, balanced, articulate & expressive',
    tags: ['Conversational', 'Warm', 'Natural', 'Clear'],
    samplePrompt: 'Natural and welcoming tone with gentle pacing and warm inflection',
  },
  {
    id: 'Puck',
    name: 'Puck',
    gender: 'Male',
    style: 'Playful, upbeat, bright & engaging',
    tags: ['Upbeat', 'Energetic', 'Youthful', 'Dynamic'],
    samplePrompt: 'Energetic and spirited delivery with crisp diction and lively rhythm',
  },
  {
    id: 'Charon',
    name: 'Charon',
    gender: 'Male',
    style: 'Deep, resonant, authoritative & steady',
    tags: ['Deep Baritone', 'Authoritative', 'Documentary', 'Calm'],
    samplePrompt: 'Deep baritone with steady, commanding authority and deliberate cadence',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    gender: 'Male',
    style: 'Rugged, textured, cinematic & expressive',
    tags: ['Storyteller', 'Cinematic', 'Resonant', 'Textured'],
    samplePrompt: 'Rich storytelling tone with subtle gravel and dramatic weight',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    gender: 'Female',
    style: 'Soft, calm, soothing & intimate',
    tags: ['Meditative', 'Calm', 'Gentle', 'Whisper-soft'],
    samplePrompt: 'Gentle, soothing voice with soft breath and relaxed, peaceful pacing',
  },
];

export default function App() {
  const [currentTab, setCurrentTab] = useState<'studio' | 'clone' | 'history'>('studio');
  const [languages, setLanguages] = useState<SupportedLanguage[]>(INITIAL_LANGUAGES);
  const [prebuiltVoices, setPrebuiltVoices] = useState<PrebuiltVoice[]>(INITIAL_PREBUILT_VOICES);

  // Cloned voices stored in state and localStorage
  const [clonedVoices, setClonedVoices] = useState<VoiceCloneProfile[]>(() => {
    try {
      const saved = localStorage.getItem('voxclone_voices');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCloneVoice, setActiveCloneVoice] = useState<VoiceCloneProfile | null>(() => {
    try {
      const saved = localStorage.getItem('voxclone_active_voice');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // History stored in state and localStorage
  const [history, setHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('voxclone_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Comparison modal state
  const [compareModalData, setCompareModalData] = useState<{
    clonedVoice: VoiceCloneProfile;
    generatedAudioUrl: string;
  } | null>(null);

  // Sync cloned voices with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxclone_voices', JSON.stringify(clonedVoices));
    } catch (e) {
      console.error(e);
    }
  }, [clonedVoices]);

  // Sync active voice with localStorage
  useEffect(() => {
    try {
      if (activeCloneVoice) {
        localStorage.setItem('voxclone_active_voice', JSON.stringify(activeCloneVoice));
      } else {
        localStorage.removeItem('voxclone_active_voice');
      }
    } catch (e) {
      console.error(e);
    }
  }, [activeCloneVoice]);

  // Sync history with localStorage
  useEffect(() => {
    try {
      localStorage.setItem('voxclone_history', JSON.stringify(history));
    } catch (e) {
      console.error(e);
    }
  }, [history]);

  // Fetch server metadata on mount
  useEffect(() => {
    fetch('/api/tts/metadata')
      .then((res) => res.json())
      .then((data) => {
        if (data.languages && data.languages.length > 0) setLanguages(data.languages);
        if (data.voices && data.voices.length > 0) setPrebuiltVoices(data.voices);
      })
      .catch((err) => console.log('Using default client metadata:', err));
  }, []);

  const handleSaveCloneVoice = (voice: VoiceCloneProfile) => {
    setClonedVoices((prev) => {
      const existing = prev.findIndex((v) => v.id === voice.id);
      if (existing >= 0) {
        const copy = [...prev];
        copy[existing] = voice;
        return copy;
      }
      return [voice, ...prev];
    });
    setActiveCloneVoice(voice);
  };

  const handleDeleteCloneVoice = (id: string) => {
    setClonedVoices((prev) => prev.filter((v) => v.id !== id));
    if (activeCloneVoice?.id === id) {
      setActiveCloneVoice(null);
    }
  };

  const handleAudioGenerated = (item: GenerationHistoryItem) => {
    setHistory((prev) => [item, ...prev]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleOpenCompare = (clonedVoice: VoiceCloneProfile, generatedAudioUrl: string) => {
    setCompareModalData({ clonedVoice, generatedAudioUrl });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white">
      {/* Studio Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        activeCloneVoice={activeCloneVoice}
        historyCount={history.length}
        clonedCount={clonedVoices.length}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'studio' && (
          <TTSStudio
            languages={languages}
            prebuiltVoices={prebuiltVoices}
            clonedVoices={clonedVoices}
            activeCloneVoice={activeCloneVoice}
            onSelectCloneVoice={setActiveCloneVoice}
            onOpenCloningLab={() => setCurrentTab('clone')}
            onAudioGenerated={handleAudioGenerated}
            onOpenCompare={handleOpenCompare}
          />
        )}

        {currentTab === 'clone' && (
          <VoiceCloningLab
            clonedVoices={clonedVoices}
            activeCloneVoice={activeCloneVoice}
            onSelectCloneVoice={setActiveCloneVoice}
            onSaveCloneVoice={handleSaveCloneVoice}
            onDeleteCloneVoice={handleDeleteCloneVoice}
            onSwitchToStudio={() => setCurrentTab('studio')}
          />
        )}

        {currentTab === 'history' && (
          <AudioHistory
            history={history}
            onClearHistory={handleClearHistory}
            onDeleteHistoryItem={handleDeleteHistoryItem}
          />
        )}
      </main>

      {/* Side-by-side Voice Comparison Modal */}
      {compareModalData && (
        <VoiceComparisonModal
          clonedVoice={compareModalData.clonedVoice}
          generatedAudioUrl={compareModalData.generatedAudioUrl}
          onClose={() => setCompareModalData(null)}
        />
      )}
    </div>
  );
}
