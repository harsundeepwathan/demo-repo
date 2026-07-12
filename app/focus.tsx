import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { theme, energyLabel } from "../lib/theme";
import type { Task } from "../lib/types";
import { completeTask, listTasksByStatus, moveTask } from "../lib/db";

export default function FocusScreen() {
  const [task, setTask] = useState<Task | null | undefined>(undefined);

  const load = useCallback(() => {
    listTasksByStatus("now").then((tasks) => setTask(tasks[0] ?? null));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function markDone() {
    if (!task) return;
    await completeTask(task.id);
    load();
  }

  async function notNow() {
    if (!task) return;
    await moveTask(task.id, "next");
    load();
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "bottom"]}>
      <Pressable style={styles.closeButton} onPress={() => router.back()} hitSlop={10}>
        <Feather name="x" size={20} color={theme.textDim} />
      </Pressable>

      {task === undefined && <View style={styles.center} />}

      {task === null && (
        <View style={styles.center}>
          <Feather name="feather" size={32} color={theme.textFaint} />
          <Text style={styles.emptyTitle}>Nothing left in Now</Text>
          <Text style={styles.emptyBody}>That's a fine place to be. Pull from Next when you're ready.</Text>
          <Pressable style={styles.backToBoard} onPress={() => router.back()}>
            <Text style={styles.backToBoardText}>Back to board</Text>
          </Pressable>
        </View>
      )}

      {task && (
        <View style={styles.center}>
          <Text style={styles.eyebrow}>One thing</Text>
          <Text style={styles.title}>{task.title}</Text>

          {!!task.notes && <Text style={styles.notes}>{task.notes}</Text>}

          <View style={styles.metaRow}>
            <View style={[styles.chip, { backgroundColor: theme.energy[task.energyLevel].bg }]}>
              <Text style={[styles.chipText, { color: theme.energy[task.energyLevel].fg }]}>
                {energyLabel[task.energyLevel]}
              </Text>
            </View>
            {task.estimatedMinutes != null && (
              <View style={styles.chip}>
                <Text style={styles.chipText}>{task.estimatedMinutes} min</Text>
              </View>
            )}
          </View>

          <Pressable style={styles.doneButton} onPress={markDone}>
            <Feather name="check" size={22} color="#FFFFFF" />
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>

          <Pressable style={styles.notNowButton} onPress={notNow}>
            <Text style={styles.notNowButtonText}>Not now</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  closeButton: { position: "absolute", top: 16, left: 16, zIndex: 1, padding: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 16 },
  eyebrow: {
    color: theme.textFaint,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  title: {
    color: theme.text,
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 34,
  },
  notes: { color: theme.textDim, fontSize: 15, textAlign: "center", lineHeight: 22 },
  metaRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  chip: {
    backgroundColor: theme.tile,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { color: theme.textDim, fontSize: 12, fontWeight: "700" },
  doneButton: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingVertical: 20,
    paddingHorizontal: 48,
    width: "100%",
  },
  doneButtonText: { color: "#FFFFFF", fontSize: 18, fontWeight: "800" },
  notNowButton: { paddingVertical: 12, paddingHorizontal: 24 },
  notNowButtonText: { color: theme.textFaint, fontSize: 14, fontWeight: "600" },
  emptyTitle: { color: theme.text, fontSize: 20, fontWeight: "800" },
  emptyBody: { color: theme.textDim, fontSize: 14, textAlign: "center", lineHeight: 20 },
  backToBoard: {
    marginTop: 8,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  backToBoardText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
