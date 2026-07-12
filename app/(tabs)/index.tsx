import { useCallback, useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, router } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { Pressable } from "react-native";
import { theme, energyLabel } from "../../lib/theme";
import type { EnergyLevel, Task, TaskStatus } from "../../lib/types";
import { completeTask, createTask, listTasksByStatus, moveTask } from "../../lib/db";
import { onTasksChanged } from "../../lib/events";
import { Column } from "../../components/Column";
import { DragProvider } from "../../lib/dragAndDrop";

const ENERGY_LEVELS: EnergyLevel[] = ["low", "medium", "high"];

export default function BoardScreen() {
  const [now, setNow] = useState<Task[]>([]);
  const [next, setNext] = useState<Task[]>([]);
  const [someday, setSomeday] = useState<Task[]>([]);
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | null>(null);

  const load = useCallback(() => {
    listTasksByStatus("now").then(setNow);
    listTasksByStatus("next").then(setNext);
    listTasksByStatus("someday").then(setSomeday);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  useEffect(() => onTasksChanged(load), [load]);

  async function handleAdd(title: string, status: TaskStatus) {
    await createTask({ title, status, energyLevel: energyFilter ?? undefined });
    load();
  }

  async function handleComplete(id: string) {
    await completeTask(id);
    load();
  }

  async function handleMove(id: string, status: TaskStatus) {
    await moveTask(id, status);
    load();
  }

  const hasNow = now.length > 0;

  function applyFilter(tasks: Task[]) {
    return energyFilter ? tasks.filter((t) => t.energyLevel === energyFilter) : tasks;
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.heading}>Anchor</Text>
          <Text style={styles.subheading}>What's actually in front of you.</Text>
        </View>
        <Pressable
          style={[styles.focusButton, !hasNow && styles.focusButtonDisabled]}
          disabled={!hasNow}
          onPress={() => router.push("/focus")}
        >
          <Feather name="target" size={15} color={hasNow ? "#FFFFFF" : theme.textFaint} />
          <Text style={[styles.focusButtonText, !hasNow && styles.focusButtonTextDisabled]}>
            One Thing
          </Text>
        </Pressable>
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Show me what I have energy for</Text>
        <View style={styles.filterOptions}>
          {ENERGY_LEVELS.map((level) => {
            const active = energyFilter === level;
            const colors = theme.energy[level];
            return (
              <Pressable
                key={level}
                onPress={() => setEnergyFilter(active ? null : level)}
                style={[styles.filterChip, { backgroundColor: active ? colors.fg : colors.bg }]}
                accessibilityLabel={`Filter to ${energyLabel[level]}${active ? ", active" : ""}`}
              >
                <Text style={[styles.filterChipText, { color: active ? "#FFFFFF" : colors.fg }]}>
                  {level[0].toUpperCase() + level.slice(1)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} scrollEnabled={scrollEnabled}>
        <DragProvider setScrollEnabled={setScrollEnabled} onDrop={handleMove}>
          <Column title="Now" status="now" tasks={applyFilter(now)} onAdd={handleAdd} onComplete={handleComplete} onMove={handleMove} />
          <Column title="Next" status="next" tasks={applyFilter(next)} onAdd={handleAdd} onComplete={handleComplete} onMove={handleMove} />
          <Column title="Someday" status="someday" tasks={applyFilter(someday)} onAdd={handleAdd} onComplete={handleComplete} onMove={handleMove} />
        </DragProvider>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  topBar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  heading: { fontSize: 30, fontWeight: "800", color: theme.text, letterSpacing: -0.5 },
  subheading: { fontSize: 14, color: theme.textDim, marginTop: 2 },
  focusButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.accent,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  focusButtonDisabled: { backgroundColor: theme.tile },
  focusButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  focusButtonTextDisabled: { color: theme.textFaint },
  filterRow: { paddingHorizontal: 20, paddingTop: 14, gap: 8 },
  filterLabel: { color: theme.textFaint, fontSize: 12, fontWeight: "600" },
  filterOptions: { flexDirection: "row", gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  filterChipText: { fontSize: 12, fontWeight: "700" },
  content: { padding: 20, paddingTop: 16, gap: 26, paddingBottom: 48 },
});
