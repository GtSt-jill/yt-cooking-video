import { describe, expect, it } from "vitest";
import { parseYouTubeUrl } from "../lib/youtubeUrl";

describe("parseYouTubeUrl", () => {
  it("parses watch URLs", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toEqual({
      ok: true,
      videoId: "dQw4w9WgXcQ"
    });
  });

  it("parses short URLs", () => {
    expect(parseYouTubeUrl("https://youtu.be/dQw4w9WgXcQ")).toEqual({
      ok: true,
      videoId: "dQw4w9WgXcQ"
    });
  });

  it("parses embed and shorts URLs", () => {
    expect(parseYouTubeUrl("https://www.youtube.com/embed/dQw4w9WgXcQ")).toEqual({
      ok: true,
      videoId: "dQw4w9WgXcQ"
    });
    expect(parseYouTubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toEqual({
      ok: true,
      videoId: "dQw4w9WgXcQ"
    });
  });

  it("rejects invalid input", () => {
    expect(parseYouTubeUrl("")).toEqual({ ok: false, reason: "empty" });
    expect(parseYouTubeUrl("https://example.com/watch?v=dQw4w9WgXcQ")).toEqual({ ok: false, reason: "invalid" });
  });
});
