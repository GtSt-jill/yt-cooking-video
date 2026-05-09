import { useCallback, useEffect, useRef, useState } from "react";
import { parseVoiceCommand } from "../lib/commandParser";
import type { BrowserSpeechRecognition, SpeechRecognitionEventLike } from "../types/browserSpeech";
import type { VoiceCommand } from "../types/speech";

type UseSpeechCommandsParams = {
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
};

export function useSpeechCommands({ enabled, onCommand }: UseSpeechCommandsParams) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const onCommandRef = useRef(onCommand);
  const lastCommandRef = useRef<{ key: string; at: number } | null>(null);
  const lastErrorRef = useRef<string | null>(null);
  const restartTimerRef = useRef<number | null>(null);
  const networkRetryCountRef = useRef(0);
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isSecureContext = window.isSecureContext;
  const isSupported = Boolean(window.SpeechRecognition ?? window.webkitSpeechRecognition);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
    const RecognitionConstructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!window.isSecureContext) {
      setError("音声操作には HTTPS または localhost での表示が必要です。");
      return;
    }

    if (!RecognitionConstructor) {
      setError("このブラウザでは音声操作を利用できません。");
      return;
    }

    if (recognitionRef.current) {
      return;
    }

    enabledRef.current = true;
    setError(null);
    lastErrorRef.current = null;

    const recognition = new RecognitionConstructor();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.onresult = (event) => {
      networkRetryCountRef.current = 0;
      lastErrorRef.current = null;
      setError(null);

      const transcripts = collectTranscripts(event);
      const transcript = transcripts[0] ?? "";

      if (transcript) {
        setLastTranscript(transcript);
      }

      const command = transcripts.map((candidate) => parseVoiceCommand(candidate)).find((candidate) => candidate !== null) ?? null;
      if (command) {
        const commandKey = JSON.stringify(command);
        const now = Date.now();
        const lastCommand = lastCommandRef.current;
        if (lastCommand?.key === commandKey && now - lastCommand.at < 1200) {
          return;
        }

        lastCommandRef.current = { key: commandKey, at: now };
        setLastCommand(command);
        onCommandRef.current(command);
      }
    };
    recognition.onerror = (event) => {
      lastErrorRef.current = event.error;
      setError(errorMessageForSpeechRecognition(event.error));

      if (isFatalSpeechError(event.error)) {
        enabledRef.current = false;
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);

      if (enabledRef.current) {
        const delay = restartDelayForError(lastErrorRef.current, networkRetryCountRef.current);
        if (lastErrorRef.current === "network") {
          networkRetryCountRef.current += 1;
        }

        restartTimerRef.current = window.setTimeout(() => {
          restartTimerRef.current = null;
          if (enabledRef.current) {
            start();
          }
        }, delay);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      recognitionRef.current = null;
      setIsListening(false);
      setError("音声認識を開始できませんでした。音声ボタンを一度 OFF にしてから再度 ON にしてください。");
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }

    return () => {
      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
      }
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, [enabled, start, stop]);

  return {
    isSecureContext,
    isSupported,
    isListening,
    lastTranscript,
    lastCommand,
    error
  };
}

function errorMessageForSpeechRecognition(error: string): string {
  if (error === "network") {
    if (navigator.onLine === false) {
      return "ネットワークがオフラインのため音声認識に接続できません。接続が戻ると自動で再試行します。";
    }
    return "音声認識サービスへの接続に失敗しました。数秒後に自動で再試行します。";
  }

  if (error === "not-allowed" || error === "service-not-allowed") {
    return "マイクまたは音声認識サービスの利用が許可されていません。ブラウザの権限設定を確認してください。";
  }

  if (error === "audio-capture") {
    return "マイクを利用できません。別のアプリがマイクを使用していないか確認してください。";
  }

  if (error === "no-speech") {
    return "音声を検出できませんでした。音声操作は継続して待機します。";
  }

  return `音声認識エラー: ${error}`;
}

function isFatalSpeechError(error: string): boolean {
  return error === "not-allowed" || error === "service-not-allowed" || error === "audio-capture";
}

function restartDelayForError(error: string | null, retryCount: number): number {
  if (error === "network") {
    return Math.min(15000, 2000 * 2 ** retryCount);
  }

  if (error === "no-speech") {
    return 800;
  }

  return 300;
}

function collectTranscripts(event: SpeechRecognitionEventLike): string[] {
  const latestResult = event.results[event.results.length - 1];
  if (!latestResult) {
    return [];
  }

  return Array.from(latestResult)
    .map((candidate) => candidate.transcript.trim())
    .filter(Boolean);
}
