import AsyncStorage from "@react-native-async-storage/async-storage";

// One thing the person spent money on, saved on this phone only
export type Spend = {
  id: string;
  amount: number;
  note: string;
  time: number;
};

export type BudgetData = {
  weekly: number | null; // null = not set yet
  spends: Spend[];
};

const KEY = "ati:budget";
const MAX_SPENDS = 200;

// The start of the current week (Monday 00:00), as a timestamp
export function weekStart(d: Date = new Date()): number {
  const x = new Date(d);
  const daysSinceMonday = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - daysSinceMonday);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

// Only the spends from this week - the budget starts fresh each Monday
export function thisWeek(spends: Spend[]): Spend[] {
  const start = weekStart();
  return spends.filter((s) => s.time >= start);
}

export function total(spends: Spend[]): number {
  return Math.round(spends.reduce((sum, s) => sum + s.amount, 0) * 100) / 100;
}

export async function getBudget(): Promise<BudgetData> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return { weekly: null, spends: [] };
    const data = JSON.parse(raw);
    return {
      weekly: typeof data.weekly === "number" ? data.weekly : null,
      spends: Array.isArray(data.spends) ? data.spends : [],
    };
  } catch {
    return { weekly: null, spends: [] };
  }
}

async function write(data: BudgetData): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // If saving fails, the app still works - it just isn't remembered
  }
}

export async function setWeekly(amount: number): Promise<void> {
  const data = await getBudget();
  await write({ ...data, weekly: amount });
}

export async function addSpend(amount: number, note: string): Promise<void> {
  const data = await getBudget();
  const spend: Spend = {
    id: `${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    amount,
    note: note.trim(),
    time: Date.now(),
  };
  await write({ ...data, spends: [spend, ...data.spends].slice(0, MAX_SPENDS) });
}

export async function deleteSpend(id: string): Promise<void> {
  const data = await getBudget();
  await write({ ...data, spends: data.spends.filter((s) => s.id !== id) });
}