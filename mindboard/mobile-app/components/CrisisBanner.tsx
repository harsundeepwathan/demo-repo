import { StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { theme } from "../lib/theme";

export function CrisisBanner() {
  return (
    <View style={styles.container}>
      <View style={styles.accentBar} />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Feather name="alert-triangle" size={16} color={theme.danger} />
          <Text style={styles.title}>If you're in crisis right now</Text>
        </View>
        <Text style={styles.text}>
          This app is a private journal, not emergency or clinical care. In the US, call or
          text 988 (Suicide & Crisis Lifeline) any time. Outside the US, contact your local
          emergency number or a crisis line for your country.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: theme.dangerSoft,
    borderRadius: theme.radius,
    overflow: "hidden",
  },
  accentBar: {
    width: 5,
    backgroundColor: theme.danger,
  },
  body: {
    flex: 1,
    padding: 16,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    color: theme.danger,
    fontWeight: "800",
    fontSize: 14,
  },
  text: {
    color: theme.textDim,
    fontSize: 13,
    lineHeight: 19,
  },
});
