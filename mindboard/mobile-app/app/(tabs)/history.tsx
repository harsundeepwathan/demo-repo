import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
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
          <Text style={styles.emoji}>{moodEmoji(item.moodScore)}</Text>
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
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 16, gap: 10 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: theme.textFaint, textAlign: "center" },
  errorText: { color: theme.danger, textAlign: "center" },
  row: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
  },
  emoji: { fontSize: 24 },
  rowBody: { flex: 1, gap: 4 },
  rowDate: { color: theme.textDim, fontSize: 12, fontWeight: "600" },
  rowSnippet: { color: theme.text, fontSize: 14, lineHeight: 19 },
});
