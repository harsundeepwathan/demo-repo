import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
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
        <View style={styles.labelRow}>
          <Feather name="message-circle" size={13} color={theme.textDim} />
          <Text style={styles.label}>What you said</Text>
        </View>
        <Text style={styles.transcript}>{entry.transcript}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.labelRow}>
          <Feather name="heart" size={13} color={theme.textDim} />
          <Text style={styles.label}>Reflection</Text>
        </View>
        <Text style={styles.body}>{entry.supportiveNote}</Text>
      </View>

      <View style={styles.panel}>
        <View style={styles.labelRow}>
          <Feather name="compass" size={13} color={theme.textDim} />
          <Text style={styles.label}>Something small to try</Text>
        </View>
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
  date: { color: theme.accent, fontSize: 13, fontWeight: "800" },
  panel: {
    backgroundColor: theme.panel,
    borderRadius: theme.radius,
    padding: 18,
    gap: 8,
    ...theme.card,
  },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: {
    color: theme.textDim,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  transcript: { color: theme.text, fontSize: 15, lineHeight: 22 },
  body: { color: theme.text, fontSize: 15, lineHeight: 22 },
  themeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  themeChip: {
    backgroundColor: theme.accentSoft,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  themeChipText: { color: theme.accentStrong, fontSize: 12, fontWeight: "700" },
});
