import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Audio } from "expo-av";
import { uploadEntry } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { Entry } from "../../lib/types";
import { CrisisBanner } from "../../components/CrisisBanner";

type Phase = "idle" | "recording" | "uploading" | "result" | "error";

const PROMPTS = [
  "What's on your mind today?",
  "How did today actually feel?",
  "What's one thing that's been sitting with you?",
  "What do you need right now?",
];

export default function TalkScreen() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [seconds, setSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<Entry | null>(null);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, []);

  async function startRecording() {
    setErrorMessage("");
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted) {
      setPhase("error");
      setErrorMessage("Microphone access is off. Enable it in your device settings to check in.");
      return;
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const { recording } = await Audio.Recording.createAsync(
      Audio.RecordingOptionsPresets.HIGH_QUALITY
    );
    recordingRef.current = recording;
    setSeconds(0);
    setPhase("recording");

    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
  }

  async function stopAndUpload() {
    const recording = recordingRef.current;
    if (!recording) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setPhase("uploading");

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      recordingRef.current = null;
      if (!uri) throw new Error("Recording did not save.");

      const entry = await uploadEntry(uri);
      setResult(entry);
      setPhase("result");
    } catch (err) {
      setPhase("error");
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  function reset() {
    setPhase("idle");
    setResult(null);
    setErrorMessage("");
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.heading}>Mindboard</Text>
      <Text style={styles.subheading}>A place to say it out loud.</Text>

      {phase === "idle" && (
        <View style={styles.panel}>
          <Text style={styles.prompt}>{prompt}</Text>
          <Pressable style={styles.recordButton} onPress={startRecording}>
            <Text style={styles.recordButtonText}>●</Text>
          </Pressable>
          <Text style={styles.hint}>Tap to start talking</Text>
        </View>
      )}

      {phase === "recording" && (
        <View style={styles.panel}>
          <Text style={styles.timer}>
            {mm}:{ss}
          </Text>
          <Pressable style={styles.stopButton} onPress={stopAndUpload}>
            <Text style={styles.stopButtonText}>■</Text>
          </Pressable>
          <Text style={styles.hint}>Tap to finish</Text>
        </View>
      )}

      {phase === "uploading" && (
        <View style={styles.panel}>
          <ActivityIndicator color={theme.accent} size="large" />
          <Text style={styles.hint}>Listening back and reflecting…</Text>
        </View>
      )}

      {phase === "result" && result && (
        <View style={styles.panel}>
          <Text style={styles.resultLabel}>Reflection</Text>
          <Text style={styles.resultNote}>{result.supportiveNote}</Text>
          <View style={styles.divider} />
          <Text style={styles.resultLabel}>Something small to try</Text>
          <Text style={styles.resultSuggestion}>{result.suggestion}</Text>
          {result.themes.length > 0 && (
            <View style={styles.themeRow}>
              {result.themes.map((theme_) => (
                <View key={theme_} style={styles.themeChip}>
                  <Text style={styles.themeChipText}>{theme_}</Text>
                </View>
              ))}
            </View>
          )}
          <Pressable style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryButtonText}>New check-in</Text>
          </Pressable>
        </View>
      )}

      {phase === "error" && (
        <View style={styles.panel}>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable style={styles.secondaryButton} onPress={reset}>
            <Text style={styles.secondaryButtonText}>Try again</Text>
          </Pressable>
        </View>
      )}

      <CrisisBanner />

      <Text style={styles.disclaimer}>
        Mindboard is a private journaling tool, not therapy or medical care. It won't
        diagnose you or replace a professional.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 28, fontWeight: "700", color: theme.text },
  subheading: { fontSize: 14, color: theme.textDim, marginTop: -8 },
  panel: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 24,
    alignItems: "center",
    gap: 16,
    minHeight: 220,
    justifyContent: "center",
  },
  prompt: { color: theme.textDim, fontSize: 15, textAlign: "center" },
  recordButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButtonText: { color: "#0d0f18", fontSize: 30 },
  stopButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: theme.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  stopButtonText: { color: "#2a0d0d", fontSize: 26 },
  hint: { color: theme.textFaint, fontSize: 13 },
  timer: {
    color: theme.text,
    fontSize: 36,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  resultLabel: {
    color: theme.textDim,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    alignSelf: "flex-start",
  },
  resultNote: { color: theme.text, fontSize: 16, lineHeight: 22, alignSelf: "flex-start" },
  resultSuggestion: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 21,
    alignSelf: "flex-start",
  },
  divider: { height: 1, backgroundColor: theme.panelBorder, width: "100%" },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, alignSelf: "flex-start" },
  themeChip: {
    backgroundColor: theme.tile,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  themeChipText: { color: theme.textDim, fontSize: 12 },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: theme.tile,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  secondaryButtonText: { color: theme.text, fontWeight: "600" },
  errorText: { color: theme.danger, fontSize: 14, textAlign: "center" },
  disclaimer: {
    color: theme.textFaint,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
