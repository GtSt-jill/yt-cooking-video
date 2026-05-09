import { useCallback, useEffect, useRef, useState } from "react";
import { parseVoiceCommand } from "../lib/commandParser";
import type { BrowserSpeechRecognition } from "../types/browserSpeech";
import type { VoiceCommand } from "../types/speech";

type UseSpeechCommandsParams = {
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
};

export function useSpeechCommands({ enabled, onCommand }: UseSpeechCommandsParams) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const onCommandRef = useRef(onCommand);
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

    const recognition = new RecognitionConstructor();
    recognition.lang = "ja-JP";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const latestResult = event.results[event.results.length - 1];
      const transcript = latestResult?.[0]?.transcript ?? "";
      setLastTranscript(transcript);

      const command = parseVoiceCommand(transcript);
      if (command) {
        setLastCommand(command);
        onCommandRef.current(command);
      }
    };
    recognition.onerror = (event) => {
      const message =
        event.error === "not-allowed"
          ? "マイクの利用が許可されていません。ブラウザの権限設定を確認してください。"
          : `音声認識エラー: ${event.error}`;
      setError(message);
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);

      if (enabledRef.current) {
        window.setTimeout(() => {
          if (enabledRef.current) {
            start();
          }
        }, 300);
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
