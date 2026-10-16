import { Stack, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import {
    addSpend,
    deleteSpend,
    getBudget,
    setWeekly,
    thisWeek,
    total,
    type BudgetData,
} from "../budget";

// ATI colours
const GREEN = "#1B5E3B";
const DARK = "#123D26";
const MINT = "#E6F2EA";
const PAGE = "#F7FAF8";
const TEXT = "#1F2D25";
const MUTED = "#4A5A50";
const WARN = "#9A3412";

const money = (n: number) => `£${n.toFixed(2)}`;

// Turns what the person typed into a number, or null if it isn't a sensible amount
function parseAmount(text: string): number | null {
  const n = parseFloat(text.replace(",", "."));
  if (!isFinite(n) || n <= 0 || n > 10000) return null;
  return Math.round(n * 100) / 100;
}

export default function BudgetScreen() {
  const [data, setData] = useState<BudgetData>({ weekly: null, spends: [] });
  const [weeklyText, setWeeklyText] = useState("");
  const [amountText, setAmountText] = useState("");
  const [noteText, setNoteText] = useState("");

  const load = useCallback(async () => {
    const d = await getBudget();
    setData(d);
    setWeeklyText(d.weekly !== null ? String(d.weekly) : "");
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const week = thisWeek(data.spends);
  const spent = total(week);
  const weekly = data.weekly;
  const left = weekly !== null ? Math.round((weekly - spent) * 100) / 100 : null;
  const progress = weekly ? Math.min(spent / weekly, 1) : 0;
  const over = left !== null && left < 0;

  const saveWeekly = async () => {
    const n = parseAmount(weeklyText);
    if (n === null) {
      Alert.alert("Check the amount", "Please enter a weekly budget like 60 or 45.50.");
      return;
    }
    await setWeekly(n);
    await load();
  };

  const add = async () => {
    const n = parseAmount(amountText);
    if (n === null) {
      Alert.alert("Check the amount", "Please enter what you spent, like 3.20.");
      return;
    }
    await addSpend(n, noteText);
    setAmountText("");
    setNoteText("");
    await load();
  };

  const remove = (id: string) =>
    Alert.alert("Remove this spend?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          await deleteSpend(id);
          await load();
        },
      },
    ]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <Stack.Screen options={{ title: "Food budget" }} />

      {/* Summary */}
      <View style={styles.card}>
        <Text style={styles.label}>THIS WEEK</Text>
        <Text style={styles.big}>{money(spent)}</Text>
        <Text style={styles.sub}>
          {weekly !== null ? `spent of ${money(weekly)}` : "spent - set a weekly budget below"}
        </Text>
        {weekly !== null && (
          <>
            <View style={styles.barTrack}>
              <View
                style={[styles.barFill, { width: `${progress * 100}%` }, over && { backgroundColor: WARN }]}
              />
            </View>
            <Text style={[styles.left, over && { color: WARN }]}>
              {over ? `Over budget by ${money(Math.abs(left!))}` : `${money(left!)} left`}
            </Text>
          </>
        )}
      </View>

      {/* Weekly budget */}
      <Text style={styles.heading}>Your weekly food budget</Text>
      <View style={styles.row}>
        <Text style={styles.pound}>£</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={weeklyText}
          onChangeText={setWeeklyText}
          placeholder="e.g. 60"
          placeholderTextColor={MUTED}
          keyboardType="decimal-pad"
          accessibilityLabel="Weekly food budget in pounds"
        />
        <Pressable style={styles.smallButton} onPress={saveWeekly} accessibilityRole="button">
          <Text style={styles.buttonText}>Save</Text>
        </Pressable>
      </View>

      {/* Add spend */}
      <Text style={styles.heading}>Add something you spent</Text>
      <View style={styles.row}>
        <Text style={styles.pound}>£</Text>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={amountText}
          onChangeText={setAmountText}
          placeholder="Amount, e.g. 3.20"
          placeholderTextColor={MUTED}
          keyboardType="decimal-pad"
          accessibilityLabel="Amount spent in pounds"
        />
      </View>
      <TextInput
        style={[styles.input, { marginTop: 8 }]}
        value={noteText}
        onChangeText={setNoteText}
        placeholder="What was it? (optional)"
        placeholderTextColor={MUTED}
        maxLength={60}
        accessibilityLabel="What you bought, optional"
      />
      <Pressable style={styles.button} onPress={add} accessibilityRole="button">
        <Text style={styles.buttonText}>Add to this week</Text>
      </Pressable>

      {/* This week's list */}
      <Text style={styles.heading}>This week's spending</Text>
      {week.length === 0 ? (
        <Text style={styles.note}>Nothing added yet this week.</Text>
      ) : (
        week.map((s) => (
          <View key={s.id} style={styles.spendRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.spendNote}>{s.note || "Food shop"}</Text>
              <Text style={styles.spendDate}>
                {new Date(s.time).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
              </Text>
            </View>
            <Text style={styles.spendAmount}>{money(s.amount)}</Text>
            <Pressable onPress={() => remove(s.id)} style={styles.removeButton} accessibilityRole="button">
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        ))
      )}

      <Text style={styles.note}>
        Your budget starts fresh every Monday. Everything here is saved on this phone only.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PAGE },
  card: { backgroundColor: MINT, borderRadius: 18, padding: 18, marginBottom: 8 },
  label: { fontSize: 13, fontWeight: "800", color: MUTED },
  big: { fontSize: 36, fontWeight: "800", color: DARK },
  sub: { fontSize: 15, color: MUTED, marginBottom: 10 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: "#CFE3D6", overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5, backgroundColor: GREEN },
  left: { fontSize: 16, fontWeight: "700", color: GREEN, marginTop: 8 },
  heading: { fontSize: 18, fontWeight: "800", color: DARK, marginTop: 20, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center" },
  pound: { fontSize: 20, fontWeight: "700", color: DARK, marginRight: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CFE3D6",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT,
  },
  button: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  smallButton: {
    backgroundColor: GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  spendRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: MINT,
    padding: 12,
    marginBottom: 8,
  },
  spendNote: { fontSize: 16, fontWeight: "700", color: TEXT },
  spendDate: { fontSize: 13, color: MUTED },
  spendAmount: { fontSize: 17, fontWeight: "800", color: DARK, marginHorizontal: 10 },
  removeButton: { paddingVertical: 6, paddingHorizontal: 8 },
  removeText: { fontSize: 14, fontWeight: "700", color: WARN },
  note: { fontSize: 13, color: MUTED, marginTop: 10, textAlign: "center" },
});