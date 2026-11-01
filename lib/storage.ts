import AsyncStorage from "@react-native-async-storage/async-storage";
import { BACKGROUNDS, DEFAULT_BACKGROUND_ID } from "../constants/backgrounds";
import type { BackgroundId, Connection } from "../types/canvas";

const CONNECTIONS_KEY = "@dots_connections";
const BACKGROUND_KEY = "@dots_background";

export async function loadConnections(validItemIds: Set<string>): Promise<Connection[]> {
  try {
    const raw = await AsyncStorage.getItem(CONNECTIONS_KEY);
    if (!raw) return []; // V2 data: no key -> empty array
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const seen = new Set<string>();
    return parsed.filter((c): c is Connection => {
      if (
        !c ||
        typeof c.id !== "string" ||
        typeof c.fromId !== "string" ||
        typeof c.toId !== "string" ||
        c.fromId === c.toId ||
        !validItemIds.has(c.fromId) ||
        !validItemIds.has(c.toId) ||
        seen.has(c.id)
      ) {
        return false;
      }
      seen.add(c.id);
      return true;
    });
  } catch (error) {
    console.log("Error loading connections:", error);
    return [];
  }
}

export async function saveConnections(connections: Connection[]) {
  try {
    await AsyncStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
  } catch (error) {
    console.log("Error saving connections:", error);
  }
}

export async function loadBackgroundId(): Promise<BackgroundId> {
  try {
    const raw = await AsyncStorage.getItem(BACKGROUND_KEY);
    const found = BACKGROUNDS.find((b) => b.id === raw);
    return found ? found.id : DEFAULT_BACKGROUND_ID; // missing -> white
  } catch {
    return DEFAULT_BACKGROUND_ID;
  }
}

export async function saveBackgroundId(id: BackgroundId) {
  try {
    await AsyncStorage.setItem(BACKGROUND_KEY, id);
  } catch (error) {
    console.log("Error saving background:", error);
  }
}