import { describe, expect, it } from "vitest";
import { parseVoiceCommand } from "../lib/commandParser";

describe("parseVoiceCommand", () => {
  it("parses playback commands", () => {
    expect(parseVoiceCommand("止めて")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("ちょっと待って")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("ストップして")).toEqual({ type: "pause" });
    expect(parseVoiceCommand("再生")).toEqual({ type: "play" });
    expect(parseVoiceCommand("スタート")).toEqual({ type: "play" });
    expect(parseVoiceCommand("先生")).toEqual({ type: "play" });
  });

  it("parses seek commands", () => {
    expect(parseVoiceCommand("10秒戻して")).toEqual({ type: "seekBy", seconds: -10 });
    expect(parseVoiceCommand("３０秒もどして")).toEqual({ type: "seekBy", seconds: -30 });
    expect(parseVoiceCommand("三十秒戻して")).toEqual({ type: "seekBy", seconds: -30 });
    expect(parseVoiceCommand("十秒戻して")).toEqual({ type: "seekBy", seconds: -10 });
    expect(parseVoiceCommand("少し戻して")).toEqual({ type: "seekBy", seconds: -10 });
    expect(parseVoiceCommand("戻る")).toEqual({ type: "seekBy", seconds: -10 });
    expect(parseVoiceCommand("巻き戻して")).toEqual({ type: "seekBy", seconds: -10 });
  });

  it("parses bookmark commands", () => {
    expect(parseVoiceCommand("ここを保存")).toEqual({ type: "saveBookmark" });
    expect(parseVoiceCommand("セーブ")).toEqual({ type: "saveBookmark" });
    expect(parseVoiceCommand("前の手順")).toEqual({ type: "previousBookmark" });
    expect(parseVoiceCommand("一個前")).toEqual({ type: "previousBookmark" });
  });

  it("returns null for unknown text", () => {
    expect(parseVoiceCommand("こんにちは")).toBeNull();
  });
});
