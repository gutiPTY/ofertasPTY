import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { supabase } from "../lib/supabase";
import { useSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Home">;

export default function HomeScreen({ navigation }: Props) {
  const session = useSession();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Encuentra Ofertas PTY</Text>
      <Text>
        Sesión iniciada como <Text style={{ fontWeight: "600" }}>{session.user.email}</Text>
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Publicar")}>
        <Text style={styles.buttonText}>Publicar oferta</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate("MisOfertas")}>
        <Text style={styles.secondaryButtonText}>Mis ofertas</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.secondaryButtonText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
  title: { fontSize: 22, fontWeight: "600" },
  button: { backgroundColor: "#000", borderRadius: 8, padding: 14, marginTop: 12, minWidth: 200, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  secondaryButton: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 14, minWidth: 200, alignItems: "center" },
  secondaryButtonText: { fontWeight: "600" },
});
