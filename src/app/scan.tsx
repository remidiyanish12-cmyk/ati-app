import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { saveScan } from "../scans";

// ATI colours
const GREEN = "#1B5E3B";
const DARK = "#123D26";
const MINT = "#E6F2EA";
const PAGE = "#F7FAF8";
const MUTED = "#4A5A50";

// Open Food Facts asks every app to identify itself with a custom User-Agent
const USER_AGENT = "ATI-SchoolProject/0.1";

type Deal = { name: string; price: number; altName: string; altPrice: number };

// EXAMPLE shown by the "Try the example product" button - not real prices
const EXAMPLE: Deal = {
  name: "Brand-name baked beans (400g)",
  price: 2.0,
  altName: "Supermarket own-brand baked beans (400g)",
  altPrice: 1.5,
};

// YOUR OWN PRICE LIST. Scan a real product, copy the barcode number shown on screen,
// then add a line here with prices you checked in a shop (note the date!). Example:
// "5000000000000": { name: "Beans 400g", price: 2.0, altName: "Own-brand beans 400g", altPrice: 1.5 },
const SAMPLE_PRICES: Record<string, Deal> = {};

type Info = { name: string; brand: string; quantity: string };

function Comparison({ deal }: { deal: Deal }) {
  const saving = deal.price - deal.altPrice;
  const percent = Math.round((saving / deal.price) * 100);
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>YOU SCANNED</Text>
        <Text style={styles.cardName}>{deal.name}</Text>
        <Text style={styles.cardPrice}>£{deal.price.toFixed(2)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>ATI SUGGESTS</Text>
        <Text style={styles.cardName}>{deal.altName}</Text>
        <Text style={styles.cardPrice}>£{deal.altPrice.toFixed(2)}</Text>
      </View>
      <View style={[styles.card, styles.savingCard]}>
        <Text style={[styles.cardLabel, { color: "#E8B41C" }]}>POSSIBLE SAVING</Text>
        <Text style={[styles.cardPrice, { color: "#F6F1E3" }]}>
          £{saving.toFixed(2)} ({percent}% cheaper)
        </Text>
      </View>
    </View>
  );
}

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [info, setInfo] = useState<Info | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showExample, setShowExample] = useState(false);
  const busy = useRef(false);

  const reset = () => {
    busy.current = false;
    setCode(null);
    setInfo(null);
    setFailed(false);
    setLoading(false);
    setShowExample(false);
  };

  const lookup = async (barcode: string) => {
    if (busy.current) return;
    busy.current = true;
    setCode(barcode);
    setInfo(null);
    setFailed(false);
    setLoading(true);
    try {
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,brands,quantity`;
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
      const json = await res.json();
      if (json.status === 1 && json.product) {
        const found = {
          name: json.product.product_name || "Name not listed",
          brand: json.product.brands || "",
          quantity: json.product.quantity || "",
        };
        setInfo(found);
        await saveScan({ code: barcode, ...found, time: Date.now() });
      } else {
        await saveScan({ code: barcode, name: "Unknown product", brand: "", quantity: "", time: Date.now() });
      }
    } catch {
      setFailed(true);
    }
    setLoading(false);
  };

  let content;

  if (showExample) {
    content = (
      <ScrollView>
        <Comparison deal={EXAMPLE} />
        <Text style={styles.note}>Example prices only - not checked against real shops.</Text>
      </ScrollView>
    );
  } else if (code) {
    const deal = SAMPLE_PRICES[code];
    content = (
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>BARCODE {code}</Text>
          {loading && <ActivityIndicator color={GREEN} style={{ marginVertical: 12 }} />}
          {info && (
            <>
              <Text style={styles.cardPrice}>{info.name}</Text>
              <Text style={styles.cardName}>
                {[info.brand, info.quantity].filter(Boolean).join(" - ")}
              </Text>
            </>
          )}
          {!loading && !info && !failed && (
            <Text style={styles.cardName}>
              Product not found in Open Food Facts. Its data is added by volunteers, so some products are missing.
            </Text>
          )}
          {failed && (
            <Text style={styles.cardName}>Couldn't look this up. Check your internet connection and try again.</Text>
          )}
        </View>
        {deal ? (
          <>
            <Comparison deal={deal} />
            <Text style={styles.note}>Prices from our own price list - check the date they were collected.</Text>
          </>
        ) : (
          !loading && <Text style={styles.note}>We don't have prices for this product yet.</Text>
        )}
        <Text style={styles.note}>Product information: Open Food Facts</Text>
      </ScrollView>
    );
  } else if (!permission) {
    content = <View style={{ flex: 1 }} />;
  } else if (!permission.granted) {
    content = (
      <View style={styles.center}>
        <Text style={styles.cardName}>ATI needs your camera to scan barcodes.</Text>
        <Pressable style={styles.button} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <View style={{ flex: 1 }}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
          onBarcodeScanned={({ data }) => lookup(data)}
        />
        <Text style={styles.hint}>Point the camera at a product barcode</Text>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Stack.Screen options={{ title: "Scan product" }} />
      {content}
      <View style={styles.actions}>
        {(code || showExample) && (
          <Pressable style={styles.button} onPress={reset} accessibilityRole="button">
            <Text style={styles.buttonText}>Scan another product</Text>
          </Pressable>
        )}
        {!showExample && !code && (
          <Pressable
            style={[styles.button, styles.buttonLight]}
            onPress={() => setShowExample(true)}
            accessibilityRole="button"
          >
            <Text style={[styles.buttonText, { color: GREEN }]}>Try the example product</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: PAGE, padding: 16 },
  camera: { flex: 1, borderRadius: 18, overflow: "hidden" },
  hint: { textAlign: "center", fontSize: 16, color: MUTED, marginTop: 10 },
  center: { flex: 1, justifyContent: "center" },
  card: { backgroundColor: MINT, borderRadius: 18, padding: 18, marginBottom: 12 },
  savingCard: { backgroundColor: GREEN },
  cardLabel: { fontSize: 13, fontWeight: "800", color: MUTED, marginBottom: 4 },
  cardName: { fontSize: 16, color: DARK, fontWeight: "600" },
  cardPrice: { fontSize: 26, fontWeight: "800", color: DARK },
  note: { fontSize: 13, color: MUTED, textAlign: "center", marginTop: 4, marginBottom: 4 },
  actions: { paddingTop: 12, paddingBottom: 12 },
  button: {
    backgroundColor: GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonLight: { backgroundColor: MINT },
  buttonText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
});