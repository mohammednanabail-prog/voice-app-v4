import React from 'react';
import { X, Sliders, Sparkles, Check, Volume2 } from 'lucide-react';

interface VoiceSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVoice: string;
  onSelectVoice: (v: string) => void;
  pauseMs: number;
  onSelectPauseMs: (ms: number) => void;
}

const VOICES = [
  { id: 'Kore', name: 'Kore (افتراضي)', desc: 'صوت واضح، متزن ومثالي للغات المتعددة' },
  { id: 'Puck', name: 'Puck', desc: 'نبرة حيوية وودودة' },
  { id: 'Zephyr', name: 'Zephyr', desc: 'نبرة هادئة ودافئة' },
  { id: 'Fenrir', name: 'Fenrir', desc: 'نبرة عميقة وقوية' },
  { id: 'Charon', name: 'Charon', desc: 'نبرة رخيمة وثابتة' },
];

const PAUSE_OPTIONS = [
  { ms: 400, label: '0.4 ثانية (سريع)' },
  { ms: 600, label: '0.6 ثانية (موصى به)' },
  { ms: 900, label: '0.9 ثانية (وقفة واضحة)' },
  { ms: 1200, label: '1.2 ثانية (للتكرار والترديد)' },
];

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
  isOpen,
  onClose,
  selectedVoice,
  onSelectVoice,
  pauseMs,
  onSelectPauseMs,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-100 overflow-hidden relative"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">إعدادات النطق والتسجيل</h2>
              <p className="text-xs text-slate-500">تخصيص نبرة الصوت والوقفات بين الجمل</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 my-4">
          {/* Voice selection */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              نبرة الصوت (Gemini Voice):
            </label>
            <div className="space-y-1.5">
              {VOICES.map((voice) => {
                const isSelected = selectedVoice === voice.id;
                return (
                  <button
                    key={voice.id}
                    type="button"
                    onClick={() => onSelectVoice(voice.id)}
                    className={`w-full text-right p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{voice.name}</div>
                      <div className="text-[11px] text-slate-500 font-normal">
                        {voice.desc}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pause duration between sentences */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              الوقفة الفاصلة بين الجمل المترجمة:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PAUSE_OPTIONS.map((opt) => {
                const isSelected = pauseMs === opt.ms;
                return (
                  <button
                    key={opt.ms}
                    type="button"
                    onClick={() => onSelectPauseMs(opt.ms)}
                    className={`p-2 text-center rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 active:scale-98 transition-all"
          >
            حفظ وإغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
