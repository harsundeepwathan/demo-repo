import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { theme } from "../../lib/theme";

export default function RecapScreen() {
  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Text style={styles.heading}>Recap</Text>
      <Text style={styles.body}>Coming soon.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, padding: 20, paddingTop: 12 },
  heading: { fontSize: 28, fontWeight: "800", color: theme.text, letterSpacing: -0.5 },
  body: { color: theme.textDim, fontSize: 14, marginTop: 8 },
});
