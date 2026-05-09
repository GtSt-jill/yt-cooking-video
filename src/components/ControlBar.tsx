import { BookmarkPlus, Mic, MicOff, Pause, Play, RotateCcw } from "lucide-react";
import { formatTime } from "../lib/time";

type ControlBarProps = {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  voiceEnabled: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeekBy: (seconds: number) => void;
  onSaveBookmark: () => void;
  onToggleVoice: () => void;
};

export function ControlBar({
  isReady,
  isPlaying,
  currentTime,
  duration,
  voiceEnabled,
  onPlay,
  onPause,
  onSeekBy,
  onSaveBookmark,
  onToggleVoice
}: ControlBarProps) {
  return (
    <section className="control-bar" aria-label="動画操作">
      <div className="time-readout">
        <span>{formatTime(currentTime)}</span>
        <span>/</span>
        <span>{formatTime(duration)}</span>
      </div>
      <div className="control-grid">
        <button type="button" disabled={!isReady} onClick={() => onSeekBy(-30)}>
          <RotateCcw aria-hidden="true" size={22} />
          30秒
        </button>
        <button type="button" disabled={!isReady} onClick={() => onSeekBy(-10)}>
          <RotateCcw aria-hidden="true" size={22} />
          10秒
        </button>
        <button type="button" className="play-button" disabled={!isReady} onClick={isPlaying ? onPause : onPlay}>
          {isPlaying ? <Pause aria-hidden="true" size={26} /> : <Play aria-hidden="true" size={26} />}
          {isPlaying ? "停止" : "再生"}
        </button>
        <button type="button" disabled={!isReady} onClick={onSaveBookmark}>
          <BookmarkPlus aria-hidden="true" size={22} />
          保存
        </button>
        <button type="button" className={voiceEnabled ? "active-button" : ""} onClick={onToggleVoice}>
          {voiceEnabled ? <Mic aria-hidden="true" size={22} /> : <MicOff aria-hidden="true" size={22} />}
          音声
        </button>
      </div>
    </section>
  );
}
