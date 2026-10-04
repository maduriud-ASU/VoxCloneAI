import React, { useState } from 'react';
import {
  History,
  Download,
  Trash2,
  Volume2,
  Sparkles,
  FileAudio,
  Check,
  Search,
  SlidersHorizontal,
  FolderDown,
  Layers,
  Clock,
  Globe,
} from 'lucide-react';
import { GenerationHistoryItem } from '../types';
import { downloadFormattedAudio } from '../utils/audioUtils';
import { WaveformVisualizer } from './WaveformVisualizer';

interface AudioHistoryProps {
  history: GenerationHistoryItem[];
  onClearHistory: () => void;
  onDeleteHistoryItem: (id: string) => void;
}

export const AudioHistory: React.FC<AudioHistoryProps> = ({
  history,
  onClearHistory,
  onDeleteHistoryItem,
}) => {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<'mp3' | 'wav' | null>(null);
  const [downloadSuccessId, setDownloadSuccessId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVoice, setFilterVoice] = useState<string>('all');
  const [isBulkDownloading, setIsBulkDownloading] = useState(false);

  // Filter items
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.voiceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.languageName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVoice =
      filterVoice === 'all'
        ? true
        : filterVoice === 'cloned'
        ? item.isClonedVoice
        : !item.isClonedVoice;

    return matchesSearch && matchesVoice;
  });

  // Handle single download
  const handleDownload = async (item: GenerationHistoryItem, format: 'mp3' | 'wav') => {
    setDownloadingId(item.id);
    setDownloadFormat(format);
    try {
      const cleanVoice = item.voiceName.replace(/\s+/g, '_');
      const cleanLang = item.languageCode.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `VoxClone_${cleanVoice}_${cleanLang}_${new Date(item.timestamp)
        .toISOString()
        .slice(0, 10)}`;

      await downloadFormattedAudio(item.audioUrl, filename, format);

      setDownloadSuccessId(`${item.id}_${format}`);
      setTimeout(() => setDownloadSuccessId(null), 2500);
    } catch (err) {
      console.error(`Failed to export audio as ${format.toUpperCase()}:`, err);
    } finally {
      setDownloadingId(null);
      setDownloadFormat(null);
    }
  };

  // Handle Bulk Export
  const handleBulkDownload = async (format: 'mp3' | 'wav') => {
    if (filteredHistory.length === 0 || isBulkDownloading) return;
    setIsBulkDownloading(true);

    for (let i = 0; i < filteredHistory.length; i++) {
      const item = filteredHistory[i];
      try {
        const cleanVoice = item.voiceName.replace(/\s+/g, '_');
        const filename = `VoxClone_${i + 1}_${cleanVoice}_${format}`;
        await downloadFormattedAudio(item.audioUrl, filename, format);
        // Small delay between downloads to prevent browser throttling
        await new Promise((r) => setTimeout(r, 600));
      } catch (e) {
        console.error('Error during bulk download item', e);
      }
    }

    setIsBulkDownloading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header and Bulk Actions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
              <History className="w-3.5 h-3.5" />
              Audio Export & History Hub
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Generated Audio Library ({history.length})
            </h3>
            <p className="text-xs md:text-sm text-slate-400 mt-1">
              Replay, audit, and export your synthesized speech recordings in professional <strong>MP3</strong> or{' '}
              <strong>WAV</strong> format.
            </p>
          </div>

          {/* Bulk Download & Clear Actions */}
          {history.length > 0 && (
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Bulk Export MP3 */}
              <button
                onClick={() => handleBulkDownload('mp3')}
                disabled={isBulkDownloading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/90 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50"
                title="Download all filtered audio clips as MP3"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All as MP3</span>
              </button>

              {/* Bulk Export WAV */}
              <button
                onClick={() => handleBulkDownload('wav')}
                disabled={isBulkDownloading}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50"
                title="Download all filtered audio clips as WAV"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export All as WAV</span>
              </button>

              {/* Clear History */}
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-red-400 text-xs transition-colors"
                title="Clear all generated history"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter & Search Bar */}
        {history.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search text, voice, or language..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" /> Filter:
              </span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setFilterVoice('all')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterVoice === 'all'
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All ({history.length})
                </button>
                <button
                  onClick={() => setFilterVoice('cloned')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterVoice === 'cloned'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cloned Voices
                </button>
                <button
                  onClick={() => setFilterVoice('prebuilt')}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                    filterVoice === 'prebuilt'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Prebuilt
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {history.length === 0 ? (
        <div className="p-14 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80 shadow-lg">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mb-3">
            <Volume2 className="w-7 h-7" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">No Audio Clips Generated Yet</h4>
          <p className="text-xs text-slate-400 mt-1.5 max-w-sm mx-auto">
            Head to the <strong>Studio</strong> tab to generate speech in any language or with your cloned voice. All
            your synthesized clips will appear here with instant MP3 and WAV export options.
          </p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="p-10 text-center bg-slate-900/40 rounded-3xl border border-slate-800/80">
          <p className="text-sm text-slate-400">No audio clips match your search query or filter.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterVoice('all');
            }}
            className="mt-2 text-xs text-emerald-400 underline hover:text-emerald-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        /* History Items List */
        <div className="space-y-4">
          {filteredHistory.map((item) => {
            const isMp3Downloading = downloadingId === item.id && downloadFormat === 'mp3';
            const isWavDownloading = downloadingId === item.id && downloadFormat === 'wav';
            const isMp3Success = downloadSuccessId === `${item.id}_mp3`;
            const isWavSuccess = downloadSuccessId === `${item.id}_wav`;

            return (
              <div
                key={item.id}
                className="bg-slate-900/85 border border-slate-800 hover:border-slate-700/80 rounded-3xl p-5 shadow-xl backdrop-blur-sm space-y-4 transition-all"
              >
                {/* Item Meta Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
                        item.isClonedVoice
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}
                    >
                      {item.isClonedVoice ? <Sparkles className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      {item.voiceName} {item.isClonedVoice ? '(Cloned Voice)' : ''}
                    </span>

                    <span className="text-xs text-slate-300 font-mono px-2.5 py-0.5 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-slate-400" />
                      {item.languageName}
                    </span>

                    <span className="text-xs text-slate-400 capitalize px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                      {item.emotion} • {item.speed}x speed
                    </span>
                  </div>

                  {/* Actions & Timestamps */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>

                    <button
                      onClick={() => onDeleteHistoryItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-colors"
                      title="Delete recording"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Spoken Text Script */}
                <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3.5">
                  <p className="text-xs text-slate-200 leading-relaxed font-sans italic">"{item.text}"</p>
                </div>

                {/* Audio Waveform Visualizer */}
                <WaveformVisualizer
                  audioUrl={item.audioUrl}
                  title={`${item.voiceName} • ${item.languageName}`}
                  accentColor={item.isClonedVoice ? 'purple' : 'emerald'}
                />

                {/* Dedicated Export Feature Toolbar */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <FileAudio className="w-3.5 h-3.5 text-slate-500" />
                    <span>Export Audio Formats:</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {/* Download as MP3 Button */}
                    <button
                      onClick={() => handleDownload(item, 'mp3')}
                      disabled={isMp3Downloading || isWavDownloading}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                        isMp3Success
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 border-purple-500/30 hover:border-purple-500/50'
                      }`}
                      title="Encode and export compressed MP3 audio (128 kbps)"
                    >
                      {isMp3Downloading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                          <span>Encoding MP3...</span>
                        </>
                      ) : isMp3Success ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>MP3 Exported</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-purple-400" />
                          <span>Download MP3</span>
                          <span className="text-[10px] text-purple-400/70 font-mono font-normal">.mp3</span>
                        </>
                      )}
                    </button>

                    {/* Download as WAV Button */}
                    <button
                      onClick={() => handleDownload(item, 'wav')}
                      disabled={isMp3Downloading || isWavDownloading}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border shadow-sm ${
                        isWavSuccess
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-500/30 hover:border-emerald-500/50'
                      }`}
                      title="Download studio-fidelity uncompressed WAV audio (24kHz 16-bit PCM)"
                    >
                      {isWavDownloading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
                          <span>Preparing WAV...</span>
                        </>
                      ) : isWavSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WAV Exported</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Download WAV</span>
                          <span className="text-[10px] text-emerald-400/70 font-mono font-normal">.wav</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
