import { FormEvent, useState } from "react";
import { Link } from "lucide-react";

type VideoUrlFormProps = {
  initialValue: string;
  error: string | null;
  onSubmit: (url: string) => void;
};

export function VideoUrlForm({ initialValue, error, onSubmit }: VideoUrlFormProps) {
  const [value, setValue] = useState(initialValue);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form className="url-form" onSubmit={handleSubmit}>
      <label htmlFor="youtube-url">YouTube URL</label>
      <div className="url-row">
        <input
          id="youtube-url"
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=..."
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit" className="primary-button">
          <Link aria-hidden="true" size={20} />
          読み込む
        </button>
      </div>
      {error ? <p className="error-text">{error}</p> : null}
    </form>
  );
}
