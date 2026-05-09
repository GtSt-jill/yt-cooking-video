export type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

export type YouTubePlayerEvent = {
  target: YouTubePlayer;
  data: YouTubePlayerState;
};

export type YouTubePlayerErrorEvent = {
  target: YouTubePlayer;
  data: number;
};

export type YouTubePlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => YouTubePlayerState;
  destroy: () => void;
};

export type YouTubeNamespace = {
  Player: new (
    element: HTMLElement,
    options: {
      videoId: string;
      playerVars?: Record<string, number | string>;
      events?: {
        onReady?: (event: { target: YouTubePlayer }) => void;
        onStateChange?: (event: YouTubePlayerEvent) => void;
        onError?: (event: YouTubePlayerErrorEvent) => void;
      };
    }
  ) => YouTubePlayer;
  PlayerState: {
    PLAYING: 1;
    PAUSED: 2;
  };
};

declare global {
  interface Window {
    YT?: YouTubeNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}
