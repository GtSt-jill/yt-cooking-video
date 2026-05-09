import type { RefObject } from "react";

type YouTubePlayerProps = {
  playerElementRef: RefObject<HTMLDivElement | null>;
  hasVideo: boolean;
};

export function YouTubePlayer({ playerElementRef, hasVideo }: YouTubePlayerProps) {
  return (
    <section className="player-shell" aria-label="YouTube プレイヤー">
      {hasVideo ? <div ref={playerElementRef} className="youtube-frame" /> : <div className="empty-player">動画 URL を入力してください</div>}
    </section>
  );
}
