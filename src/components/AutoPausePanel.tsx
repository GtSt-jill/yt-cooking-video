type AutoPausePanelProps = {
  enabled: boolean;
  intervalSeconds: 15 | 30 | 60;
  onEnabledChange: (enabled: boolean) => void;
  onIntervalChange: (seconds: 15 | 30 | 60) => void;
};

export function AutoPausePanel({ enabled, intervalSeconds, onEnabledChange, onIntervalChange }: AutoPausePanelProps) {
  const intervals = [15, 30, 60] as const;

  return (
    <section className="panel auto-pause-panel" aria-label="自動停止">
      <div className="panel-heading">
        <h2>自動停止</h2>
        <label className="switch">
          <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} />
          <span>{enabled ? "ON" : "OFF"}</span>
        </label>
      </div>
      <div className="segmented-control" aria-label="停止間隔">
        {intervals.map((seconds) => (
          <button
            key={seconds}
            type="button"
            className={intervalSeconds === seconds ? "selected" : ""}
            onClick={() => onIntervalChange(seconds)}
          >
            {seconds}秒
          </button>
        ))}
      </div>
    </section>
  );
}
