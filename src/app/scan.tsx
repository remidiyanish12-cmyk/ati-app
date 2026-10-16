import { CameraView, useCameraPermissions } from "expo-camera";
import { Stack } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// ATI colours
const GREEN = "#1B5E3B";
const DARK = "#123D26";
const MINT = "#E6F2EA";
const PAGE = "#F7FAF8";
const MUTED = "#4A5A50";

// EXAMPLE DATA ONLY - not real prices
const EXAMPLE = {
  name: "Brand-name baked beans (400g)",
  price: 2.0,
  altName: "Supermarket own-brand baked beans (400g)",
  altPrice: 1.5,
};

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [code, setCode] = useState<string | null>(null);
  const [showExample, setShowExample] = useState(false);

  const reset = () => {
    setCode(null);
    setShowExample(false);
  };

  const saving = EXAMPLE.price - EXAMPLE.altPrice;
  const percent = Math.round((saving / EXAMPLE.price) * 100);

  let content;

  if (showExample) {
    content = (
      <View style={styles.resultWrap}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>YOU SCANNED</Text>
          <Text style={styles.cardName}>{EXAMPLE.name}</Text>
          <Text style={styles.cardPrice}>£{EXAMPLE.price.toFixed(2)}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>ATI SUGGESTS</Text>
          <Text style={styles.cardName}>{EXAMPLE.altName}</Text>
          <Text style={styles.cardPrice}>£{EXAMPLE.altPrice.toFixed(2)}</Text>
        </View>
        <View style={[styles.card, styles.savingCard]}>
          <Text style={[styles.cardLabel, { color: "#E8B41C" }]}>POSSIBLE SAVING</Text>
          <Text style={[styles.cardPrice, { color: "#F6F1E3" }]}>
            £{saving.toFixed(2)} ({percent}% cheaper)
          </Text>
        </View>
        <Text style={styles.note}>Example prices only - not checked against real shops.</Text>
      </View>
    );
  } else if (code) {
    content = (
      <View style={styles.resultWrap}>
        <View style={styles.card}>
          <Text style={styles.cardLabel}>BARCODE SCANNED</Text>
          <Text style={styles.cardPrice}>{code}</Text>
          <Text style={styles.cardName}>
            We don't have prices for this product yet. Real price data will be added in a later step.
          </Text>
        </View>
      </View>
    );
  } else if (!permission) {
    content = <View style={styles.resultWrap} />;
  } else if (!permission.granted) {
    content = (
      <View style={styles.resultWrap}>
        <Text style={styles.cardName}>ATI needs your camera to scan barcodes.</Text>
        <Pressable style={styles.button} onPress={requestPermission} accessibilityRole="button">
          <Text style={styles.buttonText}>Allow camera</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <View style={styles.cameraWrap}>
        <CameraView
          style={styles.camera}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"] }}
          onBarcodeScanned={({ data }) => setCode(data)}
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
        {!showExample && (
          <Pressable
            style={[styles.button, styles.buttonLight]}
            onPress={() => {
              setCode(null);
              setShowExample(true);
            }}
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
  cameraWrap: { flex: 1 },
  camera: { flex: 1, borderRadius: 18, overflow: "hidden" },
  hint: { textAlign: "center", fontSize: 16, color: MUTED, marginTop: 10 },
  resultWrap: { flex: 1, justifyContent: "center" },
  card: { backgroundColor: MINT, borderRadius: 18, padding: 18, marginBottom: 12 },
  savingCard: { backgroundColor: GREEN },
  cardLabel: { fontSize: 13, fontWeight: "800", color: MUTED, marginBottom: 4 },
  cardName: { fontSize: 16, color: DARK, fontWeight: "600" },
  cardPrice: { fontSize: 30, fontWeight: "800", color: DARK },
  note: { fontSize: 13, color: MUTED, textAlign: "center", marginTop: 4 },
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