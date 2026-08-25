import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { PROVINCIAS_PANAMA } from "@ofertaspty/shared-types";
import type { RootStackParamList } from "../types/navigation";

type Props = NativeStackScreenProps<RootStackParamList, "Feed">;

interface Categoria {
  id: string;
  nombre: string;
}

interface OfertaFeed {
  id: string;
  slug: string;
  titulo: string;
  imagenUrl: string;
  provincia: string;
  precioOferta: string | null;
  precioOriginal: string | null;
  categoria: { nombre: string };
}

export default function FeedScreen({ navigation }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaId, setCategoriaId] = useState<string | null>(null);
  const [provincia, setProvincia] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [ofertas, setOfertas] = useState<OfertaFeed[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/categorias`)
      .then((res) => res.json())
      .then((data) => setCategorias(data.categorias ?? []))
      .catch(() => setCategorias([]));
  }, []);

  const fetchFeed = useCallback(() => {
    const params = new URLSearchParams();
    if (categoriaId) params.set("categoriaId", categoriaId);
    if (provincia) params.set("provincia", provincia);
    if (q) params.set("q", q);

    setLoading(true);
    fetch(`${process.env.EXPO_PUBLIC_API_URL}/ofertas?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setOfertas(data.ofertas ?? []))
      .finally(() => setLoading(false));
  }, [categoriaId, provincia, q]);

  useFocusEffect(
    useCallback(() => {
      fetchFeed();
    }, [fetchFeed]),
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.cuentaButton} onPress={() => navigation.navigate("Cuenta")}>
          <Text style={styles.cuentaButtonText}>Cuenta</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Buscar ofertas..."
        value={q}
        onChangeText={setQ}
        onSubmitEditing={fetchFeed}
        returnKeyType="search"
      />

      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, !provincia && styles.chipSelected]}
          onPress={() => setProvincia(null)}
        >
          <Text style={!provincia ? styles.chipTextSelected : styles.chipText}>Todas las provincias</Text>
        </TouchableOpacity>
        {PROVINCIAS_PANAMA.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.chip, provincia === p && styles.chipSelected]}
            onPress={() => setProvincia(provincia === p ? null : p)}
          >
            <Text style={provincia === p ? styles.chipTextSelected : styles.chipText}>{p}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chips}>
        <TouchableOpacity
          style={[styles.chip, !categoriaId && styles.chipSelected]}
          onPress={() => setCategoriaId(null)}
        >
          <Text style={!categoriaId ? styles.chipTextSelected : styles.chipText}>Todas las categorías</Text>
        </TouchableOpacity>
        {categorias.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, categoriaId === c.id && styles.chipSelected]}
            onPress={() => setCategoriaId(categoriaId === c.id ? null : c.id)}
          >
            <Text style={categoriaId === c.id ? styles.chipTextSelected : styles.chipText}>{c.nombre}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          contentContainerStyle={styles.list}
          data={ofertas}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={{ gap: 10 }}
          ListEmptyComponent={<Text style={styles.empty}>No hay ofertas que coincidan.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Detalle", { slug: item.slug })}
            >
              <Image source={{ uri: item.imagenUrl }} style={styles.cardImage} />
              <Text style={styles.cardCategoria}>
                {item.categoria.nombre} · {item.provincia}
              </Text>
              <Text style={styles.cardTitulo} numberOfLines={2}>
                {item.titulo}
              </Text>
              {item.precioOferta && <Text style={styles.cardPrecio}>${item.precioOferta}</Text>}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, gap: 8 },
  headerRow: { flexDirection: "row", justifyContent: "flex-end" },
  cuentaButton: { borderWidth: 1, borderColor: "#ccc", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 },
  cuentaButtonText: { fontSize: 13, fontWeight: "600" },
  search: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, padding: 10 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1, borderColor: "#ccc", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5 },
  chipSelected: { backgroundColor: "#000", borderColor: "#000" },
  chipText: { fontSize: 12 },
  chipTextSelected: { fontSize: 12, color: "#fff" },
  list: { gap: 10, paddingTop: 8, paddingBottom: 24 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: { flex: 1, borderWidth: 1, borderColor: "#eee", borderRadius: 8, overflow: "hidden", marginBottom: 10 },
  cardImage: { width: "100%", height: 100 },
  cardCategoria: { fontSize: 11, color: "#666", paddingHorizontal: 8, paddingTop: 4 },
  cardTitulo: { fontSize: 13, fontWeight: "600", paddingHorizontal: 8, paddingTop: 2 },
  cardPrecio: { fontSize: 13, fontWeight: "700", paddingHorizontal: 8, paddingBottom: 8, paddingTop: 2 },
});
