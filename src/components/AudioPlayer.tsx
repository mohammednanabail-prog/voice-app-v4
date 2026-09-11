import React, { useRef, useState, useEffect } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  Gauge,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { formatTime, triggerDownload } from '../utils/audioHelper';

interface AudioPlayerProps {
  audioUrl: string;
  duration?: number;
  title?: string;
  pairType?: string;
  onDownloadSuccess?: () => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  duration = 0,
  title = 'المقطع الصوتي المدمج',
  pairType = 'فرنسي - عربي',
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [totalDuration, setTotalDuration] = useState<number>(duration);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [downloaded, setDownloaded] = useState<boolean>(false);

  // Update total duration when audioUrl changes or audio loads
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDownloaded(false);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [audioUrl]);

  useEffect(() => {
    if (duration > 0) {
      setTotalDuration(duration);
    }
  }, [duration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch((err) => {
        console.warn('Playback error:', err);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setTotalDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [0.8, 1.0, 1.25, 1.5];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const handleDownload = () => {
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `نطق_مترجم_${pairType.replace(/\s+/g, '_')}_${timestamp}.wav`;
    triggerDownload(audioUrl, filename);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3500);
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div
      id="audio-player-card"
      className="bg-linear-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 shadow-xl border border-indigo-500/20 relative overflow-hidden"
    >
      {/* Subtle Background Glow */}
      <div className="absolute -top-16 -left-16 w-36 h-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* Hidden Audio Tag */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (audioRef.current && audioRef.current.duration) {
            setTotalDuration(audioRef.current.duration);
          }
        }}
      />

      {/* Header Info & Pair Badge */}
      <div className="flex items-start justify-between gap-2 mb-4 relative z-10">
        <div>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 rounded-full border border-indigo-400/30 mb-1.5">
            <Volume2 className="w-3 h-3" />
            {pairType}
          </span>
          <h3 className="text-base font-bold text-white tracking-wide">
            {title}
          </h3>
        </div>

        {/* Speed button */}
        <button
          id="speed-control-btn"
          onClick={cyclePlaybackRate}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 transition-colors border border-white/10"
          title="سرعة النطق"
        >
          <Gauge className="w-3.5 h-3.5" />
          <span>{playbackRate}x</span>
        </button>
      </div>

      {/* Sound Visualizer Bars */}
      <div className="flex items-center justify-center gap-1 h-8 my-2 px-2 relative z-10">
        {Array.from({ length: 24 }).map((_, i) => {
          const heightFactor = Math.sin((i / 24) * Math.PI);
          const active = isPlaying;
          return (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                active
                  ? 'bg-linear-to-t from-indigo-400 to-violet-300 animate-pulse'
                  : 'bg-white/20'
              }`}
              style={{
                height: active
                  ? `${Math.max(15, Math.floor(heightFactor * 32 * (0.6 + Math.random() * 0.5)))}px`
                  : `${Math.max(6, Math.floor(heightFactor * 16))}px`,
                animationDelay: `${(i % 5) * 0.1}s`,
              }}
            />
          );
        })}
      </div>

      {/* Scrubber / Progress bar */}
      <div className="space-y-1.5 my-3 relative z-10" dir="ltr">
        <div className="relative flex items-center">
          <input
            id="audio-time-slider"
            type="range"
            min={0}
            max={totalDuration || 1}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-400 focus:outline-none"
          />
        </div>
        <div className="flex justify-between text-[11px] font-mono text-slate-300 px-0.5">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(totalDuration)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 relative z-10">
        {/* Playback controls */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
          <button
            id="replay-btn"
            onClick={handleRestart}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 flex items-center justify-center transition-all active:scale-90"
            title="إعادة التشغيل من البداية"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            id="play-pause-btn"
            onClick={togglePlay}
            className="w-13 h-13 rounded-full bg-linear-to-tr from-indigo-500 to-violet-500 hover:from-indigo-400 hover:to-violet-400 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30 transition-all active:scale-95 cursor-pointer"
            title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل الصوت'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>

        {/* Primary Download Button */}
        <button
          id="download-audio-btn"
          onClick={handleDownload}
          className={`w-full sm:flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-md active:scale-98 ${
            downloaded
              ? 'bg-emerald-600 text-white'
              : 'bg-white hover:bg-slate-100 text-slate-900'
          }`}
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>تم بدء التنزيل بنجاح! (.WAV)</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4 text-indigo-600" />
              <span>تنزيل المقطع الصوتي (.WAV)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
