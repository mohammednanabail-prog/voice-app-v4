/**
 * Audio helpers for base64 WAV handling, Web Speech synthesis fallback,
 * and audio downloading.
 */

// Convert Base64 string to a Blob URL (auto-detects WAV vs MP3)
export function base64ToBlobUrl(base64Data: string, mimeType?: string): string {
  // Strip data URL prefix if present
  const cleanBase64 = base64Data.replace(/^data:audio\/\w+;base64,/, '');

  let detectedMime = mimeType;
  if (!detectedMime) {
    if (cleanBase64.startsWith('UklGR')) {
      detectedMime = 'audio/wav';
    } else {
      detectedMime = 'audio/mpeg';
    }
  }

  const byteCharacters = atob(cleanBase64);
  const byteArrays: Uint8Array[] = [];

  const sliceSize = 512;
  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  const blob = new Blob(byteArrays, { type: detectedMime });
  return URL.createObjectURL(blob);
}

// Download an audio blob URL or base64
export function triggerDownload(urlOrBase64: string, filename: string = 'multilingual-speech.mp3') {
  let downloadUrl = urlOrBase64;
  let isCreated = false;

  if (urlOrBase64.startsWith('data:') || !urlOrBase64.startsWith('blob:')) {
    downloadUrl = base64ToBlobUrl(urlOrBase64);
    isCreated = true;
  }

  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (isCreated) {
    setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
  }
}

// Format seconds to mm:ss
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Client-side Web Speech fallback for playing a single segment or testing pronunciation
export function speakWithWebSpeech(
  text: string,
  lang: string,
  onEnd?: () => void,
  rate: number = 0.9
): boolean {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;

  // Language mapping
  if (lang === 'fr') utterance.lang = 'fr-FR';
  else if (lang === 'ar') utterance.lang = 'ar-SA';
  else if (lang === 'en') utterance.lang = 'en-US';
  else if (lang === 'es') utterance.lang = 'es-ES';
  else if (lang === 'de') utterance.lang = 'de-DE';
  else utterance.lang = lang;

  // Select best voice if available
  const voices = window.speechSynthesis.getVoices();
  const matchedVoice = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(lang));
  if (matchedVoice) {
    utterance.voice = matchedVoice;
  }

  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = () => onEnd();
  }

  window.speechSynthesis.speak(utterance);
  return true;
}

// Client-side sequential speech for fallback
export function playSequenceWithWebSpeech(
  segments: Array<{ text: string; lang: string; vocalizedText?: string }>,
  onSegmentChange?: (index: number) => void,
  onFinished?: () => void
): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onFinished?.();
    return () => {};
  }

  let isCancelled = false;
  window.speechSynthesis.cancel();

  let currentIndex = 0;

  const playNext = () => {
    if (isCancelled || currentIndex >= segments.length) {
      onFinished?.();
      return;
    }

    const seg = segments[currentIndex];
    onSegmentChange?.(currentIndex);

    const utterance = new SpeechSynthesisUtterance(seg.vocalizedText || seg.text);
    utterance.rate = 0.95;

    if (seg.lang === 'fr') utterance.lang = 'fr-FR';
    else if (seg.lang === 'ar') utterance.lang = 'ar-SA';
    else if (seg.lang === 'en') utterance.lang = 'en-US';
    else utterance.lang = seg.lang;

    // Pick suitable voice
    const voices = window.speechSynthesis.getVoices();
    const matched = voices.find(v => v.lang.startsWith(utterance.lang) || v.lang.includes(seg.lang));
    if (matched) utterance.voice = matched;

    utterance.onend = () => {
      if (isCancelled) return;
      currentIndex++;
      // Brief pause between segments
      setTimeout(playNext, 600);
    };

    utterance.onerror = () => {
      if (isCancelled) return;
      currentIndex++;
      setTimeout(playNext, 400);
    };

    window.speechSynthesis.speak(utterance);
  };

  playNext();

  return () => {
    isCancelled = true;
    window.speechSynthesis.cancel();
  };
}

// Check if browser supports Web Speech
export function isWebSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
