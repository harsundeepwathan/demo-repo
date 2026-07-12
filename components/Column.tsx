import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../lib/theme";
import type { Task, TaskStatus } from "../lib/types";
import { TaskCard } from "./TaskCard";
import { useDragContext } from "../lib/dragAndDrop";

export function Column({
  title,
  status,
  tasks,
  onAdd,
  onComplete,
  onMove,
}: {
  title: string;
  status: TaskStatus;
  tasks: Task[];
  onAdd: (title: string, status: TaskStatus) => void;
  onComplete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const { registerZone } = useDragContext();

  function submit() {
    const trimmed = draft.trim();
    if (trimmed) onAdd(trimmed, status);
    setDraft("");
    setAdding(false);
  }

  return (
    <View style={styles.column} ref={(node) => registerZone(status, node)}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{tasks.length}</Text>
      </View>

      <View style={styles.list}>
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onComplete={onComplete} onMove={onMove} />
        ))}

        {adding ? (
          <View style={styles.addRow}>
            <TextInput
              autoFocus
              value={draft}
              onChangeText={setDraft}
              placeholder="Task title…"
              placeholderTextColor={theme.textFaint}
              style={styles.input}
              onSubmitEditing={submit}
              returnKeyType="done"
              onBlur={() => {
                if (draft.trim()) submit();
                else setAdding(false);
              }}
            />
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={() => setAdding(true)}>
            <Feather name="plus" size={14} color={theme.textFaint} />
            <Text style={styles.addButtonText}>Add task</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  column: { gap: 10, minHeight: 100 },
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2 },
  title: { color: theme.text, fontSize: 15, fontWeight: "800" },
  count: {
    color: theme.textFaint,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: theme.tile,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: "hidden",
  },
  list: { gap: 8 },
  addRow: {
    backgroundColor: theme.panel,
    borderRadius: theme.radiusSm,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: theme.accentSoft,
  },
  input: { color: theme.text, fontSize: 14, paddingVertical: 8 },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  addButtonText: { color: theme.textFaint, fontSize: 13, fontWeight: "600" },
});
