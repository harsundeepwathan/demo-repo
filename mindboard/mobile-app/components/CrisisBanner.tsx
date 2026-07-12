import { StyleSheet, Text, View } from "react-native";
import { theme } from "../lib/theme";

export function CrisisBanner() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>If you're in crisis right now</Text>
      <Text style={styles.body}>
        This app is a private journal, not emergency or clinical care. In the US, call or
        text 988 (Suicide & Crisis Lifeline) any time. Outside the US, contact your local
        emergency number or a crisis line for your country.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.tile,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 16,
    gap: 6,
  },
  title: {
    color: theme.text,
    fontWeight: "700",
    fontSize: 14,
  },
  body: {
    color: theme.textDim,
    fontSize: 13,
    lineHeight: 19,
  },
});
