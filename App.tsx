import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import PayscribeCheckout, {
  type PayscribeCheckoutResult,
  type PayscribeCheckoutSession,
} from "@payscribe/checkout-react-native";

const defaultServerUrl = Platform.select({
  android: "http://10.0.2.2:4000",
  default: "http://localhost:4000",
});

export default function App() {
  const [name, setName] = useState("Ada Lovelace");
  const [email, setEmail] = useState("ada@example.com");
  const [phone, setPhone] = useState("08012345678");
  const [session, setSession] = useState<
    (PayscribeCheckoutSession & {
      checkoutPublicKey?: string;
      business_name?: string;
      businessName?: string;
      business?: { name?: string };
    }) | null
  >(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const serverUrl = useMemo(
    () => (process.env.EXPO_PUBLIC_CHECKOUT_SERVER_URL || defaultServerUrl).replace(/\/$/, ""),
    []
  );
  const sessionMerchantName =
    session?.business?.name || session?.business_name || session?.businessName;

  async function startCheckout() {
    if (!name.trim() || !email.trim() || !phone.trim()) {
      setError("Enter the customer's name, email, and phone number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${serverUrl}/api/checkout-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), phone: phone.trim() }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body.token) {
        throw new Error(body.message || "The server did not return a checkout token.");
      }
      console.log("Checkout session received by Expo:", {
        ...body,
        checkoutPublicKey: body.checkoutPublicKey ? "[REDACTED]" : undefined,
      });
      setSession(body);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to create checkout session."
      );
    } finally {
      setLoading(false);
    }
  }

  function paymentSucceeded(result: PayscribeCheckoutResult) {
    Alert.alert(
      "Payment successful",
      result.reference ? `Reference: ${result.reference}` : "Your payment was completed."
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.screen}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandMark}>
            <Text style={styles.brandLetter}>P</Text>
          </View>
          <Text style={styles.eyebrow}>PAYSCRIBE CHECKOUT</Text>
          <Text style={styles.heading}>Test hosted checkout on mobile</Text>
          <Text style={styles.description}>
            Create a secure session through the local server, then complete airtime,
            data, electricity, cable TV, or betting checkout inside the native modal.
          </Text>

          <View style={styles.card}>
            <Field label="Customer name" value={name} onChangeText={setName} />
            <Field
              label="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Field
              label="Phone number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <Pressable
              accessibilityRole="button"
              disabled={loading}
              onPress={startCheckout}
              style={({ pressed }) => [
                styles.button,
                pressed && styles.buttonPressed,
                loading && styles.buttonDisabled,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Open checkout</Text>
              )}
            </Pressable>
          </View>

          <Text style={styles.serverHint}>Session server: {serverUrl}</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      <PayscribeCheckout
        visible={session !== null}
        sessionToken={session?.token}
        canvasUrl={session?.canvas_url}
        publicKey={session?.checkoutPublicKey}
        title={sessionMerchantName ? `${sessionMerchantName} Checkout` : "Checkout"}
        onSuccess={paymentSucceeded}
        onError={(checkoutError) => {
          if (checkoutError.message) setError(checkoutError.message);
        }}
        onClose={() => setSession(null)}
      />
    </SafeAreaView>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { label: string };

function Field({ label, ...props }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#98a2b3"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: "#f4f7ff" },
  screen: { flexGrow: 1, justifyContent: "center", padding: 24, paddingVertical: 48 },
  brandMark: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    backgroundColor: "#214dc0",
  },
  brandLetter: { color: "#ffffff", fontSize: 23, fontWeight: "800" },
  eyebrow: { marginTop: 24, color: "#214dc0", fontSize: 12, fontWeight: "800", letterSpacing: 1.5 },
  heading: { marginTop: 10, color: "#020413", fontSize: 32, fontWeight: "800", lineHeight: 39 },
  description: { marginTop: 12, color: "#667085", fontSize: 15, lineHeight: 23 },
  card: {
    marginTop: 28,
    gap: 17,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e1e6f0",
    borderRadius: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#0b1536",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  field: { gap: 7 },
  label: { color: "#344054", fontSize: 13, fontWeight: "700" },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#d7deea",
    borderRadius: 11,
    backgroundColor: "#ffffff",
    color: "#020413",
    fontSize: 16,
  },
  error: { color: "#b42318", fontSize: 13, lineHeight: 19 },
  button: { minHeight: 52, alignItems: "center", justifyContent: "center", borderRadius: 12, backgroundColor: "#214dc0" },
  buttonPressed: { backgroundColor: "#193fa5" },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  serverHint: { marginTop: 18, color: "#98a2b3", fontSize: 11, textAlign: "center" },
});
