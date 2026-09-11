import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { TextEditor } from './components/TextEditor';
import { AudioPlayer } from './components/AudioPlayer';
import { SegmentsList } from './components/SegmentsList';
import { VoiceSettingsModal } from './components/VoiceSettingsModal';
import { TextSegment, SegmentationResult, SynthesisResponse } from './types';
import { base64ToBlobUrl, playSequenceWithWebSpeech, isWebSpeechSupported } from './utils/audioHelper';
import { parseAndSegmentMultilingualText, getNextLanguage } from './utils/languageDetector';
import {
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Headphones,
  Zap,
  Globe2,
  Play,
  Square
} from 'lucide-react';

const INITIAL_TEXT = `Bonjour, comment allez-vous aujourd'hui ?
أهلاً وسهلاً، كيف حالكم اليوم؟
Je suis ravi de vous rencontrer et d'apprendre avec vous.
يسعدني جداً أن ألتقي بكم وأتعلم معكم.
Bonne journée et à la prochaine !
أتمنى لكم يوماً سعيداً وإلى اللقاء القادم!`;

export default function App() {
  const [text, setText] = useState<string>(INITIAL_TEXT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Generated results
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [segments, setSegments] = useState<TextSegment[]>([]);
  const [segmentsAudio, setSegmentsAudio] = useState<Record<string, string>>({});
  const [pairType, setPairType] = useState<string>('فرنسي - عربي');

  // Client Web Speech state
  const [isWebSpeechActive, setIsWebSpeechActive] = useState<boolean>(false);
  const [currentWebSpeechIdx, setCurrentWebSpeechIdx] = useState<number>(-1);
  const stopWebSpeechRef = useRef<(() => void) | null>(null);

  // Settings
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [pauseMs, setPauseMs] = useState<number>(600);

  const playerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (stopWebSpeechRef.current) {
        stopWebSpeechRef.current();
      }
    };
  }, []);

  // Deterministic linguistic segmenter
  const fallbackSegment = (rawText: string): TextSegment[] => {
    return parseAndSegmentMultilingualText(rawText).segments;
  };

  const handleToggleLanguage = (segmentId: string) => {
    setSegments((prev) =>
      prev.map((seg) => {
        if (seg.id === segmentId) {
          const next = getNextLanguage(seg.lang);
          return {
            ...seg,
            lang: next.lang,
            langName: next.langName,
          };
        }
        return seg;
      })
    );
  };

  const handleStartGeneration = async () => {
    if (!text.trim() || isLoading) return;

    if (stopWebSpeechRef.current) {
      stopWebSpeechRef.current();
      stopWebSpeechRef.current = null;
      setIsWebSpeechActive(false);
      setCurrentWebSpeechIdx(-1);
    }

    setIsLoading(true);
    setError(null);
    setNotice(null);
    setAudioUrl(null);
    setSegmentsAudio({});

    try {
      // Step 1: Linguistic segmentation and phonetic vocalization
      setLoadingStep('جاري تحليل وتفكيك اللغات وضبط التشكيل...');
      let analyzedSegments: TextSegment[] = [];
      let detectedPair = 'متعدد اللغات';

      try {
        const analyzeRes = await fetch('/api/analyze-text', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });

        if (analyzeRes.ok) {
          const analyzeData: SegmentationResult = await analyzeRes.json();
          if (analyzeData.segments && analyzeData.segments.length > 0) {
            analyzedSegments = analyzeData.segments;
            detectedPair = analyzeData.detectedPairType || 'متعدد اللغات';
          }
        }
      } catch (_analyzeErr) {
        // Fallback to client segmentation
      }

      if (analyzedSegments.length === 0) {
        analyzedSegments = fallbackSegment(text);
      }

      setSegments(analyzedSegments);
      setPairType(detectedPair);

      // Step 2: Audio synthesis with authentic pronunciation
      setLoadingStep('جاري توليد النطق الصوتي المدمج...');

      const synthRes = await fetch('/api/synthesize-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          segments: analyzedSegments,
          voiceName: selectedVoice,
          pauseMs,
        }),
      });

      if (synthRes.ok) {
        const synthData: SynthesisResponse = await synthRes.json();
        if (synthData.audioWavBase64) {
          const blobUrl = base64ToBlobUrl(synthData.audioWavBase64);
          setAudioUrl(blobUrl);
          setAudioDuration(synthData.durationSeconds || 0);
          setSegmentsAudio(synthData.segmentsAudio || {});

          // Scroll smoothly to player
          setTimeout(() => {
            if (playerRef.current) {
              playerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 150);
          return;
        }
      }

      // If cloud synthesis is rate-limited or busy, inform user and provide in-browser audio
      const errData = await synthRes.json().catch(() => ({}));
      setNotice(
        errData.error ||
          'الخادم الصوتي السحابي تحت ضغط مؤقت. تم إعداد الجمل وتشكيلها، ويمكنك الاستماع إليها فوراً عبر صوت المتصفح.'
      );
    } catch (err: any) {
      setError('تعذر إكمال التوليد الصوتي السحابي. يمكنك الاستماع للجمل بشكل فردي أو متتابع عبر المتصفح.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleToggleWebSpeech = () => {
    if (isWebSpeechActive) {
      if (stopWebSpeechRef.current) {
        stopWebSpeechRef.current();
        stopWebSpeechRef.current = null;
      }
      setIsWebSpeechActive(false);
      setCurrentWebSpeechIdx(-1);
      return;
    }

    if (segments.length === 0) return;

    setIsWebSpeechActive(true);
    setCurrentWebSpeechIdx(0);

    const cancel = playSequenceWithWebSpeech(
      segments,
      (idx) => setCurrentWebSpeechIdx(idx),
      () => {
        setIsWebSpeechActive(false);
        setCurrentWebSpeechIdx(-1);
        stopWebSpeechRef.current = null;
      }
    );

    stopWebSpeechRef.current = cancel;
  };

  const handleSynthesizeSingle = async (segment: TextSegment): Promise<string | null> => {
    try {
      const res = await fetch('/api/tts-single', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: segment.vocalizedText || segment.text,
          lang: segment.lang,
          voiceName: selectedVoice,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return data.audioWavBase64 || null;
      }
    } catch (_e) {
      // Handled gracefully in client
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        selectedVoice={selectedVoice}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 sm:py-7 space-y-5">
        {/* Intro Badges for Mobile */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span>جاهز للاستخدام الفوري بدون تسجيل حساب</span>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50/80 px-2.5 py-1 rounded-full border border-indigo-200/50">
            <Globe2 className="w-3.5 h-3.5" />
            <span>نطق أصلي: فرنسي • عربي • إنجليزي</span>
          </div>
        </div>

        {/* Text Input Section */}
        <section aria-label="محرر النص">
          <TextEditor
            value={text}
            onChange={setText}
            onSubmit={handleStartGeneration}
            isLoading={isLoading}
            loadingStep={loadingStep}
          />
        </section>

        {/* Notice for Cloud Audio Load with Web Speech Alternative */}
        {notice && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{notice}</p>
            </div>
            {segments.length > 0 && isWebSpeechSupported() && (
              <button
                type="button"
                onClick={handleToggleWebSpeech}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-xs shrink-0 active:scale-95 transition-transform"
              >
                {isWebSpeechActive ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>إيقاف القراءة</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>استماع متتابع بالمتصفح</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">تنبيه في إنشاء الصوت</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Audio Player Card (Result) */}
        {audioUrl && (
          <div ref={playerRef} className="space-y-2 pt-2 animate-fade-in">
            <div className="flex items-center justify-between px-1 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1 text-indigo-700">
                <Headphones className="w-3.5 h-3.5" />
                المقطع الصوتي جاهز للاستماع والتنزيل
              </span>
              <span>جودة نقية WAV</span>
            </div>

            <AudioPlayer
              audioUrl={audioUrl}
              duration={audioDuration}
              title="مقطع نطق الجمل والترجمة"
              pairType={pairType}
            />
          </div>
        )}

        {/* Breakdown of Sentences */}
        {segments.length > 0 && (
          <section aria-label="تفاصيل الجمل" className="space-y-3">
            {/* Quick Sequential Web Speech Banner if Cloud Audio is not currently present */}
            {!audioUrl && isWebSpeechSupported() && (
              <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
                <div className="text-xs text-slate-700 font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-indigo-600" />
                  <span>
                    {isWebSpeechActive
                      ? `جاري قراءة الجملة (${currentWebSpeechIdx + 1} من ${segments.length})...`
                      : 'قراءة تسلسلية لكافة الجمل المنطوقة:'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleToggleWebSpeech}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold active:scale-95 transition-transform"
                >
                  {isWebSpeechActive ? (
                    <>
                      <Square className="w-3 h-3 fill-current" />
                      <span>إيقاف</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3 fill-current" />
                      <span>استماع متتابع</span>
                    </>
                  )}
                </button>
              </div>
            )}

            <SegmentsList
              segments={segments}
              segmentsAudio={segmentsAudio}
              pairType={pairType}
              onSynthesizeSingle={handleSynthesizeSingle}
              onToggleLanguage={handleToggleLanguage}
            />
          </section>
        )}

        {/* Feature Highlights Footer Card */}
        <section className="bg-slate-100/80 rounded-2xl p-4 border border-slate-200/60 text-slate-600 text-xs space-y-2.5">
          <h4 className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            مميزات ناطق النصوص الذكي للهاتف:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] leading-relaxed">
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>نطق فرنسي وعربي وإنجليزي أصلي بدقة عالية.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>تنزيل المقطع الصوتي المدمج مباشرة بصيغة WAV.</span>
            </div>
            <div className="flex items-start gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>مجاني تماماً وبدون أي تسجيل دخول أو حساب.</span>
            </div>
          </div>
        </section>
      </main>

      {/* Voice & Pause Settings Modal */}
      <VoiceSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedVoice={selectedVoice}
        onSelectVoice={setSelectedVoice}
        pauseMs={pauseMs}
        onSelectPauseMs={setPauseMs}
      />
    </div>
  );
}
