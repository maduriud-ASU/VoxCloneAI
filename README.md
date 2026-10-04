# VoxClone AI Studio 🎙️

**VoxClone AI Studio** is a neural Text-to-Speech (TTS) and acoustic Voice Cloning application. It allows you to synthesize natural-sounding speech across 20+ global languages, clone unique vocal personas directly from audio files or live microphone recordings, and export audio in studio-grade **WAV** or compressed **MP3** formats.

---

## 🌟 Key Features

### 1. Neural Voice Cloning Lab
- **Multi-Source Audio Ingestion**: Upload an existing voice clip (`WAV`, `MP3`, `M4A`, `WEBM`, `OGG`) or record your voice directly from your browser microphone with a live visual VU meter.
- **Acoustic Persona Extraction**: Uses Gemini multimodal audio analysis to extract vocal timbre, fundamental pitch register, cadence, and speaking mannerisms.
- **Cloned Voice Library**: Save and manage multiple cloned personas. Cloned profiles persist in your browser's local storage for future sessions.
- **Instant Auditioning**: Test your cloned voice with customizable audition phrases before synthesizing longer scripts.
- **Side-by-Side A/B Comparison**: Verify acoustic similarity by playing your original reference recording against the synthesized output.

### 2. Multilingual Speech Studio
- **20+ Supported Languages**: Generate speech in English (US & UK), Spanish, French, German, Italian, Portuguese, Japanese, Korean, Mandarin, Hindi, Arabic, Russian, Dutch, Polish, Turkish, Swedish, Vietnamese, Indonesian, and more.
- **One-Click Script Translation**: Type in your native language and translate text into any selected target language before speech generation.
- **Voice Persona Switching**: Seamlessly switch between your custom cloned voices and high-fidelity prebuilt studio anchors (*Kore*, *Puck*, *Charon*, *Fenrir*, *Zephyr*).
- **Natural Emotion & Style Presets**: Choose from 8 expressive delivery styles (*Warm & Friendly*, *Energetic*, *Authoritative*, *Storyteller*, *Meditative/Calm*, *Whisper*, *Broadcast News*, *Natural*).
- **Acoustic Controls**: Fine-tune speaking speed (0.5x to 2.0x) and pitch contour (deep, balanced, high).
- **Conversational Directives & Bursts**: Insert human backchannels and vocal bursts (`<breath>`, `<laugh>`, `|mhm|`, `|yeah|`) for dialogue realism.

### 3. Audio Export & Waveform Player
- **Dual Format Downloads**: Export generated speech clips as:
  - **WAV**: Lossless 24kHz 16-bit PCM audio.
  - **MP3**: Client-side encoded 128 kbps MP3 for fast sharing.
- **Bulk Export**: Download all generated recordings in your history as MP3 or WAV in one sequence.
- **Interactive Waveform Visualizer**: Real-time canvas waveform with interactive audio scrubbing, playback speed adjustment (0.75x–2.0x), volume control, and continuous loop mode.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Web Audio API
- **Audio Processing**: `@breezystack/lamejs` (client-side MP3 encoding), Web Audio API `AudioContext`
- **Backend**: Node.js, Express, `tsx`, Vite Dev Middleware
- **AI & Speech Models**:
  - `gemini-3.8-flash-lite-tts`: High-efficiency single-speaker speech synthesis.
  - `gemini-3.8-flash-tts`: Expressive vocal design and backchanneling speech synthesis.
  - `gemini-3.8-flash`: Multimodal acoustic voice feature analysis & translation.

---

## 📋 Prerequisites

Before running the application, make sure you have:

1. **Node.js**: Version `18.0.0` or higher (Node `20+` or `22+` recommended).
2. **npm** (or `pnpm` / `bun`).
3. **Gemini API Key**: Obtain a free or paid API key from [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Quick Start Setup

### 1. Clone or Download the Repository

```bash
git clone <repository-url>
cd <repository-directory>
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory by copying `.env.example`:

```bash
cp .env.example .env
```

Open `.env` and provide your Gemini API key:

```env
# Required: Your Gemini API Key from Google AI Studio
GEMINI_API_KEY="AIzaSy..."

# Optional: Port number (defaults to 3000)
PORT=3000
```

### 4. Start the Development Server

```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📖 How to Use the Application

### A. Cloning a Voice
1. Click the **"Voice Cloning Lab"** tab in the top navigation.
2. Select your input method:
   - **File Upload**: Drag and drop an audio file (`WAV`, `MP3`, `M4A`, `WEBM`, `OGG`).
   - **Record Mic**: Grant microphone permissions and speak 1–2 natural sentences (5–30 seconds recommended).
   - **Sample Voices**: Pick one of the built-in reference samples (*Elena*, *Marcus*, or *Julian*) for instant testing.
3. Listen to the preview to verify audio quality.
4. Click **"Analyze & Clone This Voice Persona"**.
5. The neural engine extracts vocal timbre, pitch register, and cadence.
6. Enter an audition phrase and click **"Test Cloned Voice Audio"** to verify the clone.
7. Click **"Use This Cloned Voice in Speech Studio"** to activate it.

### B. Synthesizing Speech in Multiple Languages
1. Navigate to the **"Studio"** tab.
2. Type or paste your script, or click one of the quick sample prompts (*Technology Keynote*, *Storytelling*, *Conversational*, *Travel*).
3. Select your **Target Language** from the dropdown (20+ supported languages).
4. *(Optional)* Click **"Auto-Translate Text to Language"** if you want your text translated into the target language before speaking.
5. In the right panel, select your voice source:
   - **Cloned Voice**: Select any voice you previously cloned.
   - **Prebuilt Voices**: Choose between *Kore*, *Puck*, *Charon*, *Fenrir*, or *Zephyr*.
6. Customize the delivery style:
   - Choose an **Emotion & Expressiveness** preset.
   - Adjust **Speaking Speed** slider (0.5x – 2.0x).
   - Select **Pitch Register Contour** (*deep*, *normal*, *high*).
   - Add custom directorial notes in **Custom Vocal Direction**.
7. Click **"Synthesize Speech"**.
8. Listen to the generated waveform audio with the interactive scrubber.

### C. Exporting Audio (MP3 & WAV)
- **From the Waveform Player**: Click the **MP3** or **WAV** buttons on the bottom-right of the player card.
- **From the History Tab**: Click the **"Library"** tab in the top navigation to view all past generations.
  - Download individual files via **"Download MP3"** or **"Download WAV"**.
  - Use **"Export All as MP3"** or **"Export All as WAV"** in the top toolbar to export all filtered clips in bulk.

---

## 📁 Project Structure

```text
├── index.html                 # HTML entry point with metadata
├── metadata.json              # App capabilities and permissions
├── package.json               # Dependencies and scripts
├── server.ts                  # Express server & Gemini API endpoints
├── src/
│   ├── App.tsx                # Main application state and tab router
│   ├── main.tsx               # React DOM root entry point
│   ├── index.css              # Global styles (Tailwind CSS)
│   ├── types.ts               # TypeScript data models and interfaces
│   ├── utils/
│   │   └── audioUtils.ts      # Audio encoders, WAV generator, MP3 converter
│   └── components/
│       ├── Navbar.tsx         # Navigation header and active voice badge
│       ├── TTSStudio.tsx      # Main text-to-speech creation workspace
│       ├── VoiceCloningLab.tsx# Audio recording, upload, analysis & cloning
│       ├── AudioHistory.tsx   # History management, search & bulk export
│       ├── VoiceComparisonModal.tsx # Side-by-side A/B voice verification
│       └── WaveformVisualizer.tsx   # Canvas audio waveform scrubber & player
├── tsconfig.json              # TypeScript configuration
└── vite.config.ts             # Vite configuration with Tailwind CSS plugin
```

---

## 🔌 API Endpoints Reference

The backend runs on Express (`server.ts`):

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/tts/metadata` | Returns available prebuilt voices and supported languages. |
| `POST` | `/api/tts/generate` | Synthesizes text into speech using `gemini-3.8-flash-lite-tts` or `gemini-3.8-flash-tts` with persona directives. |
| `POST` | `/api/tts/clone-analyze` | Analyzes audio samples using Gemini multimodal audio capabilities to extract acoustic profiles. |
| `POST` | `/api/tts/translate` | Translates script text into the target language using Gemini. |

---

## 🛠️ Production Build & Deployment

To create an optimized production build:

```bash
npm run build
```

To run the production server:

```bash
npm run start
```

---

## ❓ Troubleshooting

1. **Microphone Access Denied**:
   - Ensure your browser has granted microphone permissions. Check your browser's address bar permissions icon.
2. **Missing Gemini API Key Error**:
   - Verify that your `.env` file contains `GEMINI_API_KEY="your-key"` and that there are no extra spaces or quotes around the key.
3. **Audio Playback Blocked**:
   - Some browsers block autoplay. Click the play button directly on the waveform visualizer to start audio.

---

## 📄 License

This project is licensed under the Apache 2.0 License.
