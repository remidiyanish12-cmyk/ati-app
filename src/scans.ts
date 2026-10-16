import AsyncStorage from "@react-native-async-storage/async-storage";

// One scanned product, saved on this phone only
export type SavedScan = {
  code: string;
  name: string;
  brand: string;
  quantity: string;
  time: number;
};

const KEY = "ati:scans";
const MAX_SAVED = 20;

export async function getScans(): Promise<SavedScan[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Newest first. Scanning the same barcode again moves it to the top instead of adding a duplicate.
export async function saveScan(scan: SavedScan): Promise<void> {
  try {
    const list = await getScans();
    const next = [scan, ...list.filter((s) => s.code !== scan.code)].slice(0, MAX_SAVED);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // If saving fails, the app still works - the scan just isn't remembered
  }
}

export async function clearScans(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}