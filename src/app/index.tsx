import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getBudget, thisWeek, total, type BudgetData } from "../budget";
import { getScans, type SavedScan } from "../scans";

// ATI colours (taken from the logo)
const GREEN = "#1B5E3B";
const DARK = "#123D26";
const MINT = "#E6F2EA";
const PAGE = "#F7FAF8";
const TEXT = "#1F2D25";
const MUTED = "#4A5A50";

// EXAMPLE DATA ONLY - not real prices
const DEALS = [
  { id: "1", name: "Bananas", emoji: "🍌", price: "£0.59/kg", was: "£0.82/kg", save: "Save 28%" },
  { id: "2", name: "Tomatoes", emoji: "🍅", price: "£1.29", was: "£1.59", save: "Save 20%" },
  { id: "3", name: "Eggs (6 pack)", emoji: "🥚", price: "£1.20", was: "£1.41", save: "Save 15%" },
];

const NAV_ITEMS = [
  { label: "Home", emoji: "🏠" },
  { label: "Profile", emoji: "👤" },
  { label: "Chatbot", emoji: "💬" },
  { label: "Search", emoji: "🔍" },
  { label: "Settings", emoji: "⚙️" },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const [scans, setScans] = useState<SavedScan[]>([]);
  const [budget, setBudget] = useState<BudgetData>({ weekly: null, spends: [] });

  // Reload the saved scans every time the Home Screen comes back into view
  useFocusEffect(
    useCallback(() => {
      getScans().then(setScans);
      getBudget().then(setBudget);
    }, [])
  );

  const weekly = budget.weekly;
  const spent = total(thisWeek(budget.spends));
  const left = weekly !== null ? Math.round((weekly - spent) * 100) / 100 : null;
  const progress = weekly ? Math.min(spent / weekly, 1) : 0;
  const over = left !== null && left < 0;

  const comingSoon = (what: string) =>
    Alert.alert("Coming soon", `${what} will be added in a later step.`);

  return (
    <View style={styles.page}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 24,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>ATI</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.appName}>Adjusting to Inflation</Text>
            <Text style={styles.tagline}>Smarter shopping. Healthier choices.</Text>
          </View>
        </View>

        {/* Search */}
        <TextInput
          style={styles.search}
          placeholder="Search for a product, brand or category..."
          placeholderTextColor={MUTED}
          value={search}
          onChangeText={setSearch}
          accessibilityLabel="Search for a product"
        />

        {/* Scan card */}
        <View style={styles.scanCard}>
          <Text style={styles.scanTitle}>Find cheaper alternatives & best deals</Text>
          <Text style={styles.scanSub}>Scan a product or search to save money.</Text>
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push("/scan")}
            accessibilityRole="button"
            accessibilityLabel="Scan product"
          >
            <Text style={styles.scanButtonText}>📷  Scan product</Text>
          </Pressable>
        </View>

        {/* Deals */}
        <Text style={styles.sectionTitle}>Top Deals for You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {DEALS.map((d) => (
            <View key={d.id} style={styles.dealCard}>
              <Text style={styles.saveBadge}>{d.save}</Text>
              <Text style={styles.dealEmoji}>{d.emoji}</Text>
              <Text style={styles.dealName}>{d.name}</Text>
              <Text style={styles.dealPrice}>{d.price}</Text>
              <Text style={styles.dealWas}>{d.was}</Text>
            </View>
          ))}
        </ScrollView>
        <Text style={styles.note}>Example prices only</Text>

        {/* Recently scanned */}
        <Text style={styles.sectionTitle}>Recently Scanned</Text>
        {scans.length === 0 ? (
          <Text style={styles.note}>Nothing scanned yet. Tap Scan product to start.</Text>
        ) : (
          scans.slice(0, 5).map((s) => (
            <View key={s.code} style={styles.scanRow}>
              <Text style={styles.scanName}>{s.name}</Text>
              <Text style={styles.scanMeta}>
                {[s.brand, s.quantity].filter(Boolean).join(" - ") || s.code}
              </Text>
            </View>
          ))
        )}
        <View style={{ height: 8 }} />

        {/* Budget */}
        <Pressable
          style={styles.budgetCard}
          onPress={() => router.push("/budget")}
          accessibilityRole="button"
          accessibilityLabel="Open your food budget"
        >
          <Text style={styles.budgetLabel}>Your Food Budget</Text>
          <Text style={styles.budgetSpent}>£{spent.toFixed(2)}</Text>
          {weekly === null ? (
            <Text style={styles.budgetOf}>spent this week. Tap to set your weekly budget</Text>
          ) : (
            <>
              <Text style={styles.budgetOf}>of £{weekly.toFixed(2)} this week</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${progress * 100}%` }]} />
              </View>
              <Text style={[styles.budgetLeft, over && { color: "#9A3412" }]}>
                {over ? `Over budget by £${Math.abs(left!).toFixed(2)}` : `£${left!.toFixed(2)} left`}
              </Text>
            </>
          )}
          <Text style={styles.budgetTap}>Tap to add spending</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom navigation (buttons do nothing yet) */}
      <View style={[styles.nav, { paddingBottom: insets.bottom + 8 }]}>
        {NAV_ITEMS.map((item) => (
          <Pressable
            key={item.label}
            style={styles.navItem}
            onPress={() => item.label !== "Home" && comingSoon(item.label)}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Text style={styles.navEmoji}>{item.emoji}</Text>
            <Text style={[styles.navLabel, item.label === "Home" && styles.navActive]}>
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PAGE },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  logoBox: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: GREEN,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoText: { color: "#F6F1E3", fontSize: 22, fontWeight: "800" },
  appName: { fontSize: 20, fontWeight: "800", color: DARK },
  tagline: { fontSize: 14, color: GREEN },
  search: {
    backgroundColor: MINT,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: TEXT,
    marginBottom: 16,
  },
  scanCard: { backgroundColor: MINT, borderRadius: 18, padding: 18, marginBottom: 20 },
  scanTitle: { fontSize: 20, fontWeight: "800", color: DARK, marginBottom: 6 },
  scanSub: { fontSize: 15, color: MUTED, marginBottom: 14 },
  scanButton: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  scanButtonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: DARK, marginBottom: 10 },
  dealCard: {
    width: 130,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: MINT,
  },
  saveBadge: {
    alignSelf: "flex-start",
    backgroundColor: GREEN,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: "hidden",
  },
  dealEmoji: { fontSize: 44, textAlign: "center", marginVertical: 8 },
  dealName: { fontSize: 15, fontWeight: "700", color: TEXT },
  dealPrice: { fontSize: 17, fontWeight: "800", color: GREEN },
  dealWas: { fontSize: 13, color: MUTED, textDecorationLine: "line-through" },
  note: { fontSize: 12, color: MUTED, marginTop: 6, marginBottom: 16 },
  scanRow: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: MINT,
  },
  scanName: { fontSize: 16, fontWeight: "700", color: TEXT },
  scanMeta: { fontSize: 13, color: MUTED, marginTop: 2 },
  budgetCard: { backgroundColor: MINT, borderRadius: 18, padding: 18 },
  budgetLabel: { fontSize: 15, fontWeight: "700", color: DARK },
  budgetSpent: { fontSize: 32, fontWeight: "800", color: DARK },
  budgetOf: { fontSize: 15, color: MUTED, marginBottom: 10 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: "#CFE3D6", overflow: "hidden" },
  barFill: { height: 10, borderRadius: 5, backgroundColor: GREEN },
  budgetTap: { fontSize: 13, color: MUTED, marginTop: 8 },
  budgetLeft: { fontSize: 15, fontWeight: "700", color: GREEN, marginTop: 8 },
  nav: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: MINT,
    paddingTop: 8,
  },
  navItem: { flex: 1, alignItems: "center" },
  navEmoji: { fontSize: 22 },
  navLabel: { fontSize: 12, color: MUTED, marginTop: 2 },
  navActive: { color: GREEN, fontWeight: "800" },
});