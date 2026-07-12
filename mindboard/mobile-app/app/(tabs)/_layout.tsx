import { Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import { StyleSheet, View } from "react-native";
import { theme } from "../../lib/theme";

type IconName = keyof typeof Feather.glyphMap;

function TabIcon({ name, focused }: { name: IconName; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Feather name={name} size={20} color={focused ? theme.accent : theme.textFaint} />
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.text,
        headerTitleStyle: { fontWeight: "700" },
        headerShadowVisible: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textFaint,
        tabBarItemStyle: { paddingTop: 4 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Talk",
          tabBarIcon: ({ focused }) => <TabIcon name="mic" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ focused }) => <TabIcon name="clock" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="patterns"
        options={{
          title: "Patterns",
          tabBarIcon: ({ focused }) => <TabIcon name="trending-up" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ focused }) => <TabIcon name="settings" focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: theme.panel,
    borderTopWidth: 0,
    height: 84,
    paddingTop: 10,
    paddingBottom: 24,
    shadowColor: "#2B2557",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  iconWrap: {
    width: 40,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: theme.accentSoft,
  },
});
