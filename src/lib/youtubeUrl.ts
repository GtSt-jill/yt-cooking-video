export type ParseYouTubeUrlResult =
  | { ok: true; videoId: string }
  | { ok: false; reason: "empty" | "invalid" };

const VIDEO_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function parseYouTubeUrl(input: string): ParseYouTubeUrlResult {
  const trimmed = input.trim();

  if (!trimmed) {
    return { ok: false, reason: "empty" };
  }

  if (VIDEO_ID_PATTERN.test(trimmed)) {
    return { ok: true, videoId: trimmed };
  }

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtube.com" || host === "m.youtube.com") {
      const watchId = url.searchParams.get("v");
      if (watchId && VIDEO_ID_PATTERN.test(watchId)) {
        return { ok: true, videoId: watchId };
      }

      const pathParts = url.pathname.split("/").filter(Boolean);
      if ((pathParts[0] === "embed" || pathParts[0] === "shorts") && VIDEO_ID_PATTERN.test(pathParts[1] ?? "")) {
        return { ok: true, videoId: pathParts[1] };
      }
    }

    if (host === "youtu.be") {
      const videoId = url.pathname.split("/").filter(Boolean)[0];
      if (VIDEO_ID_PATTERN.test(videoId ?? "")) {
        return { ok: true, videoId };
      }
    }
  } catch {
    return { ok: false, reason: "invalid" };
  }

  return { ok: false, reason: "invalid" };
}
