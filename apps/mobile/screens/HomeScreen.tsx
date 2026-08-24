import type { Session } from "@supabase/supabase-js";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function HomeScreen({ session }: { session: Session }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encuentra Ofertas PTY</Text>
      <Text>
        Sesión iniciada como <Text style={{ fontWeight: "600" }}>{session.user.email}</Text>
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: "600" },
  button: { backgroundColor: "#000", borderRadius: 8, padding: 14, marginTop: 12 },
  buttonText: { color: "#fff", fontWeight: "600" },
});
