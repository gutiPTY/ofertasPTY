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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useOptionalSession } from "../context/SessionContext";
import type { RootStackParamList } from "../types/navigation";

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
        <ActivityIndicator />
      </View>
    );
  }

  if (!oferta) {
    return (
      <View style={styles.center}>
        <Text>No se encontró la oferta.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: oferta.imagenUrl }} style={styles.imagen} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoria}>{oferta.categoria.nombre}</Text>
          <Text style={styles.titulo}>{oferta.titulo}</Text>
        </View>
        <TouchableOpacity style={styles.favButton} onPress={toggleFavorito}>
          <Text>{favorito ? "★ Guardado" : "☆ Guardar"}</Text>
        </TouchableOpacity>
      </View>

      {oferta.precioOferta && (
        <Text style={styles.precio}>
          ${oferta.precioOferta}
          {oferta.precioOriginal && <Text style={styles.precioOriginal}> ${oferta.precioOriginal}</Text>}
        </Text>
      )}

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
        <TouchableOpacity onPress={() => Linking.openURL(oferta.linkExterno!)}>
          <Text style={styles.link}>Ver más</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { padding: 16, gap: 8 },
  imagen: { width: "100%", height: 200, borderRadius: 8 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  categoria: { fontSize: 12, color: "#666" },
  titulo: { fontSize: 20, fontWeight: "700" },
  favButton: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  precio: { fontSize: 18, fontWeight: "700" },
  precioOriginal: { fontSize: 14, color: "#999", textDecorationLine: "line-through" },
  descripcion: { fontSize: 14, color: "#333" },
  meta: { fontSize: 12, color: "#666" },
  link: { fontSize: 13, color: "#00f", textDecorationLine: "underline" },
});
