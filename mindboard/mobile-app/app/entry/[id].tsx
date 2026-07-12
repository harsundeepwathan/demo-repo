import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { getEntry } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { Entry } from "../../lib/types";

export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!id) return;
    getEntry(id)
      .then(setEntry)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Failed to load"));
  }, [id]);

  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{errorMessage}</Text>
      </View>
    );
  }

  if (!entry) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.date}>
        {new Date(entry.createdAt).toLocaleString(undefined, {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })}
      </Text>

      <View style={styles.panel}>
        <Text style={styles.label}>What you said</Text>
        <Text style={styles.transcript}>{entry.transcript}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Reflection</Text>
        <Text style={styles.body}>{entry.supportiveNote}</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.label}>Something small to try</Text>
        <Text style={styles.body}>{entry.suggestion}</Text>
      </View>

      {entry.themes.length > 0 && (
        <View style={styles.themeRow}>
          {entry.themes.map((t) => (
            <View key={t} style={styles.themeChip}>
              <Text style={styles.themeChipText}>{t}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 14, paddingBottom: 40 },
  center: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" },
  errorText: { color: theme.danger },
  date: { color: theme.textDim, fontSize: 13, fontWeight: "600" },
  panel: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    gap: 8,
  },
  label: {
    color: theme.textDim,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  transcript: { color: theme.text, fontSize: 15, lineHeight: 22 },
  body: { color: theme.text, fontSize: 15, lineHeight: 22 },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  themeChip: {
    backgroundColor: theme.tile,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  themeChipText: { color: theme.textDim, fontSize: 12 },
});
