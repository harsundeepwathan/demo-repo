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
          <View style={styles.recordRing}>
            <Pressable style={styles.recordButton} onPress={startRecording}>
              <Text style={styles.recordButtonText}>●</Text>
            </Pressable>
          </View>
          <Text style={styles.hint}>Tap to start talking</Text>
        </View>
      )}

      {phase === "recording" && (
        <View style={styles.panel}>
          <Text style={styles.timer}>
            {mm}:{ss}
          </Text>
          <View style={styles.recordRing}>
            <Pressable style={styles.stopButton} onPress={stopAndUpload}>
              <Text style={styles.stopButtonText}>■</Text>
            </Pressable>
          </View>
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
  content: { padding: 20, gap: 18, paddingTop: 12, paddingBottom: 40 },
  heading: { fontSize: 32, fontWeight: "800", color: theme.text, letterSpacing: -0.5 },
  subheading: { fontSize: 15, color: theme.textDim, marginTop: -10 },
  panel: {
    backgroundColor: theme.panel,
    borderRadius: theme.radius,
    padding: 28,
    alignItems: "center",
    gap: 18,
    minHeight: 240,
    justifyContent: "center",
    ...theme.card,
  },
  prompt: { color: theme.textDim, fontSize: 16, textAlign: "center", fontWeight: "500" },
  recordRing: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: theme.warmSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.warm,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.warmStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  recordButtonText: { color: "#FFFFFF", fontSize: 28 },
  stopButton: {
    width: 80,
    height: 80,
    borderRadius: 26,
    backgroundColor: theme.danger,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.danger,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  stopButtonText: { color: "#FFFFFF", fontSize: 24 },
  hint: { color: theme.textFaint, fontSize: 13, fontWeight: "600" },
  timer: {
    color: theme.text,
    fontSize: 40,
    fontVariant: ["tabular-nums"],
    fontWeight: "800",
  },
  resultLabel: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    alignSelf: "flex-start",
  },
  resultNote: { color: theme.text, fontSize: 17, lineHeight: 24, alignSelf: "flex-start" },
  resultSuggestion: {
    color: theme.text,
    fontSize: 15,
    lineHeight: 22,
    alignSelf: "flex-start",
  },
  divider: { height: 1, backgroundColor: theme.panelBorder, width: "100%" },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, alignSelf: "flex-start" },
  themeChip: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeChipText: { color: theme.accentStrong, fontSize: 12, fontWeight: "700" },
  secondaryButton: {
    marginTop: 8,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingHorizontal: 26,
    paddingVertical: 13,
  },
  secondaryButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  errorText: { color: theme.danger, fontSize: 14, textAlign: "center", fontWeight: "500" },
  disclaimer: {
    color: theme.textFaint,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
});
