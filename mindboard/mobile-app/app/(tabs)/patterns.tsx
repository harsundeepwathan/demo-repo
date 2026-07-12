import { useCallback, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { getInsights } from "../../lib/api";
import { theme } from "../../lib/theme";
import type { Insights } from "../../lib/types";
import { TrendChart } from "../../components/TrendChart";

export default function PatternsScreen() {
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getInsights()
      .then(setInsights)
      .catch((err) => setErrorMessage(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={theme.accent} />}
    >
      <Text style={styles.heading}>Patterns</Text>

      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : (
        <>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Mood, last 14 days</Text>
            <TrendChart points={insights?.moodTrend ?? []} />
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>What keeps coming up</Text>
            {insights && insights.topThemes.length > 0 ? (
              <View style={styles.themeList}>
                {insights.topThemes.map((t) => (
                  <View key={t.theme} style={styles.themeRow}>
                    <Text style={styles.themeName}>{t.theme}</Text>
                    <View style={styles.themeBarTrack}>
                      <View
                        style={[
                          styles.themeBarFill,
                          {
                            width: `${Math.min(
                              100,
                              (t.count / insights.topThemes[0].count) * 100
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.themeCount}>{t.count}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>
                Recurring themes will show up here after a few check-ins.
              </Text>
            )}
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Worth noticing</Text>
            {insights && insights.observations.length > 0 ? (
              insights.observations.map((o) => (
                <Text key={o} style={styles.observation}>
                  •  {o}
                </Text>
              ))
            ) : (
              <Text style={styles.emptyText}>
                Nothing stands out yet — that's a fine place to be.
              </Text>
            )}
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: "700", color: theme.text },
  errorText: { color: theme.danger, textAlign: "center", marginTop: 40 },
  panel: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 18,
    gap: 12,
  },
  panelTitle: {
    color: theme.textDim,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  emptyText: { color: theme.textFaint, fontSize: 13, lineHeight: 18 },
  themeList: { gap: 10 },
  themeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  themeName: { color: theme.text, fontSize: 13, width: 90 },
  themeBarTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.tile,
    overflow: "hidden",
  },
  themeBarFill: { height: 8, borderRadius: 4, backgroundColor: theme.accent },
  themeCount: { color: theme.textDim, fontSize: 12, width: 20, textAlign: "right" },
  observation: { color: theme.text, fontSize: 14, lineHeight: 20 },
});
