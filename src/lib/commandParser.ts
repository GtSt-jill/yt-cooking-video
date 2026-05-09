import type { VoiceCommand } from "../types/speech";

const ZENKAKU_DIGITS = "０１２３４５６７８９";
const JAPANESE_NUMBER_WORDS = [
  ["三十秒", "30秒"],
  ["三十", "30"],
  ["十五秒", "15秒"],
  ["十五", "15"],
  ["六十秒", "60秒"],
  ["六十", "60"],
  ["十秒", "10秒"],
  ["十", "10"]
] as const;

function normalizeTranscript(transcript: string): string {
  let normalized = transcript
    .trim()
    .toLowerCase()
    .replace(/[０-９]/g, (char) => String(ZENKAKU_DIGITS.indexOf(char)))
    .replace(/\s+/g, "")
    .replace(/びょう/g, "秒")
    .replace(/せい/g, "生")
    .replace(/もど/g, "戻");

  for (const [word, value] of JAPANESE_NUMBER_WORDS) {
    normalized = normalized.replaceAll(word, value);
  }

  return normalized;
}

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const normalized = normalizeTranscript(transcript);

  if (!normalized) {
    return null;
  }

  if (/(止めて|止める|止まって|ストップ|ストップして|停止|停止して|一時停止|ポーズ|待って|まって|ちょっと待って)/.test(normalized)) {
    return { type: "pause" };
  }

  if (/(再生|再生して|先生|続けて|続き|続行|スタート|始めて|はじめて|プレイ)/.test(normalized)) {
    return { type: "play" };
  }

  if (/(保存|保存して|ここを保存|セーブ|ブックマーク|メモ)/.test(normalized)) {
    return { type: "saveBookmark" };
  }

  if (/(前の手順|前手順|まえの手順|前に戻る|前へ|一個前|1個前)/.test(normalized)) {
    return { type: "previousBookmark" };
  }

  if (/(もう一回|もう1回|もういっかい|もう一度|もっかい|リプレイ)/.test(normalized)) {
    return { type: "replay" };
  }

  if (/(少し戻して|少し戻る|ちょっと戻して|ちょっと戻る|戻して|戻る|巻き戻し|巻き戻して)/.test(normalized)) {
    const secondMatch = normalized.match(/(\d+)秒?/);
    if (secondMatch) {
      const seconds = Number(secondMatch[1]);
      if (Number.isFinite(seconds) && seconds > 0) {
        return { type: "seekBy", seconds: -seconds };
      }
    }
    return { type: "seekBy", seconds: -10 };
  }

  const secondMatch = normalized.match(/(\d+)秒?(戻して|戻る|巻き戻し|巻き戻して)/);
  if (secondMatch) {
    const seconds = Number(secondMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return { type: "seekBy", seconds: -seconds };
    }
  }

  return null;
}
