import type { VoiceCommand } from "../types/speech";

type VoiceStatusProps = {
  isSupported: boolean;
  isListening: boolean;
  lastTranscript: string | null;
  lastCommand: VoiceCommand | null;
  error: string | null;
};

function commandLabel(command: VoiceCommand | null): string {
  if (!command) {
    return "未検出";
  }

  switch (command.type) {
    case "play":
      return "再生";
    case "pause":
      return "停止";
    case "seekBy":
      return `${Math.abs(command.seconds)}秒戻る`;
    case "replay":
      return "もう一回";
    case "saveBookmark":
      return "保存";
    case "previousBookmark":
      return "前の手順";
  }
}

export function VoiceStatus({ isSupported, isListening, lastTranscript, lastCommand, error }: VoiceStatusProps) {
  return (
    <section className="panel voice-panel" aria-label="音声状態">
      <div className="panel-heading">
        <h2>音声操作</h2>
        <span className={isListening ? "status-pill listening" : "status-pill"}>{isListening ? "待機中" : "停止中"}</span>
      </div>
      <dl className="status-list">
        <div>
          <dt>対応</dt>
          <dd>{isSupported ? "対応ブラウザ" : "非対応"}</dd>
        </div>
        <div>
          <dt>認識</dt>
          <dd>{lastTranscript ?? "なし"}</dd>
        </div>
        <div>
          <dt>操作</dt>
          <dd>{commandLabel(lastCommand)}</dd>
        </div>
      </dl>
      {error ? <p className="error-text">{error}</p> : null}
    </section>
  );
}
