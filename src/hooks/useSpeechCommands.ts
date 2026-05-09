import { useCallback, useEffect, useRef, useState } from "react";
import { parseVoiceCommand } from "../lib/commandParser";
import type { BrowserSpeechRecognition, SpeechRecognitionEventLike } from "../types/browserSpeech";
import type { VoiceCommand } from "../types/speech";

type UseSpeechCommandsParams = {
  enabled: boolean;
  onCommand: (command: VoiceCommand) => void;
  onFinished: () => void;
};

const LISTEN_TIMEOUT_MS = 5000;

export function useSpeechCommands({ enabled, onCommand, onFinished }: UseSpeechCommandsParams) {
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const enabledRef = useRef(enabled);
  const onCommandRef = useRef(onCommand);
  const onFinishedRef = useRef(onFinished);
  const lastCommandRef = useRef<{ key: string; at: number } | null>(null);
  const listenTimeoutRef = useRef<number | null>(null);
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

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    if (listenTimeoutRef.current !== null) {
      window.clearTimeout(listenTimeoutRef.current);
      listenTimeoutRef.current = null;
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

    const recognition = new RecognitionConstructor();
    recognition.lang = "ja-JP";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    recognition.onresult = (event) => {
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
        stop();
        onFinishedRef.current();
      }
    };
    recognition.onerror = (event) => {
      setError(errorMessageForSpeechRecognition(event.error));
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setIsListening(false);
      enabledRef.current = false;
      onFinishedRef.current();
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
      listenTimeoutRef.current = window.setTimeout(() => {
        setError("音声を検出できませんでした。もう一度、音声ボタンを押してください。");
        stop();
        onFinishedRef.current();
      }, LISTEN_TIMEOUT_MS);
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
      if (listenTimeoutRef.current !== null) {
        window.clearTimeout(listenTimeoutRef.current);
        listenTimeoutRef.current = null;
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
      return "ネットワークがオフラインのため音声認識に接続できません。";
    }
    return "音声認識サービスへの接続に失敗しました。もう一度、音声ボタンを押してください。";
  }

  if (error === "not-allowed" || error === "service-not-allowed") {
    return "マイクまたは音声認識サービスの利用が許可されていません。ブラウザの権限設定を確認してください。";
  }

  if (error === "audio-capture") {
    return "マイクを利用できません。別のアプリがマイクを使用していないか確認してください。";
  }

  if (error === "no-speech") {
    return "音声を検出できませんでした。もう一度、音声ボタンを押してください。";
  }

  return `音声認識エラー: ${error}`;
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
