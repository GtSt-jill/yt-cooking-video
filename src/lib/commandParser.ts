import type { VoiceCommand } from "../types/speech";

const ZENKAKU_DIGITS = "０１２３４５６７８９";

function normalizeTranscript(transcript: string): string {
  return transcript
    .trim()
    .toLowerCase()
    .replace(/[０-９]/g, (char) => String(ZENKAKU_DIGITS.indexOf(char)))
    .replace(/\s+/g, "")
    .replace(/びょう/g, "秒");
}

export function parseVoiceCommand(transcript: string): VoiceCommand | null {
  const normalized = normalizeTranscript(transcript);

  if (!normalized) {
    return null;
  }

  if (/(止めて|とめて|ストップ|停止|一時停止|ポーズ)/.test(normalized)) {
    return { type: "pause" };
  }

  if (/(再生|さいせい|続けて|つづけて|プレイ)/.test(normalized)) {
    return { type: "play" };
  }

  if (/(保存|ここを保存|ブックマーク)/.test(normalized)) {
    return { type: "saveBookmark" };
  }

  if (/(前の手順|まえの手順|前に戻る)/.test(normalized)) {
    return { type: "previousBookmark" };
  }

  if (/(もう一回|もう1回|もういっかい|もう一度)/.test(normalized)) {
    return { type: "replay" };
  }

  if (/(少し戻して|ちょっと戻して)/.test(normalized)) {
    return { type: "seekBy", seconds: -10 };
  }

  const secondMatch = normalized.match(/(\d+)秒?(戻して|もどして|戻る|もどる)/);
  if (secondMatch) {
    const seconds = Number(secondMatch[1]);
    if (Number.isFinite(seconds) && seconds > 0) {
      return { type: "seekBy", seconds: -seconds };
    }
  }

  return null;
}
