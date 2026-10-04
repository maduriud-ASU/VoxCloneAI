import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Download, Repeat, Check } from 'lucide-react';
import { formatTime, downloadFormattedAudio } from '../utils/audioUtils';

interface WaveformVisualizerProps {
  audioUrl: string;
  title?: string;
  subtitle?: string;
  accentColor?: 'emerald' | 'cyan' | 'purple' | 'amber';
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  autoPlay?: boolean;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  audioUrl,
  title,
  subtitle,
  accentColor = 'emerald',
  onTimeUpdate,
  autoPlay = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [downloadingFormat, setDownloadingFormat] = useState<'mp3' | 'wav' | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<'mp3' | 'wav' | null>(null);

  const handleDownload = async (format: 'mp3' | 'wav') => {
    setDownloadingFormat(format);
    try {
      const filename = title ? title.replace(/\s+/g, '_') : 'voxclone_audio';
      await downloadFormattedAudio(audioUrl, filename, format);
      setDownloadSuccess(format);
      setTimeout(() => setDownloadSuccess(null), 2000);
    } catch (err) {
      console.error(`Download ${format} error:`, err);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Decode audio peaks for the waveform
  useEffect(() => {
    let isCancelled = false;

    async function extractPeaks() {
      try {
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        if (isCancelled) return;

        const rawData = audioBuffer.getChannelData(0);
        const samples = 80; // number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const peaks: number[] = [];

        for (let i = 0; i < samples; i++) {
          const start = i * blockSize;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[start + j] || 0);
          }
          peaks.push(Math.min(1, (sum / blockSize) * 4));
        }

        setWaveformData(peaks);
        setDuration(audioBuffer.duration);
      } catch (err) {
        // Generate pseudo-random realistic speech peaks if decode fails (e.g. streaming or synthetic)
        const pseudoPeaks: number[] = [];
        for (let i = 0; i < 80; i++) {
          const val = Math.sin(i * 0.15) * 0.4 + 0.5 + (Math.random() - 0.5) * 0.3;
          pseudoPeaks.push(Math.max(0.1, Math.min(0.95, val)));
        }
        setWaveformData(pseudoPeaks);
      }
    }

    extractPeaks();

    return () => {
      isCancelled = true;
    };
  }, [audioUrl]);

  // Audio element events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.src = audioUrl;
    audio.load();

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
      if (autoPlay) {
        audio.play().catch(() => {});
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(audio.currentTime, audio.duration || duration);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [audioUrl]);

  // Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const peaks = waveformData.length > 0 ? waveformData : new Array(80).fill(0.2);
      const barCount = peaks.length;
      const gap = 3;
      const barWidth = (width - gap * (barCount - 1)) / barCount;
      const progress = duration > 0 ? currentTime / duration : 0;

      peaks.forEach((peak, index) => {
        const x = index * (barWidth + gap);
        const minHeight = 4;
        const barHeight = Math.max(minHeight, peak * (height - 8));
        const y = (height - barHeight) / 2;

        const isPlayed = index / barCount <= progress;

        // Color styles based on accent
        if (isPlayed) {
          if (accentColor === 'cyan') {
            ctx.fillStyle = '#06b6d4'; // cyan-500
          } else if (accentColor === 'purple') {
            ctx.fillStyle = '#a855f7'; // purple-500
          } else if (accentColor === 'amber') {
            ctx.fillStyle = '#f59e0b'; // amber-500
          } else {
            ctx.fillStyle = '#10b981'; // emerald-500
          }
        } else {
          ctx.fillStyle = '#334155'; // slate-700
        }

        // Draw rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [2]);
        ctx.fill();
      });

      // Draw playback needle
      const needleX = progress * width;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(needleX, 0);
      ctx.lineTo(needleX, height);
      ctx.stroke();

      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [waveformData, currentTime, duration, isPlaying, accentColor]);

  // Scrubbing on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = ratio * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(console.error);
    }
  };

  const restart = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    audio.play().catch(console.error);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.8;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.75, 1.0, 1.25, 1.5, 2.0];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
    if (audioRef.current) {
      audioRef.current.loop = !isLooping;
    }
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
      <audio ref={audioRef} />

      {/* Header Info */}
      {(title || subtitle) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h4 className="text-sm font-semibold text-slate-100">{title}</h4>}
            {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
          </div>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}

      {/* Interactive Waveform Canvas */}
      <div className="relative group cursor-pointer w-full bg-slate-950/60 rounded-xl p-2 border border-slate-800/80 mb-3">
        <canvas
          ref={canvasRef}
          width={600}
          height={68}
          onClick={handleCanvasClick}
          className="w-full h-16 block select-none"
        />
        <div className="absolute inset-x-2 bottom-1 flex justify-between pointer-events-none text-[10px] text-slate-500 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-lg transition-transform active:scale-95 ${
              accentColor === 'cyan'
                ? 'bg-cyan-500 hover:bg-cyan-400 shadow-cyan-500/20'
                : accentColor === 'purple'
                ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20'
                : accentColor === 'amber'
                ? 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/20'
                : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
            }`}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
          </button>

          {/* Restart */}
          <button
            onClick={restart}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            title="Replay from start"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Loop toggle */}
          <button
            onClick={toggleLoop}
            className={`p-2 rounded-lg transition-colors ${
              isLooping ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
            title="Toggle Loop"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Speed switcher */}
          <button
            onClick={cyclePlaybackRate}
            className="px-2 py-1 text-xs font-mono font-medium rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700"
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>

        {/* Right side: Volume & Download */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-slate-200 transition-colors p-1"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="flex items-center gap-1.5">
            {/* MP3 Download */}
            <button
              onClick={() => handleDownload('mp3')}
              disabled={downloadingFormat !== null}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                downloadSuccess === 'mp3'
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700'
              }`}
              title="Download as MP3"
            >
              {downloadingFormat === 'mp3' ? (
                <div className="w-3 h-3 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
              ) : downloadSuccess === 'mp3' ? (
                <Check className="w-3.5 h-3.5 text-purple-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-purple-400" />
              )}
              <span>MP3</span>
            </button>

            {/* WAV Download */}
            <button
              onClick={() => handleDownload('wav')}
              disabled={downloadingFormat !== null}
              className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                downloadSuccess === 'wav'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white border-slate-700'
              }`}
              title="Download as WAV"
            >
              {downloadingFormat === 'wav' ? (
                <div className="w-3 h-3 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin" />
              ) : downloadSuccess === 'wav' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Download className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>WAV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
