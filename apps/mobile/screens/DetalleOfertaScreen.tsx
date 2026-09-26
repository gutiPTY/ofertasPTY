import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";
import AdBanner from "../components/AdBanner";
import { AD_UNIT_DETALLE_BANNER } from "../lib/ads";
import { Button, CategoryPill, PriceTag } from "../components/ui";
import { colors, radii, spacing, textStyles } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Detalle">;

interface OfertaDetalle {
  id: string;
  titulo: string;
  descripcion: string;
  imagenUrl: string;
  precioOriginal: string | null;
  precioOferta: string | null;
  provincia: string;
  distrito: string | null;
  direccion: string | null;
  linkExterno: string | null;
  fechaVencimiento: string;
  categoria: { nombre: string };
}

export default function DetalleOfertaScreen({ route, navigation }: Props) {
  const { slug } = route.params;
  const session = useOptionalSession();

  const [oferta, setOferta] = useState<OfertaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [favorito, setFavorito] = useState(false);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/ofertas/${slug}`)
      .then((res) => res.json())
      .then((data) => setOferta(data.oferta ?? null))
      .finally(() => setLoading(false));
  }, [slug]);

  useFocusEffect(
    useCallback(() => {
      if (!session || !oferta) return;
      fetch(`${process.env.EXPO_PUBLIC_API_URL}/favoritos/mine`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })
        .then((res) => res.json())
        .then((data) =>
          setFavorito(
            (data.favoritos ?? []).some((f: { ofertaId: string }) => f.ofertaId === oferta.id),
          ),
        );
    }, [session, oferta]),
  );

  async function toggleFavorito() {
    if (!session) {
      navigation.navigate("Auth");
      return;
    }
    if (!oferta) return;
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/favoritos/${oferta.id}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      setFavorito((await res.json()).favorito);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.ember} />
      </View>
    );
  }

  if (!oferta) {
    return (
      <View style={styles.center}>
        <Text style={textStyles.body}>No se encontró la oferta.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: oferta.imagenUrl }} style={styles.imagen} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1, gap: spacing.xs }}>
          <CategoryPill nombre={oferta.categoria.nombre} />
          <Text style={styles.titulo}>{oferta.titulo}</Text>
        </View>
        <Button
          variant="secondary"
          label={favorito ? "Guardado" : "Guardar"}
          icon={favorito ? "heart" : "heart-outline"}
          onPress={toggleFavorito}
        />
      </View>

      <PriceTag precioOferta={oferta.precioOferta} precioOriginal={oferta.precioOriginal} />

      <Text style={styles.descripcion}>{oferta.descripcion}</Text>

      <Text style={styles.meta}>
        {oferta.provincia}
        {oferta.distrito ? `, ${oferta.distrito}` : ""}
        {oferta.direccion ? ` — ${oferta.direccion}` : ""}
      </Text>
      <Text style={styles.meta}>
        Vence el {new Date(oferta.fechaVencimiento).toLocaleDateString("es-PA")}
      </Text>
      {oferta.linkExterno && (
        <TouchableOpacity style={styles.linkRow} onPress={() => Linking.openURL(oferta.linkExterno!)}>
          <Text style={styles.link}>Ver más</Text>
          <Ionicons name="open-outline" size={14} color={colors.ember} />
        </TouchableOpacity>
      )}

      <AdBanner unitId={AD_UNIT_DETALLE_BANNER} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.paper },
  container: { padding: spacing.lg, gap: spacing.sm, backgroundColor: colors.paper },
  imagen: { width: "100%", height: 200, borderRadius: radii.card, backgroundColor: colors.surface2 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  titulo: { ...textStyles.sectionHeading, fontSize: 20, color: colors.ink },
  descripcion: { ...textStyles.body, color: colors.ink },
  meta: { ...textStyles.bodyMuted, color: colors.muted },
  linkRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  link: { ...textStyles.body, color: colors.ember },
});
