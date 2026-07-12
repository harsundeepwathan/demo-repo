import { useCallback, useState } from "react";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";

export function useVoiceCapture() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  useSpeechRecognitionEvent("start", () => setIsListening(true));
  useSpeechRecognitionEvent("end", () => setIsListening(false));
  useSpeechRecognitionEvent("result", (event) => {
    const text = event.results[0]?.transcript ?? "";
    if (text) setTranscript(text);
  });
  useSpeechRecognitionEvent("error", (event) => {
    setError(
      event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone or speech access isn't available here — try typing instead."
        : "Didn't catch that — try again or type it instead."
    );
    setIsListening(false);
  });

  const start = useCallback(async () => {
    setError(null);
    setTranscript("");
    try {
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        setError("Microphone or speech access isn't available here — try typing instead.");
        return;
      }
      ExpoSpeechRecognitionModule.start({
        lang: "en-US",
        interimResults: true,
        continuous: false,
        addsPunctuation: true,
      });
    } catch {
      setError("Microphone or speech access isn't available here — try typing instead.");
    }
  }, []);

  const stop = useCallback(() => {
    try {
      ExpoSpeechRecognitionModule.stop();
    } catch {
      // no-op — recognizer may not have started
    }
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setError(null);
  }, []);

  return { isListening, transcript, error, start, stop, reset };
}
