import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LoginInputSchema, RegisterInputSchema } from "@ofertaspty/shared-types";
import { supabase } from "../lib/supabase";

export default function AuthScreen() {
  const [mode, setMode] = useState<"login" | "registro">("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (mode === "login") {
      const parsed = LoginInputSchema.safeParse({ email, password });
      if (!parsed.success) {
        Alert.alert("Datos inválidos", parsed.error.issues[0]?.message);
        return;
      }

      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword(parsed.data);
      setLoading(false);
      if (error) Alert.alert("Error", error.message);
      return;
    }

    const parsed = RegisterInputSchema.safeParse({ email, password, nombre });
    if (!parsed.success) {
      Alert.alert("Datos inválidos", parsed.error.issues[0]?.message);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: { data: { nombre: parsed.data.nombre } },
    });

    if (!error && data.session) {
      await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ email: parsed.data.email, nombre: parsed.data.nombre }),
      });
    }

    setLoading(false);
    if (error) Alert.alert("Error", error.message);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encuentra Ofertas PTY</Text>

      {mode === "registro" && (
        <TextInput
          style={styles.input}
          placeholder="Nombre"
          value={nombre}
          onChangeText={setNombre}
          autoCapitalize="words"
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>{mode === "login" ? "Ingresar" : "Crear cuenta"}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === "login" ? "registro" : "login")}>
        <Text style={styles.link}>
          {mode === "login" ? "¿No tenés cuenta? Registrate" : "¿Ya tenés cuenta? Ingresá"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, gap: 12 },
  title: { fontSize: 22, fontWeight: "600", textAlign: "center", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 12 },
  button: { backgroundColor: "#000", borderRadius: 8, padding: 14, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  link: { textAlign: "center", marginTop: 12, color: "#333" },
});
