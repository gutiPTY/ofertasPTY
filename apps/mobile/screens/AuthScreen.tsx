import { useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { LoginInputSchema, RegisterInputSchema } from "@ofertaspty/shared-types";
import { supabase } from "../lib/supabase";
import type { RootStackParamList } from "../types/navigation";

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, "Auth">;

async function syncUsuario(accessToken: string, email: string, nombre: string) {
  await fetch(`${process.env.EXPO_PUBLIC_API_URL}/auth/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ email, nombre }),
  });
}

export default function AuthScreen({ navigation }: Props) {
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
      if (error) {
        Alert.alert("Error", error.message);
        return;
      }
      if (navigation.canGoBack()) navigation.goBack();
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
      await syncUsuario(data.session.access_token, parsed.data.email, parsed.data.nombre);
    }

    setLoading(false);
    if (error) {
      Alert.alert("Error", error.message);
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    try {
      const redirectTo = AuthSession.makeRedirectUri();
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo, skipBrowserRedirect: true },
      });
      if (error || !data.url) throw error ?? new Error("No se pudo iniciar el flujo de Google");

      const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      if (result.type !== "success") return;

      const { queryParams } = Linking.parse(result.url);
      const code = queryParams?.code;
      if (typeof code !== "string") {
        throw new Error("La respuesta de Google no incluyó un código válido");
      }

      const { data: sessionData, error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError || !sessionData.session) throw exchangeError;

      const user = sessionData.session.user;
      const nombreGoogle =
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        user.email ??
        "Usuario";
      await syncUsuario(sessionData.session.access_token, user.email!, nombreGoogle);
      if (navigation.canGoBack()) navigation.goBack();
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "No se pudo iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
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

      <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loading}>
        <Text style={styles.googleButtonText}>Continuar con Google</Text>
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
  googleButton: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, alignItems: "center" },
  googleButtonText: { fontWeight: "600" },
  link: { textAlign: "center", marginTop: 12, color: "#333" },
});
