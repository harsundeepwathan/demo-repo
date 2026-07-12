import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { checkServerHealth, deleteAllEntries } from "../../lib/api";
import { getServerUrl, setServerUrl } from "../../lib/storage";
import { theme } from "../../lib/theme";
import { CrisisBanner } from "../../components/CrisisBanner";

type ConnectionState = "unknown" | "checking" | "ok" | "failed";

export default function SettingsScreen() {
  const [url, setUrl] = useState("");
  const [connection, setConnection] = useState<ConnectionState>("unknown");

  useEffect(() => {
    getServerUrl().then((saved) => {
      if (saved) setUrl(saved);
    });
  }, []);

  async function save() {
    if (!url.trim()) return;
    setConnection("checking");
    const healthy = await checkServerHealth(url);
    await setServerUrl(url);
    setConnection(healthy ? "ok" : "failed");
  }

  function confirmDeleteAll() {
    Alert.alert(
      "Delete all check-ins?",
      "This removes every recording, transcript, and reflection from your server. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteAllEntries();
              Alert.alert("Done", "All your check-ins have been deleted.");
            } catch (err) {
              Alert.alert("Couldn't delete", err instanceof Error ? err.message : "Try again.");
            }
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Settings</Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Backend server</Text>
        <Text style={styles.helpText}>
          Mindboard needs your self-hosted server's address, e.g. http://192.168.1.20:4000.
          Both your phone and the server need to be on the same network during development.
        </Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          placeholder="http://192.168.1.20:4000"
          placeholderTextColor={theme.textFaint}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Pressable style={styles.primaryButton} onPress={save}>
          <Text style={styles.primaryButtonText}>Save & test connection</Text>
        </Pressable>
        {connection === "checking" && <Text style={styles.helpText}>Checking…</Text>}
        {connection === "ok" && <Text style={styles.okText}>Connected.</Text>}
        {connection === "failed" && (
          <Text style={styles.errorText}>
            Saved, but couldn't reach that address. Double check it's running and reachable.
          </Text>
        )}
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Privacy</Text>
        <Text style={styles.helpText}>
          Your voice check-ins are sent to the server you configure above for
          transcription and analysis, and stored there — not on Anthropic's or any
          third party's servers beyond what your server's providers process. You control
          where that server runs and can delete everything at any time.
        </Text>
      </View>

      <CrisisBanner />

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Data</Text>
        <Pressable style={styles.dangerButton} onPress={confirmDeleteAll}>
          <Text style={styles.dangerButtonText}>Delete all my data</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  heading: { fontSize: 24, fontWeight: "700", color: theme.text },
  panel: {
    backgroundColor: theme.panel,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: 18,
    gap: 10,
  },
  panelTitle: {
    color: theme.textDim,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  helpText: { color: theme.textDim, fontSize: 13, lineHeight: 19 },
  input: {
    backgroundColor: theme.tile,
    borderColor: theme.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: theme.text,
    fontSize: 14,
  },
  primaryButton: {
    backgroundColor: theme.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: { color: "#0d0f18", fontWeight: "700" },
  okText: { color: theme.good, fontSize: 13 },
  errorText: { color: theme.danger, fontSize: 13, lineHeight: 18 },
  dangerButton: {
    borderColor: theme.danger,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  dangerButtonText: { color: theme.danger, fontWeight: "700" },
});
