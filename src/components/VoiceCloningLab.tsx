import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Upload,
  Sparkles,
  CheckCircle2,
  Volume2,
  Trash2,
  Radio,
  FileAudio,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  Languages,
  Zap,
} from 'lucide-react';
import { VoiceCloneProfile } from '../types';
import { blobToBase64, createSyntheticSampleAudio } from '../utils/audioUtils';
import { WaveformVisualizer } from './WaveformVisualizer';

interface VoiceCloningLabProps {
  clonedVoices: VoiceCloneProfile[];
  activeCloneVoice: VoiceCloneProfile | null;
  onSelectCloneVoice: (voice: VoiceCloneProfile) => void;
  onSaveCloneVoice: (voice: VoiceCloneProfile) => void;
  onDeleteCloneVoice: (id: string) => void;
  onSwitchToStudio: () => void;
}

export const VoiceCloningLab: React.FC<VoiceCloningLabProps> = ({
  clonedVoices,
  activeCloneVoice,
  onSelectCloneVoice,
  onSaveCloneVoice,
  onDeleteCloneVoice,
  onSwitchToStudio,
}) => {
  const [sourceType, setSourceType] = useState<'upload' | 'record' | 'demo'>('upload');
  const [voiceName, setVoiceName] = useState('My Custom Voice');
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState('audio/wav');
  const [fileName, setFileName] = useState('');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const recordCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [newlyClonedVoice, setNewlyClonedVoice] = useState<VoiceCloneProfile | null>(null);

  // Audition state
  const [isAuditioning, setIsAuditioning] = useState(false);
  const [auditionAudioUrl, setAuditionAudioUrl] = useState<string | null>(null);
  const [auditionPhrase, setAuditionPhrase] = useState('Hello! This is my cloned voice speaking in VoxClone Studio.');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Clean up recording timers
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, []);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setAnalysisError(null);
    setFileName(file.name);
    if (!voiceName || voiceName === 'My Custom Voice') {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setVoiceName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    try {
      const base64 = await blobToBase64(file);
      setAudioBase64(base64);
      setAudioUrl(URL.createObjectURL(file));
      setMimeType(file.type || 'audio/wav');
    } catch (err: any) {
      setAnalysisError('Failed to read audio file. Please try another audio file.');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Start Live Recording
  const startRecording = async () => {
    setAnalysisError(null);
    setAudioUrl(null);
    setAudioBase64(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      // Draw real-time live VU / waveform
      const drawLiveVisualizer = () => {
        const canvas = recordCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height;
          // Gradient from emerald to cyan
          ctx.fillStyle = `rgb(${Math.min(255, 40 + dataArray[i])}, 220, 160)`;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(drawLiveVisualizer);
      };

      drawLiveVisualizer();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);
        setAudioBase64(base64);
        setAudioUrl(URL.createObjectURL(blob));
        setMimeType('audio/webm');
        setFileName('Microphone_Recording.webm');

        // Stop stream tracks
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = window.setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setAnalysisError('Microphone permission denied or device not found: ' + err.message);
    }
  };

  // Stop Live Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
  };

  // Load Demo Voice Sample
  const loadDemoSample = async (sampleType: 'warm' | 'deep' | 'bright', sampleLabel: string) => {
    setAnalysisError(null);
    setVoiceName(sampleLabel);
    setFileName(`${sampleLabel.toLowerCase().replace(/\s+/g, '_')}_sample.wav`);
    try {
      const generatedBlobUrl = await createSyntheticSampleAudio(sampleType);
      const res = await fetch(generatedBlobUrl);
      const blob = await res.blob();
      const base64 = await blobToBase64(blob);
      setAudioUrl(generatedBlobUrl);
      setAudioBase64(base64);
      setMimeType('audio/wav');
    } catch (err) {
      console.error('Failed to load demo voice:', err);
    }
  };

  // Analyze & Clone Voice
  const handleAnalyzeAndClone = async () => {
    if (!audioBase64) {
      setAnalysisError('Please provide an audio sample first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setNewlyClonedVoice(null);

    try {
      const res = await fetch('/api/tts/clone-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioData: audioBase64,
          mimeType,
          sampleName: voiceName || 'Cloned Voice',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Voice analysis failed');
      }

      const profile: VoiceCloneProfile = data.cloneProfile;
      setNewlyClonedVoice(profile);
      onSaveCloneVoice(profile);
      onSelectCloneVoice(profile);
    } catch (err: any) {
      console.error('Voice cloning error:', err);
      setAnalysisError(err.message || 'Failed to clone voice. Please check network and audio sample.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Audition Cloned Voice
  const handleAudition = async () => {
    const targetVoice = newlyClonedVoice || activeCloneVoice;
    if (!targetVoice) return;

    setIsAuditioning(true);
    try {
      const res = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: auditionPhrase,
          language: 'en-US',
          cloneProfile: targetVoice,
          voiceName: targetVoice.recommendedBaseVoice,
        }),
      });

      const data = await res.json();
      if (data.success && data.audioUrl) {
        setAuditionAudioUrl(data.audioUrl);
      }
    } catch (err) {
      console.error('Audition error:', err);
    } finally {
      setIsAuditioning(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Banner / Title */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/30 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-3 tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Acoustic Voice Cloning Engine
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Clone Any Voice from Audio
            </h2>
            <p className="text-slate-300 text-sm md:text-base mt-2 leading-relaxed">
              Add any audio recording or speak into your microphone. Our neural acoustic engine extracts vocal timbre,
              frequency contour, resonance, and cadence to clone the exact persona for multilingual speech synthesis.
            </p>
          </div>

          {activeCloneVoice && (
            <div className="bg-slate-800/80 border border-emerald-500/40 rounded-2xl p-4 flex items-center gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400 block">
                  Active Cloned Voice
                </span>
                <span className="text-sm font-bold text-white">{activeCloneVoice.name}</span>
                <span className="text-xs text-slate-400 block">{activeCloneVoice.timbre}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Cloning Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Audio Input (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-purple-400" />
                1. Provide Voice Audio Sample
              </h3>

              {/* Source Mode Switcher */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setSourceType('upload')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sourceType === 'upload'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> File Upload
                  </span>
                </button>
                <button
                  onClick={() => setSourceType('record')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sourceType === 'record'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Mic className="w-3.5 h-3.5" /> Record Mic
                  </span>
                </button>
                <button
                  onClick={() => setSourceType('demo')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sourceType === 'demo'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Sample Voices
                  </span>
                </button>
              </div>
            </div>

            {/* Voice Name Input */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Voice Name / Label</label>
              <input
                type="text"
                value={voiceName}
                onChange={(e) => setVoiceName(e.target.value)}
                placeholder="e.g. My Podcast Voice, Professor Miller, Founder Pitch"
                className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>

            {/* TAB 1: FILE UPLOAD */}
            {sourceType === 'upload' && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                  isDragging
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-slate-700/80 hover:border-slate-600 bg-slate-950/40'
                }`}
              >
                <input
                  type="file"
                  id="audio-upload"
                  accept="audio/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
                  className="hidden"
                />
                <label htmlFor="audio-upload" className="cursor-pointer block">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/10 border border-purple-500/30 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                    <Upload className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-semibold text-white">
                    Drop your audio recording here, or <span className="text-purple-400 underline">browse</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">
                    Supports WAV, MP3, M4A, WEBM, OGG, AAC (5s - 60s recommended for optimal cloning)
                  </p>
                </label>
              </div>
            )}

            {/* TAB 2: LIVE MICROPHONE RECORDING */}
            {sourceType === 'record' && (
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 text-center">
                <canvas
                  ref={recordCanvasRef}
                  width={400}
                  height={60}
                  className="w-full h-14 bg-slate-900/50 rounded-xl mb-4 border border-slate-800"
                />

                <div className="flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm shadow-lg shadow-red-600/30 transition-all active:scale-95"
                    >
                      <Mic className="w-4 h-4" /> Start Recording
                    </button>
                  ) : (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-medium animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        REC {recordingDuration}s
                      </div>
                      <button
                        onClick={stopRecording}
                        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm border border-slate-700 transition-all active:scale-95"
                      >
                        <Square className="w-4 h-4 fill-current text-red-400" /> Stop & Preview
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                  Read 1-2 natural sentences clearly into your mic to capture your vocal pitch and timbre.
                </p>
              </div>
            )}

            {/* TAB 3: DEMO VOICE SAMPLES */}
            {sourceType === 'demo' && (
              <div className="space-y-2.5">
                <p className="text-xs text-slate-400 mb-2">
                  Don't have a file ready? Click a curated reference sample below to test instant cloning:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => loadDemoSample('warm', 'Elena - Conversational Warm')}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white group-hover:text-purple-400">Elena</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-400">Female</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Warm, conversational, melodic cadence</p>
                  </button>

                  <button
                    onClick={() => loadDemoSample('deep', 'Marcus - Deep Baritone')}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white group-hover:text-purple-400">Marcus</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">Male</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Authoritative, deep resonance, steady pacing</p>
                  </button>

                  <button
                    onClick={() => loadDemoSample('bright', 'Julian - Upbeat Tech')}
                    className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-purple-500/60 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-white group-hover:text-purple-400">Julian</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400">Male</span>
                    </div>
                    <p className="text-[11px] text-slate-400">Energetic, crisp diction, brisk tempo</p>
                  </button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {analysisError && (
              <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs">
                {analysisError}
              </div>
            )}

            {/* Audio Preview Waveform (if loaded) */}
            {audioUrl && (
              <div className="mt-5 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Audio Sample Loaded: {fileName}
                  </span>
                </div>
                <WaveformVisualizer
                  audioUrl={audioUrl}
                  title="Source Reference Audio"
                  subtitle="Listen to ensure clarity before cloning"
                  accentColor="purple"
                />

                <div className="mt-4">
                  <button
                    onClick={handleAnalyzeAndClone}
                    disabled={isAnalyzing}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-purple-600/30 transition-all active:scale-[0.99] disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Extracting Acoustic Timbre & Frequency Contour...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Analyze & Clone This Voice Persona</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cloned Voice Result & Audition (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {newlyClonedVoice ? (
            <div className="bg-slate-900/90 border border-purple-500/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden backdrop-blur-md">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Voice Cloned Successfully</h4>
                    <span className="text-xs text-emerald-400 font-mono">
                      {newlyClonedVoice.similarityScore}% Acoustic Similarity
                    </span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  {(newlyClonedVoice.gender || 'neutral').toUpperCase()}
                </span>
              </div>

              {/* Persona Attributes */}
              <div className="space-y-3 bg-slate-950/70 rounded-2xl p-4 border border-slate-800/80 mb-4 text-xs">
                <div>
                  <span className="text-slate-400 block font-medium">Timbre & Resonance</span>
                  <span className="text-slate-100 font-medium">{newlyClonedVoice.timbre}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block font-medium">Pitch Register</span>
                    <span className="text-slate-200">{newlyClonedVoice.pitchRegister}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Cadence</span>
                    <span className="text-slate-200">{newlyClonedVoice.cadenceAndPacing}</span>
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Base Acoustic Anchor</span>
                  <span className="text-purple-400 font-mono font-semibold">
                    {newlyClonedVoice.recommendedBaseVoice}
                  </span>
                </div>
                {newlyClonedVoice.transcription && (
                  <div>
                    <span className="text-slate-400 block font-medium">Sample Transcription</span>
                    <p className="text-slate-300 italic line-clamp-2">"{newlyClonedVoice.transcription}"</p>
                  </div>
                )}
              </div>

              {/* Acoustic Tags */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {newlyClonedVoice.acousticTags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Audition Cloned Voice Section */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-purple-400" />
                  Audition Your Cloned Voice:
                </span>
                <input
                  type="text"
                  value={auditionPhrase}
                  onChange={(e) => setAuditionPhrase(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
                <button
                  onClick={handleAudition}
                  disabled={isAuditioning}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition-colors"
                >
                  {isAuditioning ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Synthesizing Audition Clip...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Test Cloned Voice Audio</span>
                    </>
                  )}
                </button>

                {auditionAudioUrl && (
                  <div className="mt-3">
                    <WaveformVisualizer
                      audioUrl={auditionAudioUrl}
                      title="Audition Preview"
                      subtitle="Synthesized with your cloned persona"
                      accentColor="cyan"
                      autoPlay={true}
                    />
                  </div>
                )}

                <button
                  onClick={onSwitchToStudio}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all mt-4"
                >
                  <Sparkles className="w-4 h-4" />
                  Use This Cloned Voice in Speech Studio →
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-500 flex items-center justify-center mb-4">
                <Sliders className="w-8 h-8" />
              </div>
              <h4 className="text-base font-semibold text-slate-200">No Cloned Persona Yet</h4>
              <p className="text-xs text-slate-400 mt-2 max-w-xs">
                Upload or record an audio sample on the left, then click <strong>"Analyze & Clone"</strong> to extract
                the voice persona.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cloned Voices Library / Rack */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400" />
              Your Cloned Voices Library ({clonedVoices.length})
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Voices you cloned earlier. Select any voice to activate it across 20+ languages in the Speech Studio.
            </p>
          </div>
        </div>

        {clonedVoices.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/80">
            <p className="text-sm text-slate-400">
              No saved cloned voices. Clone a voice above to store it in your library for future sessions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clonedVoices.map((voice) => {
              const isActive = activeCloneVoice?.id === voice.id;
              return (
                <div
                  key={voice.id}
                  className={`rounded-2xl p-4 border transition-all ${
                    isActive
                      ? 'bg-slate-800/90 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        {voice.name}
                        {isActive && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono rounded bg-emerald-500/20 text-emerald-400 uppercase">
                            Active
                          </span>
                        )}
                      </h4>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Anchor: <span className="text-purple-400 font-mono">{voice.recommendedBaseVoice}</span> •{' '}
                        {voice.similarityScore}% match
                      </span>
                    </div>

                    <button
                      onClick={() => onDeleteCloneVoice(voice.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition-colors"
                      title="Delete Cloned Voice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 mb-3 bg-slate-900/60 p-2 rounded-lg border border-slate-800/60">
                    {voice.timbre}
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        onSelectCloneVoice(voice);
                        onSwitchToStudio();
                      }}
                      className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isActive ? 'Use in Studio' : 'Select Voice'}
                    </button>

                    {voice.sampleAudioUrl && (
                      <button
                        onClick={() => {
                          const audio = new Audio(voice.sampleAudioUrl);
                          audio.play().catch(console.error);
                        }}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Play reference snippet"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
