import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../lib/theme";
import { createTask } from "../lib/db";
import { useVoiceCapture } from "../lib/speech";
import { emitTasksChanged } from "../lib/events";
import { EnergySelector } from "./EnergySelector";
import type { EnergyLevel } from "../lib/types";

export function QuickCaptureFab() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const voice = useVoiceCapture();

  useEffect(() => {
    if (voice.isListening && voice.transcript) {
      setDraft(voice.transcript);
    }
  }, [voice.transcript, voice.isListening]);

  function close() {
    voice.stop();
    voice.reset();
    setDraft("");
    setEnergy("medium");
    setOpen(false);
  }

  async function submit() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    voice.stop();
    await createTask({ title: trimmed, status: "now", energyLevel: energy });
    setDraft("");
    setEnergy("medium");
    voice.reset();
    setOpen(false);
    emitTasksChanged();
  }

  function toggleMic() {
    if (voice.isListening) {
      voice.stop();
    } else {
      voice.start();
    }
  }

  return (
    <>
      <Pressable
        style={styles.fab}
        onPress={() => setOpen(true)}
        accessibilityLabel="Quick capture a task"
      >
        <Feather name="plus" size={26} color="#FFFFFF" />
      </Pressable>

      <Modal visible={open} animationType="slide" transparent onRequestClose={close}>
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Capture a task</Text>
              <Pressable onPress={close} hitSlop={10} accessibilityLabel="Close quick capture">
                <Feather name="x" size={20} color={theme.textDim} />
              </Pressable>
            </View>

            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              placeholder="What's on your mind?"
              placeholderTextColor={theme.textFaint}
              style={styles.input}
              multiline
              onSubmitEditing={submit}
              returnKeyType="done"
            />

            {voice.error ? <Text style={styles.errorText}>{voice.error}</Text> : null}
            {voice.isListening ? <Text style={styles.listeningText}>Listening…</Text> : null}

            <EnergySelector value={energy} onChange={setEnergy} />

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.micButton, voice.isListening && styles.micButtonActive]}
                onPress={toggleMic}
                accessibilityLabel={voice.isListening ? "Stop voice capture" : "Start voice capture"}
              >
                <Feather name="mic" size={18} color={voice.isListening ? "#FFFFFF" : theme.accent} />
              </Pressable>

              <Pressable
                style={[styles.submitButton, !draft.trim() && styles.submitButtonDisabled]}
                onPress={submit}
                disabled={!draft.trim()}
                accessibilityLabel="Add task"
              >
                <Feather name="check" size={16} color={draft.trim() ? "#FFFFFF" : theme.textFaint} />
                <Text style={[styles.submitButtonText, !draft.trim() && styles.submitButtonTextDisabled]}>
                  Add task
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: 20,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: theme.accentStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(46,44,39,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: theme.panel,
    borderTopLeftRadius: theme.radius,
    borderTopRightRadius: theme.radius,
    padding: 20,
    paddingBottom: 36,
    gap: 14,
  },
  sheetHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sheetTitle: { color: theme.text, fontSize: 16, fontWeight: "800" },
  input: {
    backgroundColor: theme.tile,
    borderRadius: theme.radiusSm,
    padding: 14,
    fontSize: 16,
    color: theme.text,
    minHeight: 70,
    textAlignVertical: "top",
  },
  errorText: { color: theme.warn, fontSize: 12, fontWeight: "600" },
  listeningText: { color: theme.accent, fontSize: 12, fontWeight: "700" },
  actionRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  micButtonActive: { backgroundColor: theme.accent },
  submitButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingVertical: 13,
  },
  submitButtonDisabled: { backgroundColor: theme.tile },
  submitButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  submitButtonTextDisabled: { color: theme.textFaint },
});
