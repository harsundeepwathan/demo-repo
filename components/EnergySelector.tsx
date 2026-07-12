import { Pressable, StyleSheet, Text, View } from "react-native";
import { theme, energyLabel } from "../lib/theme";
import type { EnergyLevel } from "../lib/types";

const LEVELS: EnergyLevel[] = ["low", "medium", "high"];

export function EnergySelector({
  value,
  onChange,
}: {
  value: EnergyLevel;
  onChange: (level: EnergyLevel) => void;
}) {
  return (
    <View style={styles.row}>
      {LEVELS.map((level) => {
        const active = value === level;
        const colors = theme.energy[level];
        return (
          <Pressable
            key={level}
            onPress={() => onChange(level)}
            style={[
              styles.pill,
              { backgroundColor: active ? colors.fg : colors.bg },
            ]}
            accessibilityLabel={`${energyLabel[level]}${active ? ", selected" : ""}`}
          >
            <Text style={[styles.pillText, { color: active ? "#FFFFFF" : colors.fg }]}>
              {level[0].toUpperCase() + level.slice(1)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8 },
  pill: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
  },
  pillText: { fontSize: 13, fontWeight: "700" },
});
