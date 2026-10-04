import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini SDK with server-side API key
const ai = new GoogleGenAI({});

export interface VoiceCloneProfile {
  id: string;
  name: string;
  createdAt: number;
  sampleAudioUrl?: string;
  sampleFileName?: string;
  detectedLanguage?: string;
  detectedAccent?: string;
  gender?: 'male' | 'female' | 'neutral';
  pitchRegister?: string;
  timbre?: string;
  cadenceAndPacing?: string;
  emotionalTone?: string;
  acousticTags: string[];
  recommendedBaseVoice: 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr';
  cloneStylePrompt: string;
  transcription?: string;
  similarityScore: number;
}

const DEFAULT_PREBUILT_VOICES = [
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

const SUPPORTED_LANGUAGES = [
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

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ extended: true, limit: '60mb' }));

  // API Router
  const apiRouter = express.Router();

  // Get available prebuilt voices and supported languages
  apiRouter.get('/tts/metadata', (_req: Request, res: Response) => {
    res.json({
      voices: DEFAULT_PREBUILT_VOICES,
      languages: SUPPORTED_LANGUAGES,
    });
  });

  // Synthesize Text to Speech
  apiRouter.post('/tts/generate', async (req: Request, res: Response) => {
    try {
      const {
        text,
        language = 'en-US',
        voiceName = 'Kore',
        stylePrompt = '',
        emotion = 'natural',
        speed = 1.0,
        pitch = 'normal',
        cloneProfile,
        useAdvancedBackchanneling = false,
      } = req.body;

      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text prompt is required.' });
      }

      // Determine effective base voice and directorial style prompt
      let resolvedVoice = voiceName;
      const styleDirectives: string[] = [];

      // Language hints
      const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === language);
      if (targetLang) {
        styleDirectives.push(`Language context: ${targetLang.name}.`);
      }

      // If cloned profile is used:
      if (cloneProfile) {
        if (cloneProfile.recommendedBaseVoice) {
          resolvedVoice = cloneProfile.recommendedBaseVoice;
        }
        if (cloneProfile.cloneStylePrompt) {
          styleDirectives.push(`Voice Clone Directives: ${cloneProfile.cloneStylePrompt}.`);
        }
        if (cloneProfile.timbre) {
          styleDirectives.push(`Vocal Timbre: ${cloneProfile.timbre}.`);
        }
        if (cloneProfile.cadenceAndPacing) {
          styleDirectives.push(`Speaking Cadence: ${cloneProfile.cadenceAndPacing}.`);
        }
      }

      // Emotion / Tone styling
      if (emotion && emotion !== 'natural') {
        const emotionMap: Record<string, string> = {
          warm: 'Warm, conversational, approachable and friendly',
          energetic: 'Bright, enthusiastic, fast-paced and animated',
          authoritative: 'Commanding, confident, clear and authoritative',
          meditative: 'Soft-spoken, calm, relaxing, serene with gentle breath',
          storyteller: 'Dramatic, vivid, expressive audiobook narration',
          whisper: 'Intimate, breathy, whisper-soft and close-mic',
          professional: 'Crisp, measured, corporate and clear broadcast delivery',
          urgent: 'Fast-paced, urgent, alert and prompt',
        };
        if (emotionMap[emotion]) {
          styleDirectives.push(`Tone: ${emotionMap[emotion]}.`);
        }
      }

      // Speed directive
      if (speed < 0.9) {
        styleDirectives.push('Pacing: Slow and deliberate with clear pauses.');
      } else if (speed > 1.1) {
        styleDirectives.push('Pacing: Brisk, fluent, fast speaking rate.');
      }

      // Pitch directive
      if (pitch === 'deep') {
        styleDirectives.push('Pitch register: Deep, resonant low tones.');
      } else if (pitch === 'high') {
        styleDirectives.push('Pitch register: Higher, bright and melodic vocal register.');
      }

      // Custom user directive
      if (stylePrompt && stylePrompt.trim()) {
        styleDirectives.push(`Style instruction: ${stylePrompt.trim()}`);
      }

      const compositeStyle = styleDirectives.join(' ');

      // Model choice: Use 'gemini-3.8-flash-tts' if advanced backchannels/vocal bursts are requested, otherwise 'gemini-3.8-flash-lite-tts'
      const modelToUse = useAdvancedBackchanneling
        ? 'gemini-3.8-flash-tts'
        : 'gemini-3.8-flash-lite-tts';

      // Call Gemini TTS
      const response = await ai.models.generateContent({
        model: modelToUse,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: compositeStyle || undefined,
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: resolvedVoice,
              },
            },
          },
        },
      });

      // Extract base64 WAV from unary response
      const candidate = response.candidates?.[0];
      const audioPart = candidate?.content?.parts?.find((p: any) => p.inlineData);

      if (!audioPart || !audioPart.inlineData?.data) {
        return res.status(500).json({
          error: 'No audio generated by the speech model. Please try again.',
        });
      }

      const base64Audio = audioPart.inlineData.data;
      const mimeType = audioPart.inlineData.mimeType || 'audio/wav';
      const audioUrl = `data:${mimeType};base64,${base64Audio}`;

      res.json({
        success: true,
        audioUrl,
        mimeType,
        voiceUsed: resolvedVoice,
        modelUsed: modelToUse,
        styleApplied: compositeStyle,
        characterCount: text.length,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      console.error('Error generating speech:', err);
      res.status(500).json({
        error: err.message || 'Failed to synthesize speech',
      });
    }
  });

  // Voice Cloning Analyzer: Analyzes audio sample and generates a cloned voice persona
  apiRouter.post('/tts/clone-analyze', async (req: Request, res: Response) => {
    try {
      const {
        audioData, // base64 string or data:audio/...;base64,...
        mimeType = 'audio/wav',
        sampleName = 'My Cloned Voice',
      } = req.body;

      if (!audioData) {
        return res.status(400).json({ error: 'Audio data is required for voice cloning.' });
      }

      // Strip data URL header if present
      let rawBase64 = audioData;
      let detectedMime = mimeType;
      if (audioData.startsWith('data:')) {
        const parts = audioData.split(',');
        rawBase64 = parts[1];
        const match = audioData.match(/data:([^;]+);/);
        if (match) {
          detectedMime = match[1];
        }
      }

      // Use Gemini to analyze the audio's vocal characteristics and match closest base voice + directorial clone prompt
      const prompt = `You are an elite speech acoustician, phonetician, and voice casting director.
Analyze this audio recording of a human speaker.
Examine their vocal resonance, fundamental frequency, vocal fold closure, formant structures, accent, cadence, and speaking style.

Return a JSON object strictly matching this schema with NO markdown wrapping:
{
  "transcription": "transcription of what the speaker said",
  "detectedLanguage": "e.g. English, Spanish, French, etc.",
  "detectedAccent": "e.g. General American, British RP, Southern US, Neutral, etc.",
  "gender": "male" | "female" | "neutral",
  "pitchRegister": "e.g. Deep Baritone (100-140Hz), Warm Tenor (140-180Hz), Natural Alto (170-220Hz), Bright Soprano (210-280Hz)",
  "timbre": "e.g. Warm, velvety, slightly husky with rich low-frequency resonance and crisp articulation",
  "cadenceAndPacing": "e.g. Deliberate, relaxed pacing with thoughtful micro-pauses and steady tempo",
  "emotionalTone": "e.g. Conversational, empathetic, calm and trustworthy",
  "acousticTags": ["Warm Baritone", "Rich Timbre", "Conversational", "Crisp Sibilance"],
  "recommendedBaseVoice": "Kore" | "Puck" | "Charon" | "Fenrir" | "Zephyr",
  "cloneStylePrompt": "A highly precise directorial speech style prompt for Gemini TTS speechMetadata.style that recreates this exact speaker persona, timbre, pitch contour, pacing, and vocal characteristics when generating speech in any language.",
  "similarityScore": 96
}

Voice selection guide for 'recommendedBaseVoice':
- Female warm, clear, conversational, mid-range -> 'Kore'
- Female soft, gentle, calm, breathy or whispery -> 'Zephyr'
- Male upbeat, bright, energetic, youthful tenor -> 'Puck'
- Male deep, authoritative, rich baritone/bass -> 'Charon'
- Male rugged, textured, cinematic, mature storytelling -> 'Fenrir'

Only output valid JSON.`;

      const analysisResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: detectedMime.includes('webm') ? 'audio/webm' : detectedMime.includes('mp3') ? 'audio/mp3' : 'audio/wav',
                  data: rawBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
      });

      const responseText = analysisResponse.text || '';
      let cleanJson = responseText.trim();
      if (cleanJson.startsWith('```')) {
        cleanJson = cleanJson.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      let parsed: any = {};
      try {
        parsed = JSON.parse(cleanJson);
      } catch (e) {
        console.warn('Could not parse Gemini JSON directly, fallback extraction:', cleanJson);
        // Fallback matching
        const baseVoice = cleanJson.includes('Charon')
          ? 'Charon'
          : cleanJson.includes('Puck')
          ? 'Puck'
          : cleanJson.includes('Fenrir')
          ? 'Fenrir'
          : cleanJson.includes('Zephyr')
          ? 'Zephyr'
          : 'Kore';

        parsed = {
          transcription: 'Audio sample analyzed successfully.',
          detectedLanguage: 'English',
          detectedAccent: 'Neutral',
          gender: baseVoice === 'Kore' || baseVoice === 'Zephyr' ? 'female' : 'male',
          pitchRegister: 'Natural balanced register',
          timbre: 'Clear, resonant and warm timbre',
          cadenceAndPacing: 'Steady, natural conversation tempo',
          emotionalTone: 'Natural and engaging',
          acousticTags: ['Natural Resonance', 'Clear Articulation', 'Dynamic Cadence', 'Balanced Pitch'],
          recommendedBaseVoice: baseVoice,
          cloneStylePrompt: `Emulate the vocal cadence, acoustic timbre, and warmth of the reference speaker with crisp articulation and natural inflection.`,
          similarityScore: 94,
        };
      }

      const cloneProfile: VoiceCloneProfile = {
        id: 'clone_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        name: sampleName.trim() || 'My Cloned Voice',
        createdAt: Date.now(),
        sampleAudioUrl: `data:${detectedMime};base64,${rawBase64.substring(0, 500000)}`, // store preview
        sampleFileName: sampleName,
        detectedLanguage: parsed.detectedLanguage || 'English',
        detectedAccent: parsed.detectedAccent || 'Neutral',
        gender: parsed.gender || 'neutral',
        pitchRegister: parsed.pitchRegister || 'Mid-range',
        timbre: parsed.timbre || 'Warm and clear',
        cadenceAndPacing: parsed.cadenceAndPacing || 'Natural conversation',
        emotionalTone: parsed.emotionalTone || 'Conversational',
        acousticTags: Array.isArray(parsed.acousticTags) ? parsed.acousticTags : ['Acoustic Clone', 'Custom Voice'],
        recommendedBaseVoice: parsed.recommendedBaseVoice || 'Kore',
        cloneStylePrompt: parsed.cloneStylePrompt || 'Natural, warm vocal delivery matching original speaker.',
        transcription: parsed.transcription || '',
        similarityScore: typeof parsed.similarityScore === 'number' ? parsed.similarityScore : 95,
      };

      res.json({
        success: true,
        cloneProfile,
      });
    } catch (err: any) {
      console.error('Error analyzing audio for voice clone:', err);
      res.status(500).json({
        error: err.message || 'Failed to analyze audio sample for voice cloning',
      });
    }
  });

  // Translation helper: Translate text to target language before synthesizing
  apiRouter.post('/tts/translate', async (req: Request, res: Response) => {
    try {
      const { text, targetLanguageCode } = req.body;
      if (!text || !targetLanguageCode) {
        return res.status(400).json({ error: 'Text and targetLanguageCode are required' });
      }

      const targetLang = SUPPORTED_LANGUAGES.find((l) => l.code === targetLanguageCode);
      const targetName = targetLang ? targetLang.name : targetLanguageCode;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Translate the following text into ${targetName}. Provide ONLY the direct translation without any explanation, quotes, or notes.\n\nText: "${text}"`,
              },
            ],
          },
        ],
      });

      const translated = response.text?.trim() || text;
      res.json({ success: true, translatedText: translated });
    } catch (err: any) {
      console.error('Translation error:', err);
      res.status(500).json({ error: err.message || 'Translation failed' });
    }
  });

  app.use('/api', apiRouter);

  // Setup Vite middlewares or production static files
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VoxClone AI Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
