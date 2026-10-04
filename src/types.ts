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

export interface PrebuiltVoice {
  id: string;
  name: string;
  gender: string;
  style: string;
  tags: string[];
  samplePrompt: string;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  flag: string;
}

export interface GenerationHistoryItem {
  id: string;
  text: string;
  audioUrl: string;
  languageCode: string;
  languageName: string;
  voiceName: string;
  isClonedVoice: boolean;
  cloneProfileId?: string;
  emotion: string;
  speed: number;
  timestamp: number;
  duration?: number;
}
