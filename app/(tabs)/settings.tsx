import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../../lib/theme";
import { getSetting, setSetting } from "../../lib/db";

const MIGRATE_OPTIONS = [1, 3, 7, 14];

export default function SettingsScreen() {
  const [autoMigrateDays, setAutoMigrateDays] = useState(3);

  useFocusEffect(
    useCallback(() => {
      getSetting("autoMigrateDays").then((v) => setAutoMigrateDays(parseInt(v, 10) || 3));
    }, [])
  );

  async function chooseDays(days: number) {
    setAutoMigrateDays(days);
    await setSetting("autoMigrateDays", String(days));
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.panel}>
        <View style={styles.panelTitleRow}>
          <Feather name="wind" size={13} color={theme.accent} />
          <Text style={styles.panelTitle}>Let things drift</Text>
        </View>
        <Text style={styles.panelBody}>
          If a task sits in Now without being touched, move it to Someday after…
        </Text>
        <View style={styles.optionRow}>
          {MIGRATE_OPTIONS.map((days) => (
            <Pressable
              key={days}
              style={[styles.option, autoMigrateDays === days && styles.optionActive]}
              onPress={() => chooseDays(days)}
            >
              <Text style={[styles.optionText, autoMigrateDays === days && styles.optionTextActive]}>
                {days} day{days === 1 ? "" : "s"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Text style={styles.footnote}>
        Anchor is a private planner, not therapy or medical advice. It won't diagnose you or
        replace a professional.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 20, paddingTop: 12, gap: 16 },
  heading: { fontSize: 28, fontWeight: "800", color: theme.text, letterSpacing: -0.5 },
  panel: {
    backgroundColor: theme.panel,
    borderRadius: theme.radius,
    padding: 20,
    gap: 12,
    ...theme.card,
  },
  panelTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  panelTitle: {
    color: theme.accent,
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  panelBody: { color: theme.textDim, fontSize: 13, lineHeight: 19 },
  optionRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: theme.tile,
  },
  optionActive: { backgroundColor: theme.accent },
  optionText: { color: theme.textDim, fontSize: 13, fontWeight: "700" },
  optionTextActive: { color: "#FFFFFF" },
  footnote: { color: theme.textFaint, fontSize: 11, lineHeight: 16, marginTop: "auto", paddingBottom: 8 },
});
