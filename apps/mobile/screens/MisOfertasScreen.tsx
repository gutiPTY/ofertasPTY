import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "MisOfertas">;

interface OfertaConModeracion {
  id: string;
  titulo: string;
  estado: "PENDIENTE" | "PUBLICADA" | "RECHAZADA" | "EXPIRADA" | "EN_REVISION";
  categoria: { nombre: string };
  moderaciones: { motivo: string | null }[];
}

const ESTADO_LABEL: Record<OfertaConModeracion["estado"], string> = {
  PENDIENTE: "Pendiente",
  PUBLICADA: "Publicada",
  RECHAZADA: "Rechazada",
  EXPIRADA: "Expirada",
  EN_REVISION: "En revisión",
};

export default function MisOfertasScreen({ navigation }: Props) {
  const session = useOptionalSession();
  const [ofertas, setOfertas] = useState<OfertaConModeracion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session) navigation.replace("Auth");
  }, [session, navigation]);

  useFocusEffect(
    useCallback(() => {
      if (!session) return;
      let active = true;
      setLoading(true);
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/ofertas/mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (active) setOfertas(data.ofertas ?? []);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }, [session]),
  );

  if (!session || loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={ofertas}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no publicaste ninguna oferta.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Text style={styles.badge}>{ESTADO_LABEL[item.estado]}</Text>
          </View>
          <Text style={styles.categoria}>{item.categoria.nombre}</Text>
          {item.estado === "RECHAZADA" && item.moderaciones[0]?.motivo && (
            <Text style={styles.motivo}>Motivo: {item.moderaciones[0].motivo}</Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: { borderWidth: 1, borderColor: "#eee", borderRadius: 8, padding: 12, marginBottom: 10 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titulo: { fontWeight: "600", flexShrink: 1 },
  badge: { fontSize: 12, backgroundColor: "#f2f2f2", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  categoria: { fontSize: 13, color: "#666", marginTop: 2 },
  motivo: { fontSize: 13, color: "#c00", marginTop: 4 },
});
