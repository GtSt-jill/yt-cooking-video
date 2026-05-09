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
  const [isListening, setIsListening] = useState(false);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);

  const RecognitionConstructor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  const isSupported = Boolean(RecognitionConstructor);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const stop = useCallback(() => {
    enabledRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = useCallback(() => {
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
        onCommand(command);
      }
    };
    recognition.onerror = (event) => {
      setError(`音声認識エラー: ${event.error}`);
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
    recognition.start();
    setIsListening(true);
  }, [RecognitionConstructor, onCommand]);

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
    isSupported,
    isListening,
    lastTranscript,
    lastCommand,
    error
  };
}
