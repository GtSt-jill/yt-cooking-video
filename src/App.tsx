import { useCallback, useEffect, useMemo, useState } from "react";
import { AutoPausePanel } from "./components/AutoPausePanel";
import { BookmarkList } from "./components/BookmarkList";
import { ControlBar } from "./components/ControlBar";
import { VideoUrlForm } from "./components/VideoUrlForm";
import { VoiceStatus } from "./components/VoiceStatus";
import { YouTubePlayer } from "./components/YouTubePlayer";
import { useAutoPause } from "./hooks/useAutoPause";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { useSpeechCommands } from "./hooks/useSpeechCommands";
import { useYouTubePlayer } from "./hooks/useYouTubePlayer";
import { STORAGE_KEYS } from "./lib/storageKeys";
import { parseYouTubeUrl } from "./lib/youtubeUrl";
import type { Bookmark } from "./types/bookmark";
import type { VoiceCommand } from "./types/speech";

type Settings = {
  voiceEnabled: boolean;
  autoPauseEnabled: boolean;
  autoPauseIntervalSeconds: 15 | 30 | 60;
};

type BookmarkMap = Record<string, Bookmark[]>;

const DEFAULT_SETTINGS: Settings = {
  voiceEnabled: false,
  autoPauseEnabled: false,
  autoPauseIntervalSeconds: 30
};

function createBookmarkId() {
  if (crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function errorMessageForUrl(reason: "empty" | "invalid") {
  return reason === "empty" ? "YouTube URL を入力してください。" : "有効な YouTube URL を入力してください。";
}

export default function App() {
  const [lastVideoUrl, setLastVideoUrl] = useLocalStorage(STORAGE_KEYS.lastVideoUrl, "");
  const [settings, setSettings] = useLocalStorage<Settings>(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
  const [bookmarkMap, setBookmarkMap] = useLocalStorage<BookmarkMap>(STORAGE_KEYS.bookmarks, {});
  const [videoId, setVideoId] = useState<string | null>(() => {
    const parsed = parseYouTubeUrl(lastVideoUrl);
    return parsed.ok ? parsed.videoId : null;
  });
  const [urlError, setUrlError] = useState<string | null>(null);

  const player = useYouTubePlayer(videoId);
  const bookmarks = useMemo(() => (videoId ? bookmarkMap[videoId] ?? [] : []), [bookmarkMap, videoId]);

  useEffect(() => {
    if (settings.voiceEnabled) {
      setSettings((current) => ({ ...current, voiceEnabled: false }));
    }
  }, []);

  const saveBookmark = useCallback(() => {
    if (!videoId || !player.isReady) {
      return;
    }

    const nextBookmark: Bookmark = {
      id: createBookmarkId(),
      videoId,
      label: `手順 ${bookmarks.length + 1}`,
      time: player.currentTime,
      createdAt: new Date().toISOString()
    };

    setBookmarkMap((current) => ({
      ...current,
      [videoId]: [...(current[videoId] ?? []), nextBookmark].sort((a, b) => a.time - b.time)
    }));
  }, [bookmarks.length, player.currentTime, player.isReady, setBookmarkMap, videoId]);

  const goToPreviousBookmark = useCallback(() => {
    const previous = [...bookmarks].reverse().find((bookmark) => bookmark.time < player.currentTime - 2);
    if (previous) {
      player.seekTo(previous.time);
    }
  }, [bookmarks, player]);

  const handleCommand = useCallback(
    (command: VoiceCommand) => {
      switch (command.type) {
        case "play":
          player.play();
          break;
        case "pause":
          player.pause();
          break;
        case "seekBy":
          player.seekBy(command.seconds);
          break;
        case "replay":
          player.seekBy(-10);
          player.play();
          break;
        case "saveBookmark":
          saveBookmark();
          break;
        case "previousBookmark":
          goToPreviousBookmark();
          break;
      }
    },
    [goToPreviousBookmark, player, saveBookmark]
  );

  const speech = useSpeechCommands({
    enabled: settings.voiceEnabled,
    onCommand: handleCommand
  });

  useAutoPause({
    enabled: settings.autoPauseEnabled,
    intervalSeconds: settings.autoPauseIntervalSeconds,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    pause: player.pause
  });

  function handleUrlSubmit(url: string) {
    const parsed = parseYouTubeUrl(url);
    if (!parsed.ok) {
      setUrlError(errorMessageForUrl(parsed.reason));
      return;
    }

    setUrlError(null);
    setVideoId(parsed.videoId);
    setLastVideoUrl(url);
  }

  function updateSettings(patch: Partial<Settings>) {
    setSettings((current) => ({ ...current, ...patch }));
  }

  function deleteBookmark(bookmarkId: string) {
    if (!videoId) {
      return;
    }

    setBookmarkMap((current) => ({
      ...current,
      [videoId]: (current[videoId] ?? []).filter((bookmark) => bookmark.id !== bookmarkId)
    }));
  }

  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Cooking Video Controller</p>
          <h1>YouTube 料理動画を手ぶらで操作</h1>
        </div>
      </header>

      <VideoUrlForm initialValue={lastVideoUrl} error={urlError} onSubmit={handleUrlSubmit} />

      <div className="workspace">
        <div className="primary-column">
          <YouTubePlayer playerElementRef={player.playerElementRef} hasVideo={Boolean(videoId)} />
          {player.error ? <p className="error-text">{player.error}</p> : null}
          <ControlBar
            isReady={player.isReady}
            isPlaying={player.isPlaying}
            currentTime={player.currentTime}
            duration={player.duration}
            voiceEnabled={settings.voiceEnabled}
            onPlay={player.play}
            onPause={player.pause}
            onSeekBy={player.seekBy}
            onSaveBookmark={saveBookmark}
            onToggleVoice={() => updateSettings({ voiceEnabled: !settings.voiceEnabled })}
          />
        </div>

        <aside className="side-column">
          <AutoPausePanel
            enabled={settings.autoPauseEnabled}
            intervalSeconds={settings.autoPauseIntervalSeconds}
            onEnabledChange={(enabled) => updateSettings({ autoPauseEnabled: enabled })}
            onIntervalChange={(seconds) => updateSettings({ autoPauseIntervalSeconds: seconds })}
          />
          <VoiceStatus
            isSecureContext={speech.isSecureContext}
            isSupported={speech.isSupported}
            isListening={speech.isListening}
            lastTranscript={speech.lastTranscript}
            lastCommand={speech.lastCommand}
            error={speech.error}
          />
          <BookmarkList bookmarks={bookmarks} onSelect={(bookmark) => player.seekTo(bookmark.time)} onDelete={deleteBookmark} />
        </aside>
      </div>
    </main>
  );
}
