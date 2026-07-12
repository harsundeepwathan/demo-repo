import AsyncStorage from "@react-native-async-storage/async-storage";

const SERVER_URL_KEY = "mindboard.serverUrl";

export async function getServerUrl(): Promise<string | null> {
  return AsyncStorage.getItem(SERVER_URL_KEY);
}

export async function setServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(SERVER_URL_KEY, url.trim().replace(/\/+$/, ""));
}
