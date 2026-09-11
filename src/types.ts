export interface TextSegment {
  id: string;
  text: string;
  lang: 'fr' | 'ar' | 'en' | 'es' | 'de' | 'it' | string;
  langName: string;
  vocalizedText?: string;
  phoneticGuide?: string;
  translationPairId?: string;
  role?: 'source' | 'translation' | 'standalone';
  audioBase64?: string; // segment-level audio if generated
  audioDuration?: number;
}

export interface SegmentationResult {
  detectedPairType: string;
  originalText: string;
  segments: TextSegment[];
}

export interface SynthesisRequest {
  text?: string;
  segments?: Array<{
    id: string;
    text: string;
    lang: string;
    vocalizedText?: string;
  }>;
  voiceName?: 'Kore' | 'Puck' | 'Zephyr' | 'Fenrir' | 'Charon';
  pauseMs?: number;
}

export interface SynthesisResponse {
  success: boolean;
  audioWavBase64?: string;
  durationSeconds?: number;
  format?: string;
  segmentsAudio?: Record<string, string>; // id -> wav base64
  fallbackUsed?: boolean;
  error?: string;
}
