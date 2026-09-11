import React, { useState } from 'react';
import {
  Sparkles,
  ClipboardPaste,
  Trash2,
  BookOpen,
  Loader2,
  Languages,
  ArrowDown
} from 'lucide-react';

interface TextEditorProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  loadingStep: string;
}

const PRESET_EXAMPLES = [
  {
    label: '🇫🇷 فرنسي - عربي',
    text: `Bonjour, comment allez-vous aujourd'hui ?
أهلاً وسهلاً، كيف حالكم اليوم؟
Je suis très heureux d'apprendre cette langue avec vous.
أنا سعيد جداً بتعلم هذه اللغة معكم.
Bonne journée et à bientôt !
أتمنى لكم يوماً جميلاً وإلى اللقاء قريباً!`
  },
  {
    label: '🇬🇧 إنجليزي - عربي',
    text: `Welcome to our smart language learning platform.
مرحباً بكم في منصتنا الذكية لتعلم اللغات.
Consistency is the secret to mastering any new language.
الاستمرار هو السر لإتقان أي لغة جديدة.
Have a wonderful and productive day!
أتمنى لك يوماً رائعاً ومثمراً!`
  },
  {
    label: '🌍 ثلاثي (فرنسي • إنجليزي • عربي)',
    text: `Le savoir est une force.
Knowledge is power.
المعرفة قوة.`
  }
];

export const TextEditor: React.FC<TextEditorProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading,
  loadingStep,
}) => {
  const [pasteError, setPasteError] = useState<string | null>(null);

  const handlePaste = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          onChange(clipText);
          setPasteError(null);
          return;
        }
      }
    } catch {
      setPasteError('يرجى لصق النص يدوياً داخل المربع');
      setTimeout(() => setPasteError(null), 3000);
    }
  };

  const handleClear = () => {
    onChange('');
  };

  const handleLoadExample = (exampleText: string) => {
    onChange(exampleText);
  };

  return (
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
      {/* Title & Actions Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <label
          htmlFor="mixed-text-input"
          className="flex items-center gap-1.5 text-sm font-bold text-slate-800"
        >
          <Languages className="w-4 h-4 text-indigo-600" />
          <span>النص المختلط والمترجم:</span>
        </label>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePaste}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
            title="لصق من الحافظة"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">لصق النص</span>
          </button>

          {value.trim().length > 0 && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-rose-600 bg-slate-100 hover:bg-rose-50 rounded-lg transition-colors active:scale-95 cursor-pointer"
              title="مسح النص"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مسح</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="mixed-text-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={6}
          dir="auto"
          placeholder="الصق نصك هنا... مثلاً جمل فرنسية مع ترجمتها بالعربية، أو إنجليزية مع عربية:&#10;&#10;Bonjour mon ami. أهلاً صديقي.&#10;Comment vas-tu ? كيف حالك؟"
          className="w-full p-3.5 text-slate-800 text-sm sm:text-base leading-relaxed bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-slate-400 placeholder:text-xs sm:placeholder:text-sm font-normal"
        />

        {value.length > 0 && (
          <div className="text-[11px] text-slate-400 text-left px-1 mt-1 font-mono">
            {value.length} حرف
          </div>
        )}
      </div>

      {pasteError && (
        <p className="text-xs text-amber-600 mt-1">{pasteError}</p>
      )}

      {/* Preset Quick Examples */}
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
            <BookOpen className="w-3 h-3 text-slate-400" />
            أمثلة سريعة للتجربة:
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_EXAMPLES.map((ex, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadExample(ex.text)}
              className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 font-medium border border-slate-200/60 active:scale-95 transition-all cursor-pointer"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-4">
        <button
          id="start-generation-btn"
          type="button"
          disabled={isLoading || !value.trim()}
          onClick={onSubmit}
          className={`w-full py-3.5 px-5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all active:scale-98 cursor-pointer ${
            isLoading || !value.trim()
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              : 'bg-linear-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-indigo-500/25'
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <span>{loadingStep || 'جاري المعالجة والإنشاء...'}</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>بدء الإنشاء والنطق</span>
              <ArrowDown className="w-4 h-4 opacity-70" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
