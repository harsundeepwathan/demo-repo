import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { useFocusEffect, useRouter } from "expo-router";
import { listEntries } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { Entry } from "../../lib/types";

function moodEmoji(score: number): string {
  if (score >= 3) return "🙂";
  if (score >= 1) return "🙂";
  if (score > -1) return "😐";
  if (score > -3) return "😕";
  return "😞";
}

function moodBadgeColor(score: number): string {
  if (score >= 1) return theme.goodSoft;
  if (score > -1) return theme.tile;
  return theme.dangerSoft;
}

export default function HistoryScreen() {
  const router = useRouter();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    listEntries()
      .then(setEntries)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  if (!loading && entries.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No check-ins yet. Head to Talk to record one.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.content}
      data={entries}
      keyExtractor={(item) => item.id}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accent} />}
      renderItem={({ item }) => (
        <Pressable style={styles.row} onPress={() => router.push(`/entry/${item.id}`)}>
          <View style={[styles.emojiBadge, { backgroundColor: moodBadgeColor(item.moodScore) }]}>
            <Text style={styles.emoji}>{moodEmoji(item.moodScore)}</Text>
          </View>
          <View style={styles.rowBody}>
            <Text style={styles.rowDate}>
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </Text>
            <Text style={styles.rowSnippet} numberOfLines={2}>
              {item.transcript}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={theme.textFaint} />
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, paddingTop: 20, gap: 12 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: theme.textFaint, textAlign: "center" },
  errorText: { color: theme.danger, textAlign: "center" },
  row: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: theme.panel,
    borderRadius: theme.radiusSm,
    padding: 16,
    alignItems: "center",
    ...theme.card,
  },
  emojiBadge: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 22 },
  rowBody: { flex: 1, gap: 4 },
  rowDate: { color: theme.accent, fontSize: 12, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 },
  rowSnippet: { color: theme.text, fontSize: 14, lineHeight: 19 },
});
