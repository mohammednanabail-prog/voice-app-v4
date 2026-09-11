import React from 'react';
import { Volume2, Sparkles, SlidersHorizontal, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  selectedVoice: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings, selectedVoice }) => {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 shadow-xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                ناطق النصوص
              </h1>
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-200/60">
                <Sparkles className="w-2.5 h-2.5" />
                AI
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              نطق صوتي ذكي للجمل المترجمة (عربي • فرنسي • إنجليزي)
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            id="open-settings-btn"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 active:scale-95 transition-all rounded-lg border border-slate-200/80"
            title="إعدادات الصوت والوقفات"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden sm:inline">الصوت:</span>
            <span className="font-semibold text-indigo-600">{selectedVoice}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
