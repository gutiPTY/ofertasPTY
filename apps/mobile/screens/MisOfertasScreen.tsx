import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";
import { Badge, Card } from "../components/ui";
import { colors, spacing, textStyles } from "../theme";

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

const ESTADO_TONE: Record<OfertaConModeracion["estado"], "success" | "warning" | "critical" | "muted"> = {
  PENDIENTE: "warning",
  PUBLICADA: "success",
  RECHAZADA: "critical",
  EXPIRADA: "muted",
  EN_REVISION: "muted",
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
        <ActivityIndicator color={colors.ember} />
      </View>
    );
  }

  return (
    <FlatList
      style={styles.background}
      contentContainerStyle={styles.list}
      data={ofertas}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<Text style={styles.empty}>Todavía no publicaste ninguna oferta.</Text>}
      renderItem={({ item }) => (
        <Card style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.titulo}>{item.titulo}</Text>
            <Badge label={ESTADO_LABEL[item.estado]} tone={ESTADO_TONE[item.estado]} />
          </View>
          <Text style={styles.categoria}>{item.categoria.nombre}</Text>
          {item.estado === "RECHAZADA" && item.moderaciones[0]?.motivo && (
            <Text style={styles.motivo}>Motivo: {item.moderaciones[0].motivo}</Text>
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  background: { backgroundColor: colors.paper },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.paper },
  list: { padding: spacing.lg, gap: spacing.sm },
  empty: { ...textStyles.bodyMuted, color: colors.muted, textAlign: "center", marginTop: spacing.xxl },
  card: { padding: spacing.md },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: spacing.sm },
  titulo: { ...textStyles.cardTitle, color: colors.ink, flexShrink: 1 },
  categoria: { ...textStyles.bodyMuted, color: colors.muted, marginTop: 2 },
  motivo: { ...textStyles.bodyMuted, color: colors.critical, marginTop: spacing.xs },
});
