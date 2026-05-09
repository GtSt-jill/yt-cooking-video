import { useCallback, useEffect, useRef, useState } from "react";
import type { YouTubePlayer, YouTubePlayerEvent } from "../types/youtube";

let youtubeApiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve) => {
      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        previousCallback?.();
        resolve();
      };

      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const script = document.createElement("script");
        script.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

export function useYouTubePlayer(videoId: string | null) {
  const playerElementRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setIsReady(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setError(null);

    if (!videoId || !playerElementRef.current) {
      return;
    }

    loadYouTubeApi()
      .then(() => {
        if (cancelled || !window.YT || !playerElementRef.current) {
          return;
        }

        playerRef.current?.destroy();
        playerRef.current = new window.YT.Player(playerElementRef.current, {
          videoId,
          playerVars: {
            playsinline: 1,
            rel: 0,
            modestbranding: 1
          },
          events: {
            onReady: (event) => {
              if (cancelled) {
                return;
              }
              setIsReady(true);
              setDuration(event.target.getDuration());
            },
            onStateChange: (event: YouTubePlayerEvent) => {
              setIsPlaying(event.data === window.YT?.PlayerState.PLAYING);
            },
            onError: () => {
              setError("この動画は埋め込み再生できない可能性があります。別の動画 URL を試してください。");
            }
          }
        });
      })
      .catch(() => {
        if (!cancelled) {
          setError("YouTube プレイヤーの読み込みに失敗しました。ページを再読み込みしてください。");
        }
      });

    return () => {
      cancelled = true;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const timerId = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) {
        return;
      }
      setCurrentTime(player.getCurrentTime());
      setDuration(player.getDuration());
      setIsPlaying(player.getPlayerState() === window.YT?.PlayerState.PLAYING);
    }, 500);

    return () => window.clearInterval(timerId);
  }, [isReady]);

  const play = useCallback(() => {
    playerRef.current?.playVideo();
  }, []);

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo();
  }, []);

  const seekTo = useCallback((seconds: number) => {
    const safeSeconds = Math.max(0, seconds);
    playerRef.current?.seekTo(safeSeconds, true);
    setCurrentTime(safeSeconds);
  }, []);

  const seekBy = useCallback(
    (seconds: number) => {
      const baseTime = playerRef.current?.getCurrentTime() ?? currentTime;
      seekTo(baseTime + seconds);
    },
    [currentTime, seekTo]
  );

  return {
    playerElementRef,
    isReady,
    isPlaying,
    currentTime,
    duration,
    error,
    play,
    pause,
    seekBy,
    seekTo
  };
}
