import { useEffect, useRef } from "react";

type UseAutoPauseParams = {
  enabled: boolean;
  intervalSeconds: number;
  isPlaying: boolean;
  currentTime: number;
  pause: () => void;
};

export function useAutoPause({ enabled, intervalSeconds, isPlaying, currentTime, pause }: UseAutoPauseParams) {
  const startedAtRef = useRef<number | null>(null);
  const lastPauseAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !isPlaying) {
      startedAtRef.current = null;
      return;
    }

    if (startedAtRef.current === null) {
      startedAtRef.current = currentTime;
    }

    const elapsed = currentTime - startedAtRef.current;
    const alreadyPausedHere = lastPauseAtRef.current !== null && Math.abs(currentTime - lastPauseAtRef.current) < 2;

    if (elapsed >= intervalSeconds && !alreadyPausedHere) {
      lastPauseAtRef.current = currentTime;
      startedAtRef.current = null;
      pause();
    }
  }, [currentTime, enabled, intervalSeconds, isPlaying, pause]);

  useEffect(() => {
    startedAtRef.current = null;
    lastPauseAtRef.current = null;
  }, [enabled, intervalSeconds]);
}
