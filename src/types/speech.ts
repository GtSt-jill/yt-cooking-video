export type VoiceCommand =
  | { type: "play" }
  | { type: "pause" }
  | { type: "seekBy"; seconds: number }
  | { type: "replay" }
  | { type: "saveBookmark" }
  | { type: "previousBookmark" };
