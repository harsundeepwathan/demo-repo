import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../lib/theme";

export default function NewGoalScreen() {
  return (
    <View style={styles.screen}>
      <Text style={styles.body}>Coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" },
  body: { color: theme.textDim, fontSize: 14 },
});
