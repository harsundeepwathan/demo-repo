import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../../lib/theme";
import type { EnergyLevel, Task } from "../../lib/types";
import { deleteTask, getTask, updateTask } from "../../lib/db";
import { EnergySelector } from "../../components/EnergySelector";

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [estimate, setEstimate] = useState("");
  const [energy, setEnergy] = useState<EnergyLevel>("medium");

  const load = useCallback(() => {
    if (!id) return;
    getTask(id).then((t) => {
      if (!t) return;
      setTask(t);
      setTitle(t.title);
      setNotes(t.notes);
      setEstimate(t.estimatedMinutes != null ? String(t.estimatedMinutes) : "");
      setEnergy(t.energyLevel);
    });
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function save() {
    if (!task) return;
    const minutes = estimate.trim() ? Math.max(1, parseInt(estimate, 10) || 0) : null;
    await updateTask(task.id, {
      title: title.trim() || task.title,
      notes,
      estimatedMinutes: minutes,
      energyLevel: energy,
    });
    router.back();
  }

  function confirmDelete() {
    if (!task) return;
    Alert.alert("Delete this task?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await deleteTask(task.id);
          router.back();
        },
      },
    ]);
  }

  if (!task) {
    return <SafeAreaView style={styles.screen} edges={["top"]} />;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
    <ScrollView contentContainerStyle={styles.content}>
      <Pressable style={styles.backRow} onPress={() => router.back()} hitSlop={8}>
        <Feather name="arrow-left" size={18} color={theme.textDim} />
        <Text style={styles.backText}>Board</Text>
      </Pressable>

      <View style={styles.panel}>
        <Text style={styles.label}>Title</Text>
        <TextInput value={title} onChangeText={setTitle} style={styles.titleInput} multiline />

        <Text style={styles.label}>Notes</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          style={styles.notesInput}
          multiline
          placeholder="Any details worth remembering…"
          placeholderTextColor={theme.textFaint}
        />

        <Text style={styles.label}>Estimated minutes</Text>
        <TextInput
          value={estimate}
          onChangeText={setEstimate}
          style={styles.notesInput}
          keyboardType="number-pad"
          placeholder="e.g. 15"
          placeholderTextColor={theme.textFaint}
        />

        <Text style={styles.label}>Energy needed</Text>
        <View style={styles.energyWrap}>
          <EnergySelector value={energy} onChange={setEnergy} />
        </View>

        {task.pushCount > 0 && (
          <Text style={styles.meta}>
            Pushed {task.pushCount} time{task.pushCount === 1 ? "" : "s"}
          </Text>
        )}
      </View>

      <Pressable style={styles.saveButton} onPress={save}>
        <Feather name="check" size={16} color="#FFFFFF" />
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={confirmDelete}>
        <Feather name="trash-2" size={15} color={theme.textDim} />
        <Text style={styles.deleteButtonText}>Delete task</Text>
      </Pressable>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, paddingTop: 12, gap: 16, paddingBottom: 48 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backText: { color: theme.textDim, fontSize: 14, fontWeight: "600" },
  panel: {
    backgroundColor: theme.panel,
    borderRadius: theme.radius,
    padding: 20,
    gap: 6,
    ...theme.card,
  },
  label: {
    color: theme.textFaint,
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: 14,
  },
  titleInput: { color: theme.text, fontSize: 18, fontWeight: "700", paddingVertical: 4 },
  energyWrap: { marginTop: 6 },
  notesInput: { color: theme.text, fontSize: 14, paddingVertical: 4, lineHeight: 20 },
  meta: { color: theme.textFaint, fontSize: 12, fontWeight: "600", marginTop: 16 },
  saveButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingVertical: 14,
  },
  saveButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  deleteButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
  },
  deleteButtonText: { color: theme.textDim, fontWeight: "600", fontSize: 13 },
});
