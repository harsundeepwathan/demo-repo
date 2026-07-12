import { Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { theme } from "../lib/theme";
import type { Task, TaskStatus } from "../lib/types";
import { useDragContext } from "../lib/dragAndDrop";

const STATUS_ORDER: TaskStatus[] = ["now", "next", "someday"];

export function TaskCard({
  task,
  onComplete,
  onMove,
}: {
  task: Task;
  onComplete: (id: string) => void;
  onMove: (id: string, status: TaskStatus) => void;
}) {
  const index = STATUS_ORDER.indexOf(task.status);
  const canMoveLeft = index > 0;
  const canMoveRight = index < STATUS_ORDER.length - 1;

  const { boundsShared, measureZones, setScrollEnabled, onDrop } = useDragContext();
  const translateY = useSharedValue(0);
  const isDragging = useSharedValue(false);

  function commitDrop(taskId: string, absoluteY: number) {
    const bounds = boundsShared.value;
    if (bounds.length === 0) return;
    // Bands extend to infinity at the top and bottom edge, split at midpoints
    // between adjacent zones, so a drop anywhere above/below the columns still
    // resolves to the nearest one rather than silently doing nothing.
    let target: TaskStatus = bounds[0].status;
    for (let i = 0; i < bounds.length - 1; i++) {
      const midpoint = (bounds[i].y + bounds[i].height + bounds[i + 1].y) / 2;
      if (absoluteY >= midpoint) {
        target = bounds[i + 1].status;
      }
    }
    if (target !== task.status) {
      onDrop(taskId, target);
    }
  }

  const pan = Gesture.Pan()
    .minDistance(8)
    .onBegin(() => {
      runOnJS(setScrollEnabled)(false);
      runOnJS(measureZones)();
    })
    .onStart(() => {
      isDragging.value = true;
    })
    .onUpdate((e) => {
      translateY.value = e.translationY;
    })
    .onEnd((e) => {
      runOnJS(commitDrop)(task.id, e.absoluteY);
      translateY.value = withTiming(0);
      isDragging.value = false;
    })
    .onFinalize(() => {
      runOnJS(setScrollEnabled)(true);
    });

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: isDragging.value ? 1.02 : 1 }],
    zIndex: isDragging.value ? 10 : 0,
    shadowOpacity: isDragging.value ? 0.18 : 0.06,
  }));

  return (
    <Animated.View style={[styles.card, cardAnimatedStyle]}>
      <Pressable
        style={styles.checkbox}
        onPress={() => onComplete(task.id)}
        hitSlop={8}
        accessibilityLabel={`Complete ${task.title}`}
      >
        <Feather name="check" size={14} color={theme.panel} style={styles.checkIcon} />
      </Pressable>

      <GestureDetector gesture={pan}>
        <Animated.View style={styles.dragHandle} accessibilityLabel={`Drag ${task.title} to another column`}>
          <Feather name="move" size={14} color={theme.textFaint} />
        </Animated.View>
      </GestureDetector>

      <Pressable
        style={styles.body}
        onPress={() => router.push(`/task/${task.id}`)}
        accessibilityLabel={`Open ${task.title}`}
      >
        <View style={styles.titleRow}>
          <View style={[styles.energyDot, { backgroundColor: theme.energy[task.energyLevel].fg }]} />
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
        </View>
        {task.estimatedMinutes != null && (
          <Text style={styles.meta}>{task.estimatedMinutes} min</Text>
        )}
      </Pressable>

      <View style={styles.moveRow}>
        <Pressable
          disabled={!canMoveLeft}
          onPress={() => canMoveLeft && onMove(task.id, STATUS_ORDER[index - 1])}
          hitSlop={8}
          style={styles.moveButton}
          accessibilityLabel={`Move ${task.title} left`}
        >
          <Feather name="chevron-left" size={16} color={canMoveLeft ? theme.textDim : theme.tile} />
        </Pressable>
        <Pressable
          disabled={!canMoveRight}
          onPress={() => canMoveRight && onMove(task.id, STATUS_ORDER[index + 1])}
          hitSlop={8}
          style={styles.moveButton}
          accessibilityLabel={`Move ${task.title} right`}
        >
          <Feather name="chevron-right" size={16} color={canMoveRight ? theme.textDim : theme.tile} />
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.panel,
    borderRadius: theme.radiusSm,
    padding: 12,
    gap: 8,
    shadowColor: theme.card.shadowColor,
    shadowOffset: theme.card.shadowOffset,
    shadowRadius: theme.card.shadowRadius,
    elevation: theme.card.elevation,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  checkIcon: { opacity: 0 },
  dragHandle: {
    width: 22,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, gap: 2 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  energyDot: { width: 7, height: 7, borderRadius: 4 },
  title: { color: theme.text, fontSize: 14, fontWeight: "600", flexShrink: 1 },
  meta: { color: theme.textFaint, fontSize: 11, fontWeight: "600" },
  moveRow: { flexDirection: "row", gap: 2 },
  moveButton: { padding: 4 },
});
