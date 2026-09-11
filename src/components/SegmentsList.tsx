import React, { useState } from 'react';
import { Volume2, Copy, Check, Sparkles, Flag, VolumeX } from 'lucide-react';
import { TextSegment } from '../types';
import { speakWithWebSpeech, base64ToBlobUrl } from '../utils/audioHelper';

interface SegmentsListProps {
  segments: TextSegment[];
  segmentsAudio?: Record<string, string>;
  pairType?: string;
  onSynthesizeSingle?: (segment: TextSegment) => Promise<string | null>;
  onToggleLanguage?: (segmentId: string) => void;
}

export const SegmentsList: React.FC<SegmentsListProps> = ({
  segments,
  segmentsAudio = {},
  pairType,
  onSynthesizeSingle,
  onToggleLanguage,
}) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!segments || segments.length === 0) return null;

  const getLanguageBadge = (lang: string, langName: string) => {
    switch (lang.toLowerCase()) {
      case 'fr':
        return {
          flag: '🇫🇷',
          label: langName || 'فرنسية',
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          accent: 'border-r-4 border-r-blue-500',
          dir: 'ltr',
        };
      case 'ar':
        return {
          flag: '🇸🇦',
          label: langName || 'عربية',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          accent: 'border-r-4 border-r-emerald-500',
          dir: 'rtl',
        };
      case 'en':
        return {
          flag: '🇬🇧',
          label: langName || 'إنجليزية',
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          accent: 'border-r-4 border-r-purple-500',
          dir: 'ltr',
        };
      default:
        return {
          flag: '🌐',
          label: langName || lang,
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
          accent: 'border-r-4 border-r-indigo-500',
          dir: lang === 'ar' ? 'rtl' : 'ltr',
        };
    }
  };

  const handlePlaySegment = async (segment: TextSegment) => {
    if (playingId === segment.id) {
      setPlayingId(null);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    setPlayingId(segment.id);

    // 1. Check if server returned pre-generated audio for this segment
    const segmentWav = segmentsAudio[segment.id];
    if (segmentWav) {
      const audioUrl = base64ToBlobUrl(segmentWav);
      const audio = new Audio(audioUrl);
      audio.onended = () => setPlayingId(null);
      audio.onerror = () => {
        // Fallback to speech synthesis
        fallbackSpeak(segment);
      };
      audio.play().catch(() => fallbackSpeak(segment));
      return;
    }

    // 2. Or request single TTS from server
    if (onSynthesizeSingle) {
      try {
        const singleWav = await onSynthesizeSingle(segment);
        if (singleWav) {
          const audioUrl = base64ToBlobUrl(singleWav);
          const audio = new Audio(audioUrl);
          audio.onended = () => setPlayingId(null);
          audio.play();
          return;
        }
      } catch (err) {
        console.warn('Single TTS request failed:', err);
      }
    }

    // 3. Fallback to Web Speech
    fallbackSpeak(segment);
  };

  const fallbackSpeak = (segment: TextSegment) => {
    const textToSpeak = segment.vocalizedText || segment.text;
    const ok = speakWithWebSpeech(textToSpeak, segment.lang, () => {
      setPlayingId(null);
    });
    if (!ok) {
      setPlayingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3.5">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <span>تفصيل الجمل المنطوقة</span>
            <span className="text-xs font-normal text-slate-500">
              ({segments.length} جملة)
            </span>
          </h3>
          <p className="text-xs text-slate-500">
            اضغط على أيقونة الصوت لسماع نطق كل جملة على حدة
          </p>
        </div>

        {pairType && (
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
            {pairType}
          </span>
        )}
      </div>

      <div className="space-y-2.5">
        {segments.map((segment, index) => {
          const badge = getLanguageBadge(segment.lang, segment.langName);
          const isPlaying = playingId === segment.id;
          const isCopied = copiedId === segment.id;
          const isArabic = segment.lang === 'ar';

          return (
            <div
              key={segment.id || index}
              className={`p-3 rounded-xl border border-slate-200/80 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${badge.accent}`}
            >
              {/* Segment Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <button
                    type="button"
                    onClick={() => onToggleLanguage && onToggleLanguage(segment.id)}
                    title={onToggleLanguage ? "اضغط لتعديل لغة الجملة" : undefined}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-bold rounded-md border transition-transform ${badge.badgeClass} ${
                      onToggleLanguage ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
                    }`}
                  >
                    <span>{badge.flag}</span>
                    <span>{badge.label}</span>
                  </button>

                  <span className="text-[11px] font-mono text-slate-400">
                    #{index + 1}
                  </span>
                </div>

                {/* Main text */}
                <p
                  dir={badge.dir}
                  className={`text-sm sm:text-base font-semibold text-slate-800 leading-relaxed ${
                    badge.dir === 'ltr' ? 'font-sans' : 'font-cairo'
                  }`}
                >
                  {segment.text}
                </p>

                {/* Diacritized Arabic (Tashkeel) display for learning accuracy */}
                {isArabic && segment.vocalizedText && segment.vocalizedText !== segment.text && (
                  <p
                    dir="rtl"
                    className="text-xs text-indigo-700/90 font-medium mt-1 font-cairo bg-indigo-50/50 px-2 py-0.5 rounded-md inline-block"
                    title="النص مشكول بالحركات لضبط مخارج الحروف"
                  >
                    بالحركات: {segment.vocalizedText}
                  </p>
                )}
              </div>

              {/* Segment Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(segment.id, segment.text)}
                  className="w-9 h-9 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                  title="نسخ النص"
                >
                  {isCopied ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handlePlaySegment(segment)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-lg font-bold text-xs transition-all active:scale-95 cursor-pointer shadow-xs ${
                    isPlaying
                      ? 'bg-rose-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                  title={isPlaying ? 'إيقاف النطق' : 'استمع إلى نطق الجملة'}
                >
                  {isPlaying ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>نطق الجملة</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
