import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { getSetting, initDb, runAutoMigration } from "../lib/db";
import { theme } from "../lib/theme";

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initDb()
      .then(() => getSetting("autoMigrateDays"))
      .then((days) => runAutoMigration(parseInt(days, 10) || 3))
      .then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.bg }}>
        <ActivityIndicator color={theme.accent} size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="focus" options={{ presentation: "fullScreenModal", animation: "fade" }} />
          <Stack.Screen name="task/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="goal/[id]" options={{ presentation: "card" }} />
          <Stack.Screen name="goal/new" options={{ presentation: "modal" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
